'use strict';

module.exports = {
  name: require('./package').name,
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
