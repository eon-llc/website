import { equal } from '@ember/object/computed';
import Controller from '@ember/controller';
import ENV from 'website/config/environment';

export default Controller.extend({
    isIndex: equal('currentRouteName', 'index'),
    voteURL: ENV.APP.voteURL,
    actions: {
        toggleMobileNav() {
            document.getElementById("mobile-nav").classList.toggle("show");
            document.getElementById("mobile-toggle").classList.toggle("open");
        }
    }
});
