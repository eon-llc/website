import Controller, { inject as controller } from '@ember/controller';
import ENV from 'website/config/environment';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import ScatterJS from '@scatterjs/core';
import ScatterEOS from '@scatterjs/eosjs2';
import {JsonRpc, Api, RpcError} from 'eosjs';

ScatterJS.plugins( new ScatterEOS() );

const network = ScatterJS.Network.fromJson(ENV.APP.RemmeNetwork);

const rpc = new JsonRpc(network.fullhost());

export default Controller.extend({

    notifications: service('toast'),

    parent: controller('rem.index'),
    account: computed.alias('parent.account'),
    options: false,
    subject: "",
    description: "",
    is_token_poll: false,
    producers_only: false,
    guardians_only: false,
    enable_expiration: false,
    expires_at: false,
    error: false,

    can_remove_option: computed.gt('options.length', 2),
    can_add_option: computed.lt('options.length', 10),

    init() {
        this._super();
        this.set('options', [{name: "Yes"}, {name: "No"}]);

        let d = new Date()
        d.setDate(d.getDate() + 1)
        this.set("minDate", d);
    },
    actions: {
        scatterLogin(){
            this.get('parent').send('scatterLogin');
        },
        scatterLogout(){
            this.get('parent').send('scatterLogout');
        },
        addOption() {
            this.get('options').pushObject({name: ""});
        },
        removeOption(option) {
            this.get('options').removeObject(option);
        },
        validate() {

            this.set('error', false);

            if(!this.subject.length) this.set('error', "Subject can't be blank.")
            if(this.subject.length > 140) this.set('error', "Subject should be no longer than 140 characters.")
            if(this.options.length < 2) this.set('error', "A poll must have at least 2 options.")
            if(this.options.length > 10) this.set('error', "A poll can have no more than 10 options.")
            if(!this.noBlankOptions(this.options)) this.set('error', "Blank options are not allowed.")
            if(this.enable_expiration && !this.expires_at) this.set('error', "Poll expiration is enabled but no date is set.")

            if(this.error) return false;

            if(!this.enable_expiration) this.set('expires_at', "1970-01-01T00:00:00.000")

            const data = {
                user: this.account.name,
                subject: this.subject,
                description: this.description,
                options: this.options.map( o => o.name),
                is_token_poll: this.is_token_poll,
                producers_only: this.producers_only,
                guardians_only: this.guardians_only,
                expires_at: this.expires_at,
            }

            this.createPoll(data);
        },
    },
    createPoll(data) {

        const submit_btn = document.getElementById('submit');
        submit_btn.disabled=true;
        submit_btn.innerText = 'Connecting to Scatter...';

        ScatterJS.connect(ENV.APP.name, {network}).then( connected => {
            if(!connected) {

                this.notifications.error(`We couldn't detect Scatter, make sure it's open.`, 'No Scatter');

            } else {

                const eos = ScatterJS.eos(network, Api, {rpc});

                eos.transact({
                    actions: [{
                        account: 'pollingremme',
                        name: 'create',
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
                    this.notifications.error(`Your poll has been created, it may take a few moments to be processed on chain.`, 'Poll created');
                    submit_btn.disabled = false;
                    submit_btn.innerText = 'Create Poll';
                    this.transitionToRoute('rem.polls.index');
                }).catch( (e) => {

                    let error = "Something went wrong.";
                    if (e instanceof RpcError) error = e.json.error.details.firstObject.message;

                    this.notifications.error(error, 'Failed to Post');
                    submit_btn.disabled = false;
                    submit_btn.innerText = 'Create Poll';
                });
            }
        });
    },
    noBlankOptions(options) {
        for(let i=0; i<options.length; i++){
            if(options[i].name === "") return false;
        }
        return true;
    }
});