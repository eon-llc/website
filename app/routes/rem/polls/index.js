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
                "reverse": true,
                "limit":1000,
                "json":true
            },
        })
        .then( response => {
            return response.data.rows;
        })
        .catch(() => { return false; });
    },
    activate: function() {
        this._super();
        window.scrollTo(0, 0);
    }
});