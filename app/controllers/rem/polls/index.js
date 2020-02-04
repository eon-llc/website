import Controller, { inject as controller } from '@ember/controller';
import { computed } from '@ember/object';
import { set } from '@ember/object';

export default Controller.extend({

    parent: controller('rem.index'),
    polls: computed.alias('model.polls'),
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