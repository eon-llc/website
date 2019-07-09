import Application from '@ember/application';
import Resolver from './resolver';
import loadInitializers from 'ember-load-initializers';
import config from './config/environment';
import Route from '@ember/routing/route';

const App = Application.extend({
  modulePrefix: config.modulePrefix,
  podModulePrefix: config.podModulePrefix,
  Resolver
});

Route.reopen({
  activate: function() {
    this._super();
    document.body.className = this.routeName.replace(/\./g, '-').dasherize();
  }
});

loadInitializers(App, config.modulePrefix);

export default App;
