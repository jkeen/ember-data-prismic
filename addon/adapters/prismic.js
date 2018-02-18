import DS from 'ember-data';
import config from 'ember-get-config';
import { inject } from '@ember/service';
import { get } from '@ember/object';
import Prismic from 'prismic-javascript';

export default DS.Adapter.extend({
  prismic: inject(),
  host: config.prismic.apiEndpoint,
  defaultSerializer: 'prismic',

  /**
    Currently not implemented as this is adapter only implements the
    READ ONLY Content Delivery API (https://www.contentful.com/developers/docs/references/content-delivery-api/).
    For more information on the Content Management API,
    see https://www.contentful.com/developers/docs/references/content-management-api/

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
      return api.getByUID(type, id)
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
    return this._getContent('entries', { 'content_type': this.contentTypeParam(type.modelName) });
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
  query(store, type, query) {
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
    // query = query || {};
    // query['content_type'] = this.contentTypeParam(type.modelName);
    // query['limit'] = 1;
    // query['skip'] = 0;
    // return this._getContent('entries', query);
  },
});
