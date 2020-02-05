import Route from '@ember/routing/route';

export default Route.extend({
    model() {

    },
    activate: function() {
        this._super();
        window.scrollTo(0, 0);
    }
});