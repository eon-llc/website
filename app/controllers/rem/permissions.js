import Controller from '@ember/controller';
import axios from 'axios';
import ENV from 'website/config/environment';

export default Controller.extend({
    init() {
        this._super();
        this.set('voteURL', ENV.APP.voteURL);
        this.set('error', false);
    },
    actions: {
        parse(account_name) {
            if(account_name && account_name.length === 12) {

                let permissions = {};
                this.set('account', account_name);
                this.set('error', false);

                axios({
                    method: 'post',
                    url: 'https://rem.eon.llc/v1/chain/get_account',
                    data: {
                        "account_name" : account_name
                    }
                })
                .then((account) => {
                    if(account.status === 200) {

                        axios({
                            method: 'get',
                            url: `https://rem.eon.llc/v2/history/get_actions?account=${account_name}&filter=rem:linkauth`
                        })
                        .then((linkauth) => {

                            let actions = {}
                            let latest_linkauth = {};
                            let to_sort = account.data.permissions;
                            let i = 0;

                            // determine the most recent linkauth for each unique action
                            for(let a = 0; a < linkauth.data.actions.length; a++) {
                                let item = linkauth.data.actions[a];
                                if(latest_linkauth[`${item.act.data.code}::${item.act.data.type}`]) {
                                    if(latest_linkauth[`${item.act.data.code}::${item.act.data.type}`] < item.block_num) {
                                        latest_linkauth[`${item.act.data.code}::${item.act.data.type}`] = item.block_num;
                                    }
                                } else {
                                    latest_linkauth[`${item.act.data.code}::${item.act.data.type}`] = item.block_num;
                                }
                            }

                            linkauth.data.actions = linkauth.data.actions.filter(function (item) {
                                return latest_linkauth[`${item.act.data.code}::${item.act.data.type}`] === item.block_num;
                            })

                            for(let a = 0; a < linkauth.data.actions.length; a++) {
                                let item = linkauth.data.actions[a];
                                if(!actions[item.act.data.requirement]){ actions[item.act.data.requirement] = []}
                                actions[item.act.data.requirement].push({code: item.act.data.code, type: item.act.data.type})
                            }

                            while(to_sort.length) {

                                let permission = to_sort[i];
                                let parent = to_sort[i].parent;
                                let perm_name = to_sort[i].perm_name;

                                if(parent === "") {
                                    permissions[perm_name] = {children: {}, details: {...permission}};
                                    to_sort.splice(i, 1);
                                } else {
                                    let updated = this.traverse(JSON.parse(JSON.stringify(permissions)), permission, actions);

                                    if(JSON.stringify(updated) !== JSON.stringify(permissions)) {
                                        permissions = updated;
                                        to_sort.splice(i, 1);
                                    }
                                }

                                if(i >= to_sort.length - 1) {
                                    i = 0;
                                } else {
                                    i++;
                                }
                            }

                            this.set('permissions', permissions);
                        })
                        .catch(() => { this.set('error', "Failed to fetch all data, try again."); });
                    }
                })
                .catch(() => { this.set('error', "Account doesn't exist."); });
            }
        }
    },
    traverse(obj, permission, actions) {

        for (var key in obj) {

            if(key === permission.parent) {
                if(!obj[key].children){ obj[key].children = {}; }
                obj[key].children[permission.perm_name] = {children: {}, details: {...permission}};
                if(actions[permission.perm_name]){
                    obj[key].children[permission.perm_name].actions = actions[permission.perm_name]
                }
            }

            if (obj[key].children) {
                obj[key].children = this.traverse(obj[key].children, permission, actions);
            }
        }

        return obj;
    }
});