import { equal } from '@ember/object/computed';
import Controller from '@ember/controller';
import ENV from 'website/config/environment';
import { inject as service } from '@ember/service';

export default Controller.extend({
    router: service(),

    isIndex: equal('router.currentRoute.name', 'index'),
    voteURL: ENV.APP.voteURL,
    actions: {
        toggleMobileNav() {
            document.getElementById("mobile-nav").classList.toggle("show");
            document.getElementById("mobile-toggle").classList.toggle("open");
        }
    }
});
