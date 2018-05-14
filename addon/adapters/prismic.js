import DS from 'ember-data';
import config from 'ember-get-config';
import { inject } from '@ember/service';
import { get } from '@ember/object';
import Prismic from 'prismic-javascript';
import { underscore } from '@ember/string';
import fetch from 'fetch';
import { assign } from '@ember/polyfills';
import { computed } from '@ember/object';

export default DS.JSONAPIAdapter.extend({
  prismic: inject(),
  host: config.prismic.apiEndpoint,
  defaultSerializer: 'prismic',

  init() {
    this._super(...arguments);
    if (!this.host.includes('api/v2')) {
      throw "ember-data-prismic only supports V2 of the prismic API"
    }
  },

  /**
    @method createRecord
    @public
  */
  createRecord: null,

  /**
    @method updateRecord
    @public
  */
  updateRecord: null,

  /**
    @method deleteRecord
    @public
  */
  deleteRecord: null,

  fetchLinkRequestParams(store, type) {
    let fetchLinks = []

    /* Get all the fields */
    type.eachRelationship(relationship => {
      let model = store.modelFactoryFor(relationship);
      if (model && model.class) {
        model.class.eachAttribute(attribute => {
          fetchLinks.push(`${underscore(relationship)}.${underscore(attribute)}`)
        })
      }
    });

    type.eachAttribute(attribute => {
      fetchLinks.push(`${underscore(type.modelName)}.${underscore(attribute)}`)
    });

    return fetchLinks;
  },

  /**
    Called by the store in order to fetch the JSON for a given
    type and ID. This is the

    The `findRecord` method makes a fetch (HTTP GET) request to a URL, and returns a
    promise for the resulting payload.

    @method findRecord
    @param {DS.Store} store
    @param {DS.Model} type
    @param {String} id
    @return {Promise} promise
    @public
  */
  findRecord(store, type, id) {
    return this._prismicQuery([
      Prismic.Predicates.at('document.type', type.modelName),
      Prismic.Predicates.at(`my.${type.modelName}.uid`, id)
    ], {
      fetchLinks: this.fetchLinkRequestParams(store, type)
    }).then(post => {
      if (post) {
        return post;
      }
      else {
        return this._prismicQuery([
          Prismic.Predicates.at('document.type', type.modelName),
          Prismic.Predicates.at(`document.id`, id)
        ], {
            fetchLinks: this.fetchLinkRequestParams(store, type)
          });
      }
    })
  },

  /**
    Called by the store in order to fetch a JSON array for all
    of the records for a given type.

    The `findAll` method makes a fetch (HTTP GET) request to a URL, and returns a
    promise for the resulting payload.

    @method findAll
    @param {DS.Store} store
    @param {DS.Model} type
    @return {Promise} promise
    @public
  */
  findAll(store, type) {
    return this._prismicQuery([
      Prismic.Predicates.at('document.type', type.modelName)
    ], {
        fetchLinks: this.fetchLinkRequestParams(store, type)
      });
  },

  /**
    Called by the store in order to fetch a JSON array for
    the records that match a particular query.

    The `query` method makes a fetch (HTTP GET) request to a URL
    and returns a promise for the resulting payload.

    The `query` argument is a simple JavaScript object that will be passed directly
    to the server as parameters.

    @method query
    @param {DS.Store} store
    @param {DS.Model} type
    @param {Object} query
    @return {Promise} promise
    @public
  */
  query(store, type /*, query */) {
    return this.findAll(store, type);
  },

  /**
    Called by the store in order to fetch a JSON object for
    the record that matches a particular query.

    The `queryRecord` method makes a fetch (HTTP GET) request to a URL
    and returns a promise for the resulting payload.

    The `query` argument is a simple JavaScript object that will be passed directly
    to the server as parameters.

    @method queryRecord
    @param {DS.Store} store
    @param {DS.Model} type
    @param {Object} query
    @return {Promise} promise
    @public
  */
  queryRecord(store, type, query) {
    return this._prismicQuery([
      Prismic.Predicates.at('document.type', type.modelName),
      Prismic.Predicates.at(`my.${type.modelName}.uid`, query.uid)
      ], {
        fetchLinks: this.fetchLinkRequestParams(store, type)
      });
  },

  _prismicQuery(predicates, options) {
    let baseUrl = [`${this.host}`, 'documents/search'].join("/");

    let query =[
      this._predicatesToQuery(predicates),
      `access_token=${config.prismic.accessToken}`,
      `ref=${config.prismic.ref}`,
      `fetchLinks=${options.fetchLinks}`
    ].join("&")

    return fetch(`${baseUrl}?${query}`)
      .then(this._checkStatus)
      .then((response) => {
        return response.json()
      });
  },

  _predicatesToQuery(predicates) {
    let predicateQuery = predicates.map(pred => {
      return `q=${encodeURIComponent(`[${pred}]`)}`
    }).join("&")

    return predicateQuery;
  },

  _checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
      return response
    } else {
      var error = new Error(response.statusText)
      error.response = response
      throw error
    }
  },

  _toQueryParams(obj, prefix) {
    var str = [],
      p;
    for (p in obj) {
      if (obj.hasOwnProperty(p)) {
        var k = prefix ? prefix : p,
          v = obj[p];
        str.push((v !== null && typeof v === "object") ?
          this._toQueryParams(v, k) :
          encodeURIComponent(k) + "=" + encodeURIComponent(v));
      }
    }
    return str.join("&");
  }

});
