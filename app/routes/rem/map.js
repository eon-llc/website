import Route from '@ember/routing/route';

export default Route.extend({
    model(params) {
        var controller = this.controllerFor('rem.map');
        controller.send('parse', params.account);
    }
});