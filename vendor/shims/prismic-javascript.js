(function() {
  function vendorModule() {
    'use strict';

    return {
      'default': PrismicJS,
      'Experiments': PrismicJS.Experiments,
      'Predicates': PrismicJS.Predicates,
      'api': PrismicJS.api,
      'getApi': PrismicJS.getApi,
      __esModule: true,
    };
  }

  define('prismic-javascript', [], vendorModule);
})();
