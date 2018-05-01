import DS from 'ember-data';
import config from 'ember-get-config';
import { inject } from '@ember/service';
import { get } from '@ember/object';
import Prismic from 'prismic-javascript';
import { underscore } from '@ember/string';
// import fetch from 'fetch';

export default DS.RESTAdapter.extend({
  prismic: inject(),
  host: config.prismic.apiEndpoint,

  init() {
    this._super(...arguments);
    if (!this.host.includes('api/v2')) {
      throw "ember-data-prismic only supports V2 of the prismic API"
    }
  },

  defaultSerializer: 'prismic',

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

  /**
    Allows the adapter to override the content type param used in api calls where
    content type param is needed. (e.g. `findAll`, `query`, `queryRecord`)

    @method contentTypeParam
    @param {String} modelName
    @return {String}
    @public
  */

  contentTypeParam(modelName) {
    return modelName;
  },

  fetchLinkRequestParams(store, type) {
    let fetchLinks = []

    type.eachRelationship(relationship => {
      let model = store.modelFactoryFor(relationship);
      if (model && model.class) {
        model.class.eachAttribute(attribute => {
          fetchLinks.push(`${underscore(relationship)}.${underscore(attribute)}`)
        })
      }
    });

    return fetchLinks;
  },

  /**
    Called by the store in order to fetch the JSON for a given
    type and ID.

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
    return get(this, 'prismic').getApi(this.host).then(api => {
      // return api.query([
        // Prismic.Predicates.at('document.type', type.modelName)
      // ]);

      return api.getByUID(type.modelName, id, {
        fetchLinks: this.fetchLinkRequestParams(store, type)
      })
    })
  },

  /**
    Called by the store in order to fetch several records together.

    The `findMany` method makes a fetch (HTTP GET) request to a URL, and returns a
    promise for the resulting payload.

    @method findMany
    @param {DS.Store} store
    @param {DS.Model} type
    @param {Array} ids
    @return {Promise} promise
    @public
  */
  findMany(store, type, ids) {
    let contentType = (type.modelName === 'asset' || type.modelName === 'contentful-asset') ? 'assets' : 'entries';

    return this._getContent(contentType, { 'sys.id[in]': ids.toString() });
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
    return get(this, 'prismic').getApi(this.host).then(api => {
      return api.query([
        Prismic.Predicates.at('document.type', type.modelName),
      ], {
        fetchLinks: this.fetchLinkRequestParams(store, type)
      });
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
    return get(this, 'prismic').getApi(this.host).then(api => {
      return api.query([
        Prismic.Predicates.at('document.type', type.modelName)
      ]);
    })
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
    return get(this, 'prismic').getApi(this.host).then(api => {
      // return api.query([
        // Prismic.Predicates.at('document.type', type.modelName)
      // ]);
      return api.query([
        Prismic.Predicates.at(`my.${type.modelName}.uid`, query.uid),
        Prismic.Predicates.at('document.type', type.modelName)
      ], {
        fetchLinks: this.fetchLinkRequestParams(store, type)
      });
    })
  },
});
