import EmberRouter from '@ember/routing/router';
import config from './config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function() {
  this.route('about');
  this.route('technology');
  this.route('transparency');

  this.route('terms');
  this.route('privacy');

  this.route('rem', function() {
    this.route('permissions');
    this.route('benchmarks');
    this.route('map');
    this.route('polls', function() {
      this.route('new');
      this.route('view', {path: '/:id'});
    });
  });
});
