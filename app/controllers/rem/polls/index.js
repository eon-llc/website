import Controller, { inject as controller } from '@ember/controller';
import { computed } from '@ember/object';
import { set } from '@ember/object';

export default Controller.extend({

    parent: controller('rem.index'),
    polls: computed.map('model.polls', function(poll){

        if(poll.expires_at === '1970-01-01T00:00:00.000') {
            poll.is_open = true;
        } else {
            const expires_at = Date.parse(poll.expires_at);
            const now = new Date();
            now.setHours(0,0,0,0);
            poll.is_open = expires_at > now;
        }

        return poll;
    }),
    account: computed.alias('parent.account'),

    init() {
        this._super();
        this.set('bp_jsons', []);
        this.set('types', {});
    },
    actions: {
        toggle_show(type_name) {
            let types = this.get("types");
            let timeout = this.get("timeout");

            types.forEach((type) => {
                if(type.name == type_name) {
                    set(type, "show", !type.show);
                }
            });

            this.set("types", types);

            clearTimeout(timeout);
            this.update();
        },
        scatterLogin(){
            this.get('parent').send('scatterLogin');
        },
        scatterLogout(){
            this.get('parent').send('scatterLogout');
        },
    },
});