import Controller, { inject as controller } from '@ember/controller';
import { computed } from '@ember/object';

export default Controller.extend({

    parent: controller('rem.index'),
    account: computed.alias('parent.account'),
    subject: false,
    options: false,
    is_token_poll: false,
    producers_only: false,
    guardians_only: false,
    expires_at: false,

    init() {
        this._super();

        this.set("minDate", new Date());
    },
    actions: {

    },
});