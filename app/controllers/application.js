import { equal } from '@ember/object/computed';
import Controller from '@ember/controller';

export default Controller.extend({
    isIndex: equal('currentRouteName', 'index'),
    actions: {
        toggleMobileNav() {
            document.getElementById("mobile-nav").classList.toggle("show");
            document.getElementById("mobile-toggle").classList.toggle("open");
        }
    }
});
