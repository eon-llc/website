import Controller from '@ember/controller';
import ENV from 'website/config/environment';
import { inject as service } from '@ember/service';
import ScatterJS from '@scatterjs/core';
import ScatterEOS from '@scatterjs/eosjs2';
import axios from 'axios';

ScatterJS.plugins( new ScatterEOS() );

const network = ScatterJS.Network.fromJson(ENV.APP.RemmeNetwork);

export default Controller.extend({
    notifications: service('toast'),

    api_status: false,
    account: false,

    init() {
        this._super();

        const account = JSON.parse(localStorage.getItem('rem-account'));
        if(account) {
            this.set('account', account);
        }
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

            const login_btn = document.querySelector('.btn.login');
            login_btn.disabled = true;

            ScatterJS.connect(ENV.APP.name, {network}).then(connected => {
                if(!connected) {
                    login_btn.disabled = false;
                    this.notifications.error(`We couldn't detect Scatter, make sure it's open.`, 'No Scatter');
                } else {
                    ScatterJS.login().then(id => {
                        if(!id) {
                            this.notifications.error(`Failed to fetch account from Scatter.`, 'No Account');
                        } else {
                            const account = ScatterJS.account('eos');
                            this.set('account', account);
                            localStorage.setItem('rem-account', JSON.stringify(account));
                            this.notifications.info(`You have been logged in.`, 'Welcome');
                        }

                        login_btn.disabled = false;
                    })
                    .catch(err => {
                        if(err.type === "identity_rejected") {
                            this.notifications.error(`You cancelled connection to Scatter.`, 'Connection Cancelled');
                        }

                        login_btn.disabled = false;
                    });
                }
            });
        },
        scatterLogout() {

            const logout_btn = document.querySelector('.btn.logout');
            logout_btn.disabled = true;

            ScatterJS.connect(ENV.APP.name, {network}).then(connected => {
                if(!connected) {
                    logout_btn.disabled = false;
                    this.notifications.error(`We couldn't detect Scatter, make sure it's open.`, 'No Scatter');
                } else {
                    ScatterJS.scatter.forgetIdentity();
                    ScatterJS.logout(ENV.APP.name, {network}).then( () => {
                        this.set('account', '');
                        localStorage.setItem('rem-account', JSON.stringify(''));
                        this.notifications.info(`You have been logged out.`, 'Goodbye');
                        logout_btn.disabled = false;
                    })
                    .catch( () => {
                        this.notifications.error(`Something went wrong, please try to log out one more time.`, 'Failed to Log Out');
                        logout_btn.disabled = false;
                    });
                }
            });
        }
    }
});