(function() {
  function vendorModule() {
    'use strict';

    return {
      'default': PrismicDOM,
      'Date': PrismicDOM.Date,
      'Link': PrismicDOM.Link,
      'RichText': PrismicDOM.RichText,
      __esModule: true,
    };
  }

  define('prismic-dom', [], vendorModule);
})();
