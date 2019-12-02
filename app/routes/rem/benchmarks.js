import Route from '@ember/routing/route';

export default Route.extend({
    model: function() {
        var controller = this.controllerFor('rem.benchmarks');
        controller.send('getEpochs');
    }
});