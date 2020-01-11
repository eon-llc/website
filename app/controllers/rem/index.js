import Controller from '@ember/controller';
import axios from 'axios';

export default Controller.extend({
    api_status: false,

    init() {
        this._super();
    },
    actions: {
        loadAPIHealth() {
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