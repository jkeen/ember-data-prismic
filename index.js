'use strict';

module.exports = {
  name: 'ember-data-prismic',
  isDevelopingAddon: function() {
    return true;
  },
  autoImport:{
    exclude: [],
    webpack: {
    // extra webpack configuration goes here
    }
  }
};
