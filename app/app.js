import Application from '@ember/application';
import Resolver from 'ember-resolver';
import loadInitializers from 'ember-load-initializers';
import config from './config/environment';
import Route from '@ember/routing/route';

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver;
}

Route.reopen({
  activate: function() {
    this._super();
    document.body.className = this.routeName.replace(/\./g, '-').dasherize();
  }
});

loadInitializers(App, config.modulePrefix);
