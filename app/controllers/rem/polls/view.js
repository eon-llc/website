import Controller, { inject as controller } from '@ember/controller';
import ENV from 'website/config/environment';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import ScatterJS from '@scatterjs/core';
import ScatterEOS from '@scatterjs/eosjs2';
import {JsonRpc, Api} from 'eosjs';
import { htmlSafe } from '@ember/template';

ScatterJS.plugins( new ScatterEOS() );

const network = ScatterJS.Network.fromJson(ENV.APP.RemmeNetwork);

const rpc = new JsonRpc(network.fullhost());

export default Controller.extend({

    notifications: service('toast'),

    parent: controller('rem.index'),
    account: computed.alias('parent.account'),
    poll: computed.alias('model.poll'),
    votes: computed.alias('model.votes'),
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

    init() {
        this._super();

        this.line_chart_options = {
            responsive: true,
            spanGaps: false,
            options: {
                responsive: true,
                maintainAspectRatio: false,
            },
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
                    display: false,
                    scaleLabel: {
                        display: true,
                        labelString: 'Time'
                    }
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Exec. time (ms)'
                    }
                }]
            },
        };
    },

    actions: {
        castVote() {

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
                    }).catch( () => {
                        this.notifications.error(`Something went wrong and we couldn't cast your vote.`, 'Failed to Vote');
                        submit_btn.disabled = false;
                        submit_btn.innerText = 'Vote';
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