import Controller, { inject as controller } from '@ember/controller';
import ENV from 'website/config/environment';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import ScatterJS from '@scatterjs/core';
import ScatterEOS from '@scatterjs/eosjs2';
import {JsonRpc, Api, RpcError} from 'eosjs';
import { htmlSafe } from '@ember/template';
import moment from 'moment';

ScatterJS.plugins( new ScatterEOS() );

const network = ScatterJS.Network.fromJson(ENV.APP.RemmeNetwork);

const rpc = new JsonRpc(network.fullhost());

const colors = [
    'rgba(255, 99, 132, 1)',
    'rgba(54, 162, 235, 1)',
    'rgba(255, 206, 86, 1)',
    'rgba(75, 192, 192, 1)',
    'rgba(153, 102, 255, 1)',
    'rgba(255, 159, 64, 1)'
]

export default Controller.extend({

    notifications: service('toast'),

    parent: controller('rem.index'),
    account: computed.alias('parent.account'),
    poll: computed.alias('model.poll'),
    votes: computed.alias('model.votes'),
    comments: computed.alias('model.comments'),
    results: computed('poll', 'votes', 'account', function() {

        const poll = this.get('poll');
        const votes = this.get('votes');
        const account = this.get('account');

        let results = [...poll.options];

        const total = results.reduce(function (total, option) {
            if(poll.is_token_poll) {
                return total + (option.votes / 10000);
            } else {
                return total + option.votes;
            }
        }, 0);

        for(let i=0; i<results.length; i++) {
            for(let k=0; k<votes.length; k++) {
                if(votes[k].user === account.name && i === votes[k].option_id) {
                    results[i].voted = true;
                }

                if(poll.is_token_poll) {
                    results[i].votes = results[i].votes / 10000;
                }

                results[i].percent = results[i].votes / total * 100;
                results[i].width = htmlSafe(`width: ${results[i].percent}%`);
            }
        }

        return results;
    }),
    poll_is_open: computed('poll.expires_at', function() {

        if(this.get('poll.expires_at') === '1970-01-01T00:00:00.000') return true;

        const expires_at = Date.parse(this.get('poll.expires_at'));
        const now = new Date();
        now.setHours(0,0,0,0);
        return expires_at > now;
    }),
    can_vote: computed('votes', 'account', function() {

        const votes = this.get('votes');
        const account = this.get('account');

        for(let i=0; i<votes.length; i++) {
            if(votes[i].user === account.name) return false;
        }

        return true;
    }),
    chart_data: computed('poll', 'votes', function() {

        const poll = this.get('poll');
        const votes = this.get('votes');

        let days = [];
        let datasets = [];
        let tally = [];
        let currentDate = moment(poll.created_at).subtract(1, 'days');

        if(votes.length > 0) {
            const stopDate = moment(votes.lastObject.created_at);

            // x axis of days
            while (currentDate <= stopDate) {
                days.push(moment(currentDate).format('YYYY-MM-DD'));
                currentDate = moment(currentDate).add(1, 'days');
            }
        }

        for(let i=0; i<poll.options.length; i++) {
            for(let d=0; d<days.length; d++) {

                let day_has_votes = false;
                let option = poll.options[i].name;

                for(let v=0; v<votes.length; v++) {

                    let vote_date = moment(votes[v].created_at).format('YYYY-MM-DD');

                    // console.log(poll.options[i], " option");
                    // console.log(votes[v], " vote");
                    // console.log(days[d], " day");
                    // console.log(i === votes[v].option_id, vote_date === days[d]);
                    // console.log("-----------");

                    if(!tally.includes(option)) {
                        tally[option] = 0;
                    }

                    if(!datasets[option]) {
                        datasets[option] = {
                            label: option,
                            data: [],
                            backgroundColor: colors[i],
                            borderColor: colors[i],
                            fill: false
                        }
                    }

                    if(i === votes[v].option_id && vote_date === days[d]) {
                        tally[option] += 1;
                        datasets[option].data.push(tally[option]);
                        day_has_votes = true;
                    }

                }

                if(!day_has_votes) datasets[option].data.push(0);
            }
        }

        let final_dataset = [];
        for (let value of Object.values(datasets)) {
            final_dataset.push(value);
        }

        return {
            labels: days,
            datasets: final_dataset
        };
    }),

    init() {
        this._super();

        this.line_chart_options = {
            responsive: true,
            maintainAspectRatio: false,
            spanGaps: false,
            legend: {
                display: false
            },
            title: {
                display: true,
                text: 'Poll Votes'
            },
            tooltips: {
                mode: 'index',
                intersect: true,
                itemSort: function(i0, i1) {
                    let v0 = i0.yLabel;
                    let v1 = i1.yLabel;
                    return (v0 < v1) ? -1 : (v0 > v1) ? 1 : 0;
                }
            },
            hover: {
                mode: 'nearest',
                intersect: true
            },
            scales: {
                xAxes: [{
                    display: true,
                    scaleLabel: {
                        display: false,
                        labelString: 'Days'
                    }
                }],
                yAxes: [{
                    display: true,
                    ticks: {
                        beginAtZero: true,
                        callback: function (value) { if (Number.isInteger(value)) { return value; } },
                        stepSize: 1
                    },
                    scaleLabel: {
                        display: false,
                        labelString: 'Votes'
                    }
                }]
            },
        };
    },

    actions: {
        castVote() {
            if(!this.account) {
                this.notifications.error(`Please log in before voting.`, 'Not Logged In');
                return false;
            }

            const submit_btn = document.getElementById('submit');
            submit_btn.disabled=true;
            submit_btn.innerText = 'Connecting to Scatter...';

            ScatterJS.connect(ENV.APP.name, {network}).then( connected => {
                if(!connected) {

                    this.notifications.error(`We couldn't detect Scatter, make sure it's open.`, 'No Scatter');

                } else {

                    const eos = ScatterJS.eos(network, Api, {rpc});
                    const selected = document.querySelector('input[name="vote"]:checked').value;
                    const data = {
                        poll_id: this.poll.id,
                        user: this.account.name,
                        option_id: this.getOptionID(this.poll.options, selected),
                    }

                    eos.transact({
                        actions: [{
                            account: 'pollingremme',
                            name: 'vote',
                            authorization: [{
                                actor: this.account.name,
                                permission: this.account.authority,
                            }],
                            data: data
                        }]
                    }, {
                        blocksBehind: 3,
                        expireSeconds: 30,
                    }).then( () => {
                        this.notifications.error(`Your vote has been cast, thanks!`, 'Vote Cast');
                        submit_btn.disabled = false;
                        submit_btn.innerText = 'Vote';
                        this.send("refreshCurrentRoute");
                    }).catch( (e) => {

                        let error = "Something went wrong.";
                        if (e instanceof RpcError) error = e.json.error.details.firstObject.message;

                        this.notifications.error(error, 'Failed to Post');
                        submit_btn.disabled = false;
                        submit_btn.innerText = 'Vote';
                    });
                }
            });
        },
        postComment() {

            if(!this.account) {
                this.notifications.error(`Please log in before commenting.`, 'Not Logged In');
                return false;
            }

            this.set('error', false);

            if(!this.message.length) this.set('error', "Post message can't be blank.");

            if(this.error) return false;

            const submit_btn = document.getElementById('vote');
            submit_btn.disabled=true;
            submit_btn.innerText = 'Connecting to Scatter...';

            ScatterJS.connect(ENV.APP.name, {network}).then( connected => {
                if(!connected) {

                    this.notifications.error(`We couldn't detect Scatter, make sure it's open.`, 'No Scatter');

                } else {

                    const eos = ScatterJS.eos(network, Api, {rpc});
                    const data = {
                        poll_id: this.poll.id,
                        user: this.account.name,
                        message: this.message,
                    }

                    eos.transact({
                        actions: [{
                            account: 'pollingremme',
                            name: 'comment',
                            authorization: [{
                                actor: this.account.name,
                                permission: this.account.authority,
                            }],
                            data: data
                        }]
                    }, {
                        blocksBehind: 3,
                        expireSeconds: 30,
                    }).then( () => {
                        this.notifications.error(`Your comment has been posted.`, 'Comment Posted');
                        submit_btn.disabled = false;
                        submit_btn.innerText = 'Post Comment';
                        this.message = "";
                        this.send("refreshCurrentRoute");
                    }).catch( (e) => {

                        let error = "Something went wrong.";
                        if (e instanceof RpcError) error = e.json.error.details.firstObject.message;

                        this.notifications.error(error, 'Failed to Post');
                        submit_btn.disabled = false;
                        submit_btn.innerText = 'Post Comment';
                    });
                }
            });
        },
        scatterLogin(){
            this.get('parent').send('scatterLogin');
        },
        scatterLogout(){
            this.get('parent').send('scatterLogout');
        },
    },
    getOptionID(options, option) {
        for(let i=0; i<options.length; i++){
            if(options[i].name === option) return i;
        }
        return false;
    }
});