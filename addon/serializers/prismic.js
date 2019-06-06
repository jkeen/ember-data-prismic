import DS from "ember-data";
import { underscore } from "@ember/string";
import { isArray } from "@ember/array";
import { copy } from '@ember/object/internals';
import { assign } from "@ember/polyfills";
import { get, set } from '@ember/object';
import { A } from '@ember/array';
import { coerceId } from 'ember-data/-private';

export default DS.JSONSerializer.extend(DS.EmbeddedRecordsMixin, {
  keyForAttribute(key /* relationship, method */) {
    return underscore(key);
  },

  extractId(modelClass, resourceHash) {
    return coerceId(this.primaryKey(resourceHash));
  },

  normalizeResponse(/* ,store, primaryModelClass  payload */) {
    // set attributes for embedded?
    return this._super(...arguments);
  },

  normalizeSingleResponse(store, primaryModelClass, payload, id, requestType) {
    let results = this._super(
      store,
      primaryModelClass,
      this._collapseDataAttributes(copy(A(payload.results)[0])),
      id,
      requestType
    );

    return results;
  },

  normalizeArrayResponse(store, primaryModelClass, payload, id, requestType) {
    let results = this._super(
      store,
      primaryModelClass,
      this._collapseDataAttributes(copy(payload.results)),
      id,
      requestType
    );

    return results;
  },

  normalize(modelClass, resourceHash) {
    let attributes = this._super(...arguments);

    if (attributes && get(attributes, 'data') && !get(attributes, 'data.type')) {
      set(attributes, 'data.type', resourceHash['record_type']);
    }

    return attributes;
  },

  extractAttributes(modelClass, resourceHash) {
    let attributes = this._super(...arguments);

    attributes['recordId']   = resourceHash['id']
    attributes['recordType'] = resourceHash['type']
    return attributes;
  },

  extractRelationships(modelClass, resourceHash) {
    var relationships = this._super(modelClass, resourceHash);
    let references    = this._extractDocumentLinks(resourceHash)
    set(relationships, 'references', { data: references });

    return relationships;
  },

  extractRelationship(/* modelClass, relationshipHash */) {
    let relationship = this._super(...arguments);
    if (
      Object.keys(relationship).length === 1 &&
      relationship["link_type"] == "Document"
    ) {
      // If a relationship exists but is not connected on a prismic model it will just have a single link_type attribute in the payload. This isn't enough and

      return null;
    } else {
      return relationship;
    }
  },

  extractMeta(store, modelClass, payload) {
    if (payload) {
      let meta = {};
      if (payload.hasOwnProperty("results_per_page")) {
        meta.page_size = payload.results_per_page;
        delete payload.results_per_page;
      }
      if (payload.hasOwnProperty("page")) {
        meta.page = payload.page;
        delete payload.page;
      }
      if (payload.hasOwnProperty("total_pages")) {
        meta.page_total = payload.total_pages;
        delete payload.page_total;
      }
      if (payload.hasOwnProperty("total_results_size")) {
        meta.total = payload.total_results_size;
        delete payload.total;
      }
      return meta;
    }
  },

  primaryKey(resourceHash) {
    return (resourceHash['uid'] || resourceHash['id'])
  },

  _modifyDocumentAttributes(resourceHash) {
    // resourceHash['type']        = resourceHash['type'];
    resourceHash['record_id']   = resourceHash['id']
    resourceHash['record_type'] = resourceHash['type'];
    resourceHash['id']          = this.primaryKey(resourceHash);

    return resourceHash;
  },

  _extractDocumentLinks(resourceHash) {
    let references = [];

    A(get(resourceHash, 'body')).forEach(slice => {
      A(get(slice, 'items')).concat(get(slice,'primary')).forEach(item => {
        Object.keys(item).forEach(key => {
          if (get(item, `${key}.link_type`) === 'Document' && get(item, `${key}.id`)) {
            let attrs = get(item, key);

            references.push(this._modifyDocumentAttributes(attrs));
          }
        })
      });
    });

    return references;
  },

  /* Prismic's payload includes attributes at a top level, and
    other attributes under a `data` attribute. We want them all
    on one level, so this recursively so we get embedded/related
    models */
  _collapseDataAttributes(payload) {
    if (typeof payload === "object") {
      if (isArray(payload)) {
        payload = payload.map(key => {
          return this._collapseDataAttributes(key);
        });
      } else if (payload) {
        if (payload.id && payload.data) {
          payload = assign(payload, payload.data);
          delete payload.data;
        }

        Object.keys(payload).forEach(key => {
          payload[key] = this._collapseDataAttributes(payload[key]);
        });
      }
    }

    return payload;
  }

});
