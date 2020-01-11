import Controller from '@ember/controller';
import axios from 'axios';
import { set } from '@ember/object';

export default Controller.extend({
    queryParams: ['account'],
    account: null,
    show_all: true,
    loading: true,

    init() {
        this._super();
        this.set('bp_jsons', []);
        this.set('types', {});
    },
    actions: {
        toggle_show(type_name) {
            let types = this.get("types");
            let timeout = this.get("timeout");

            types.forEach((type) => {
                if(type.name == type_name) {
                    set(type, "show", !type.show);
                }
            });

            this.set("types", types);

            clearTimeout(timeout);
            this.update();
        },
        parse() {

            this.set('error', false);
            this.set("loading", true);

            axios({
                method: 'post',
                url: 'https://rem.eon.llc/v1/chain/get_table_rows',
                data: {
                    "table":"producers",
                    "scope":"rem",
                    "code":"rem",
                    "limit":1000,
                    "json":true
                },
            })
            .then(async (response) => {
                const producers = response.data.rows;//.filter(prod => prod.top21_chosen_time != null_date);
                let map = document.getElementById("map-svg");
                let chart_height = map.clientHeight;
                let chart_width = map.clientWidth;
                let bp_jsons = this.get('bp_jsons');
                let most_recent = 6;
                let promises = [];

                this.set('producers', producers);

                producers.forEach(prod => {
                    let now = new Date().valueOf();
                    let last_block = new Date(prod.last_block_time + "Z").valueOf();

                    if((now - last_block) / 1000 < most_recent) {
                        this.set('current', prod.owner)
                    }

                    if(bp_jsons.length == 0) {
                        promises.push(axios.get(prod.url.replace(/\/$/, "") + "/bp.json").catch(() => { this.set('error', "Failed to fetch bp.json."); }));
                    }
                });

                if(bp_jsons.length == 0) {
                    await axios.all(promises)
                    .then((values) => {
                        this.set('bp_jsons', values);
                    })
                    .catch(() => { this.set('error', "Failed to fetch bp.json."); });
                }

                this.draw(chart_height, chart_width);

            })
            .catch(() => { this.set('error', "Failed to fetch producers."); });
        }
    },
    draw(chart_height, chart_width) {
        let markers = [];
        let types = [];
        const null_date = "1970-01-01T00:00:00.000";
        const producers = this.get('producers');
        const bp_jsons = this.get('bp_jsons');

        bp_jsons.forEach( (val, index) => {
            if(val && typeof val.data === 'object' && val.data !== null) {
                const p = val.data;
                p.nodes.forEach( node => {
                    if(node.location.latitude && node.location.longitude) {

                        let active = producers[index].top21_chosen_time != null_date;
                        let miller = this.millerProjection(node.location.latitude, node.location.longitude, chart_width);
                        let y = miller[1] - 45; // ((-1 * node.location.latitude) + 90) * (chart_height / 180);
                        let x = miller[0] - 38; // (node.location.longitude + 180) * (chart_width / 360);
                        let marker = {y, x, active, name: p.producer_account_name, type: node.node_type}
                        markers.push(marker);

                        if(!types.includes(node.node_type)) { types.push(node.node_type); }
                    }
                });
            }
        });

        this.set("types", types.map(type => { return {name: type, show: true} }));

        document.getElementById("markers").innerHTML = "";

        for (var i = 0; i < markers.length; i++) {
            let marker = markers[i];
            let active = marker.active ? "active" : "inactive";

            let circle = document.createElement("span");
            circle.setAttribute('style',`left: ${marker.x / chart_width * 100}%; top: ${marker.y / chart_height * 100}%`);

            let popover = document.createElement("div");
            let arrow = document.createElement("div");
            let body = document.createElement("div");

            popover.setAttribute("class", "popover fade show bs-popover-top");
            arrow.setAttribute("class", "arrow");
            body.setAttribute("class", "popover-body");

            body.innerHTML = `<h5>${marker.name}</h5><span>${marker.type} (${active})</span>`;
            popover.appendChild(arrow);
            popover.appendChild(body);

            if (marker.active && marker.type == "producer") {
                circle.setAttribute('class', 'marker active' );
            } else {
                circle.setAttribute('class', 'marker' );
            }

            circle.setAttribute('data-producer', marker.name);
            circle.setAttribute('data-type', marker.type);

            circle.appendChild(popover);

            document.getElementById("markers").appendChild(circle);
        }

        this.set("loading", false);
        this.update();
    },
    update() {

        let current;
        let current_is_found = false;
        let markers = document.querySelectorAll(".marker");
        let placeholder = document.getElementById("producing-placeholder");
        let types = this.get("types");

        axios({
            method: 'get',
            url: 'http://rem.eon.llc/v1/chain/get_info',
        })
        .then((response) => {
            current = response.data.head_block_producer;

            markers.forEach((marker) => {

                if(marker.getAttribute('data-type') === "producer") {
                    if(marker.getAttribute('data-producer') === current && marker.classList.contains("active")) {
                        current_is_found = true;
                        marker.classList.add("producing");
                    } else {
                        marker.classList.remove("producing");
                    }
                }

                types.forEach((type) => {
                    if(marker.getAttribute('data-type') == type.name) {
                        if (type.show) {
                            marker.classList.remove("hidden");
                        } else {
                            marker.classList.add("hidden");
                        }
                    }
                });
            });

            if(!current_is_found) {
                placeholder.innerHTML = `<strong>${current}</strong> does not have a bp.json.`
                placeholder.classList.remove("hidden");
            } else {
                placeholder.classList.add("hidden");
            }

            let timeout = setTimeout(() => { this.update() }, 1000);

            this.set("timeout", timeout);
        });
    },
    millerProjection(lat, lng, width) {

        lng = this.toRadian(lng);
        lat = this.toRadian(lat);

        // Miller Projection
        var x = lng;
        var y = -1.25*Math.log(Math.tan(Math.PI/4+0.4*(lat)));

        var scale = width/Math.PI/2;
        x *= scale;
        y *= scale;

        x += width/2;
        y += width/2*0.7331989845

        return [x,y];

    },
    sec(value) {
        return 1/Math.cos(value);
    },
    toRadian(value) {
        return value * Math.PI / 180;
    }
});