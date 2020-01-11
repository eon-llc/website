import Route from '@ember/routing/route';

export default Route.extend({
    model() {
        var controller = this.controllerFor('rem.index');
        controller.send('loadAPIHealth');
    }
});