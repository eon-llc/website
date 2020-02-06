import Route from '@ember/routing/route';
import axios from 'axios';
import RSVP from 'rsvp';

export default Route.extend({
    model(params) {
        return RSVP.hash({
            poll: this.getPoll(params.id),
            votes: this.getVotes(params.id),
            comments: this.getComments(params.id),
        });
    },
    afterModel(model) {
        if (!model.poll) {
            this.transitionTo('rem.polls.index');
        }
    },
    getPoll(id) {
        return axios({
            method: 'post',
            url: 'https://rem.eon.llc/v1/chain/get_table_rows',
            data: {
                "table":"polls",
                "scope":"pollingremme",
                "code":"pollingremme",
                "lower_bound": id,
                "upper_bound": id,
                "limit":1,
                "json":true
            },
        })
        .then( response => {
            return response.data.rows ? response.data.rows[0] : false;
        })
        .catch(() => { return false; });
    },
    getVotes(id) {
        return axios({
            method: 'post',
            url: 'https://rem.eon.llc/v1/chain/get_table_rows',
            data: {
                "table":"votes",
                "scope":id,
                "code":"pollingremme",
                "limit":1000,
                "json":true
            },
        })
        .then( response => {
            return response.data.rows;
        })
        .catch(() => { return false; });
    },
    getComments(id) {
        return axios({
            method: 'post',
            url: 'https://rem.eon.llc/v1/chain/get_table_rows',
            data: {
                "table":"comments",
                "scope":"pollingremme",
                "code":"pollingremme",
                "lower_bound": id,
                "upper_bound": id,
                "table_key": 'poll_id',
                "limit":1000,
                "json":true,
                "reverse": true,
            },
        })
        .then( response => {
            return response.data.rows;
        })
        .catch(() => { return false; });
    },
    actions: {
        refreshCurrentRoute(){
            this.refresh();
        }
    },
    activate: function() {
        this._super();
        window.scrollTo(0, 0);
    }
});