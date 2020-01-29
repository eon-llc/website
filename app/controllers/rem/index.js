import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import ScatterJS from '@scatterjs/core';
import ScatterEOS from '@scatterjs/eosjs2';
import {JsonRpc, Api} from 'eosjs';
import axios from 'axios';

ScatterJS.plugins( new ScatterEOS() );

const network = ScatterJS.Network.fromJson({
    blockchain:'eos',
    chainId:'9f485317b61a19e956c822866cc57a64bbed2196e1cf178e80f847a139a20916',
    host:'nodes.get-scatter.com',
    port:443,
    protocol:'https'
});
const rpc = new JsonRpc(network.fullhost());

export default Controller.extend({
    notifications: service('toast'),

    api_status: false,
    account: false,

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
        },
        scatterLogin() {
            ScatterJS.connect('eon-llc', {network}).then(connected => {
                if(!connected) {
                    this.notifications.error(`We couldn't detect Scatter, make sure it's open.`, 'No Scatter');
                }

                ScatterJS.login().then(id => {
                    if(!id) {
                        this.notifications.error(`Failed to fetch account from Scatter.`, 'No Account');
                    }

                    const account = ScatterJS.account('eos');
                    this.set('account', account);

                    //const eos = ScatterJS.eos(network, Api, {rpc});

                    // eos.transact({
                    //     actions: [{
                    //         account: 'eosio.token',
                    //         name: 'transfer',
                    //         authorization: [{
                    //             actor: account.name,
                    //             permission: account.authority,
                    //         }],
                    //         data: {
                    //             from: account.name,
                    //             to: 'safetransfer',
                    //             quantity: '0.0001 EOS',
                    //             memo: account.name,
                    //         },
                    //     }]
                    // }, {
                    //     blocksBehind: 3,
                    //     expireSeconds: 30,
                    // }).then(res => {
                    //     console.log('sent: ', res);
                    // }).catch(err => {
                    //     console.error('error: ', err);
                    // });
                })
                .catch(err => {
                    if(err.type === "identity_rejected") {
                        this.notifications.error(`You cancelled connection to Scatter.`, 'Connection Cancelled');
                    }
                });
            });
        }
    }
});