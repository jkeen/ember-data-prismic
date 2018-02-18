'use strict';
const path = require('path');
const map = require('broccoli-stew').map;
const Funnel = require('broccoli-funnel');
const mergeTrees = require('broccoli-merge-trees');
const stringReplace = require('broccoli-string-replace');


module.exports = {
  name: 'ember-data-prismic',
  isDevelopingAddon: function() {
    return true;
  },

  treeForVendor(defaultTree) {
    let prismicJSTree = new Funnel(path.dirname(require.resolve('prismic-javascript/dist/prismic-javascript.js')), {
      files: ['prismic-javascript.js'],
      destDir: 'prismic'
    });
    prismicJSTree = stringReplace(prismicJSTree, {
      files: ['prismic-javascript.js'],
      patterns: [{
        match: /typeof module === 'object'/g,
        replacement: 'false'
      }]
    });

    let prismicDOMTree = new Funnel(path.dirname(require.resolve('prismic-dom/dist/prismic-dom.js')), {
      files: ['prismic-dom.js'],
      destDir: 'prismic'
    });
    prismicDOMTree  = stringReplace(prismicDOMTree, {
      files: ['prismic-dom.js'],
      patterns: [{
        match: /typeof module === 'object'/g,
        replacement: 'false'
      }]
    });

    return new mergeTrees([prismicJSTree, prismicDOMTree, defaultTree]);
  },

  included: function(app, parentAddon) {
    this._super.included.apply(this, arguments);
    const target = (parentAddon || app);

    target.import('');


    // prismic-javascript
    target.import('vendor/prismic/prismic-javascript.js');
    target.import('vendor/shims/prismic-javascript.js');

    // prismic-dom
    target.import('vendor/prismic/prismic-dom.js');
    target.import('vendor/shims/prismic-dom.js');
  }
};
