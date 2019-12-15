import Controller from '@ember/controller';
import ENV from 'website/config/environment';
import axios from 'axios';

export default Controller.extend({
    voteURL: ENV.APP.voteURL,
    blog_stats: false,
    github_stats: false,
    api_status: false,

    init() {
        this._super();
        this.send('loadData');
    },

    actions: {
        loadData() {

            axios({
                method: 'get',
                url: 'https://api.eon.llc/v1/blog'
            })
            .then((response) => {
                this.set('blog_stats', JSON.parse(response.data.body));
            })
            .catch(() => { return false; });

            axios({
                    method: 'get',
                    url: 'https://api.eon.llc/v1/github'
            })
            .then((response) => {
                this.set('github_stats', JSON.parse(response.data.body));
            })
            .catch(() => { return false; });

            axios({
                method: 'get',
                url: 'https://rem.eon.llc/v2/health'
            })
            .then((response) => {
                let required = 4;
                let { health } = response.data;
                let healthy = 0;
                let status;

                for(let service in health) {
                    healthy += health[service].status === "OK" ? 1 : 0
                }

                if(healthy == required) {
                    status = "online";
                } else if(healthy > 0) {
                    status = "impaired";
                } else {
                    status = "offline";
                }

                this.set('api_status', status);
            })
            .catch(() => { return "offline"; });
        }
    }
});
