import DS from 'ember-data';
import config from 'ember-get-config';
import { inject } from '@ember/service';
import Prismic from 'prismic-javascript';
import { underscore } from '@ember/string';
import fetch from 'fetch';

export default DS.JSONAPIAdapter.extend({
  prismic: inject(),
  host: config.prismic.apiEndpoint,
  defaultSerializer: 'prismic',

  coalesceFindRequests: true,

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
    return this.prismicQuery([
      Prismic.Predicates.at('document.type', type.modelName),
      Prismic.Predicates.at(`my.${type.modelName}.uid`, id)
    ], {
      fetchLinks: this.fetchLinkRequestParams(store, type)
    }).then(post => {
      if (post) {
        return post;
      }
      else {
        return this.prismicQuery([
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
    return this.prismicQuery([
      Prismic.Predicates.at('document.type', type.modelName)
    ], {
        fetchLinks: this.fetchLinkRequestParams(store, type)
      });
  },

  findMany(store, type, ids) {
    return this.prismicQuery([
      Prismic.Predicates.at('document.type', type.modelName),
      Prismic.Predicates.any(`my.${type.modelName}.uid`, ids)
    ], {
      fetchLinks: this.fetchLinkRequestParams(store, type)
    }).then(posts => {
      if (posts) {
        return posts;
      }
      else {
        return this.prismicQuery([
          Prismic.Predicates.at('document.type', type.modelName),
          Prismic.Predicates.any(`document.id`, ids)
        ], {
            fetchLinks: this.fetchLinkRequestParams(store, type)
          });
      }
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
    return this.prismicQuery([
      Prismic.Predicates.at('document.type', type.modelName),
      Prismic.Predicates.at(`my.${type.modelName}.uid`, query.uid)
      ], {
        fetchLinks: this.fetchLinkRequestParams(store, type)
      });
  },

  /* ----------------------------------------------------------------------------- */
  /*
    Prismic doesn't include the full response unless you tell it what to include
    So let's look through our models so we get related data on the first go
  */

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

  async prismicQuery(predicates, options) {
    let url   = [`${this.host}`, 'documents/search'].join("/");
    let ref   = await this.getMasterRef()

    let query = [
      this.predicatesToQuery(predicates),
      `access_token=${config.prismic.accessToken}`,
      `ref=${ref}`,
      `fetchLinks=${options.fetchLinks}`
    ].join("&")

    return fetch(`${url}?${query}`)
      .then(this.checkStatus)
      .then((response) => {
        return response.json()
      });
  },

  async getMasterRef() {
    let api    = await fetch(this.host).then(r => r.json())
    let master = api.refs.filter(r => r.isMasterRef)[0]
    return master.ref;
  },

  predicatesToQuery(predicates) {
    return predicates.map(p => `q=${encodeURIComponent(`[${p}]`)}`).join("&")
  },

  checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
      return response
    } else {
      var error = new Error(response.statusText)
      error.response = response
      throw error
    }
  }
});
