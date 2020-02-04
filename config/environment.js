'use strict';

module.exports = function(environment) {
  let ENV = {
    modulePrefix: 'website',
    locationType: 'router-scroll',
    historySupportMiddleware: true,
    podModulePrefix: 'app/components',
    environment,
    rootURL: '/',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      },
      EXTEND_PROTOTYPES: {
        // Prevent Ember Data from overriding Date.parse.
        Date: false
      }
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
      name: 'eon',
      voteURL: 'https://remme.bloks.io/vote?producers=eonblockprod',
      RemmeNetwork: {
        blockchain:'eos',
        chainId:'9f485317b61a19e956c822866cc57a64bbed2196e1cf178e80f847a139a20916',
        host:'rem.eon.llc',
        port:443,
        protocol:'https'
      }
    }
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
    ENV.APP.autoboot = false;
  }

  if (environment === 'production') {
    // here you can enable a production-specific feature
  }

  ENV['ember-toastr'] = {
    toastrOptions: {
      closeButton: false,
      debug: false,
      newestOnTop: true,
      progressBar: false,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      onclick: null,
      showDuration: '300',
      hideDuration: '1000',
      timeOut: '5000',
      extendedTimeOut: '2000',
      showEasing: 'swing',
      hideEasing: 'linear',
      showMethod: 'fadeIn',
      hideMethod: 'fadeOut'
    }
  };

  return ENV;
};
