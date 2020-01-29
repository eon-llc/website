import Route from '@ember/routing/route';
import axios from 'axios';
import RSVP from 'rsvp';

export default Route.extend({
    model() {
        return RSVP.hash({
            polls: this.getPolls(),
        });
    },
    getPolls() {
        return axios({
            method: 'post',
            url: 'https://rem.eon.llc/v1/chain/get_table_rows',
            data: {
                "table":"polls",
                "scope":"pollingremme",
                "code":"pollingremme",
                "limit":1000,
                "json":true
            },
        })
        .then(async (response) => {
            console.log(response.data.rows);

            return true;
        })
        .catch(() => { return false; });
    }
});