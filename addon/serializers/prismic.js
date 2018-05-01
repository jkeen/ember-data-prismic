import DS from 'ember-data';
import { A } from '@ember/array';
import { underscore } from '@ember/string' ;
import { assign } from '@ember/polyfills';
import { isArray, makeArray } from '@ember/array';
import { get } from '@ember/object';
import { copy } from '@ember/object/internals';
import { isNone, typeOf } from '@ember/utils';

export default DS.JSONSerializer.extend({
  keyForAttribute(key, /* relationship, method */) {
    return underscore(key);
  },

  modelFromPrismicType(type) {
    if (this.store._hasModelFor(type)) {
      return this.store.modelFor(type);
    }
    else {
      return this.store.modelFor('prismic-document');
    }
  },

  objectId(object) {
    return object.uid || object.id;
  },

  extractAttributes(modelClass, objHash) {
    let attributeKey;
    let attributes = {};

    let userFields = this.modelFieldData(modelClass, objHash);
    let systemFields = this.systemFieldData(objHash)

    modelClass.eachAttribute((key) => {
      attributeKey = this.keyForAttribute(key, 'deserialize');

      // These are the user defined fields
      if (userFields && userFields.hasOwnProperty(attributeKey)) {
        let attributeValue = userFields[attributeKey];
        // if (typeOf(attributeValue) === 'object') {
        //   attributeValue = attributeValue.value;
        // }
        attributes[key] = attributeValue;
      }
      else if (systemFields && systemFields[attributeKey]) {
        let attributeValue = systemFields[attributeKey];
        // if (typeOf(attributeValue) === 'object') {
        //   attributeValue = attributeValue.value;
        // }
        attributes[key] = attributeValue;
      }
    });

    attributes['recordId'] = systemFields['id'];

    return attributes;
  },

  modelHasAttributeOrRelationshipNamedType(modelClass) {
    return get(modelClass, 'attributes').has('type') || get(modelClass, 'relationshipsByName').has('type');
  },

  extractDocumentLinks(fieldData) {
    let relationshipHash = {}
    A(Object.keys(fieldData)).map(key => {
      if (get(fieldData, `${key}.link_type`) === 'Document') {
        relationshipHash[key] = get(fieldData, key);
      }
      else if (key === 'body' && this.isSliceData(get(fieldData, key))) {
        relationshipHash[this.keyForRelationship(key)] = get(fieldData, key);
      }
    });

    if (this.isSlice(fieldData)) {
      fieldData.items.map(item => {
        A(Object.keys(item)).map(key => {
          if (get(item, `${key}.link_type`) === 'Document') {
            if (!relationshipHash[key]) {
              relationshipHash[key] = A();
            }
            relationshipHash[key].push(get(item, key));
          }
        });
      });

      A(Object.keys(fieldData.primary)).map(key => {
        if (get(fieldData.primary, `${key}.link_type`) === 'Document') {
          if (!relationshipHash[key]) {
            relationshipHash[key] = A();
          }
          relationshipHash[key].push(get(fieldData.primary, key));
        }
      });
    }

    return relationshipHash;
  },

  extractRelationships(modelClass, resourceHash) {
    let fieldData = this.modelFieldData(modelClass, resourceHash)
    let relationships = {};
    let relationshipHash = this.extractDocumentLinks(fieldData) || {};

    modelClass.eachRelationship((key, relationshipMeta) => {
      let relationshipKey = this.keyForRelationship(key, relationshipMeta.kind, 'deserialize');
      if (relationshipMeta.options.polymorphic) {
        let allRelated = [];
        Object.keys(relationshipHash).map(k => {
          allRelated = allRelated.concat(relationshipHash[k]);
        });
        relationships[key] = {
          data: this.extractRelationship(key, allRelated, resourceHash)
        };
      }
      else {
        if (relationshipHash[relationshipKey] !== undefined) {
          relationships[key] = {
            data: this.extractRelationship(key, relationshipHash[relationshipKey], resourceHash)
          };
        }
      }
    });

    return relationships;
  },


  extractRelationship(relationshipModelName, relationshipHash, objectData) {
    if (isNone(relationshipHash)) {
      return null;
    }
    if (typeOf(relationshipHash) === 'object') {
      var modelClass = this.store.modelFor(relationshipModelName);
      return {
        id: this.objectId(relationshipHash),
        type: modelClass.modelName,
        attributes: this.extractAttributes(modelClass, relationshipHash),
        relationships: this.extractRelationships(modelClass, relationshipHash)
      }
    }
    else if (typeOf(relationshipHash) === 'array') {
      if (this.isSliceData(relationshipHash)) {
        return relationshipHash.map((slice, index) => {
          var modelClass = this.store.modelFor('prismic-document-slice');

          return {
            id: `${this.objectId(objectData)}_s${index}`,
            type: modelClass.modelName,
            attributes: this.extractAttributes(modelClass, slice),
            relationships: this.extractRelationships(modelClass, slice)
          }
        })
      }
      else {
        return relationshipHash.map(object => {
          var modelClass = this.modelFromPrismicType(object.type);

          return {
            id: this.objectId(object),
            type: modelClass.modelName,
            attributes: this.extractAttributes(modelClass, object),
            relationships: this.extractRelationships(modelClass, object)
          }
        });
      }
    }
  },

  normalize(modelClass, resourceHash) {
    let data = null;
    if (resourceHash) {
      data = {
        id: this.objectId(resourceHash),
        type: resourceHash.type,
        attributes: this.extractAttributes(modelClass, resourceHash),
        relationships: this.extractRelationships(modelClass, resourceHash)
      };

      this.applyTransforms(modelClass, data.attributes);
    }

    return { data };
  },

  isSlice(resource) {

    let keys = Object.keys(resource)

    return keys.includes('slice_type') && keys.includes('slice_label');
  },

  isSliceData(resources) {
    return (isArray(resources) && resources.length > 0 && resources[0].slice_type !== undefined)
  },

  modelFieldData(modelClass, resourceHash) {
    if (resourceHash && resourceHash.data) {
      return resourceHash.data;
    }
    else if (modelClass.modelName == 'prismic-document-slice') {
      return resourceHash;
    }
    else {
      return {};
    }
  },

  systemFieldData(resourceHash) {
    let systemData = {}
    assign(systemData, resourceHash);
    delete systemData['data'];
    return systemData
  },

  normalizeResponse(store, primaryModelClass, payload, id, requestType) {
    switch (requestType) {
      case 'findRecord':
        return this.normalizeFindRecordResponse(...arguments);
      case 'queryRecord':
        return this.normalizeQueryRecordResponse(...arguments);
      case 'findAll':
        return this.normalizeFindAllResponse(...arguments);
      case 'findBelongsTo':
        return this.normalizeFindBelongsToResponse(...arguments);
      case 'findHasMany':
        return this.normalizeFindHasManyResponse(...arguments);
      case 'findMany':
        return this.normalizeFindManyResponse(...arguments);
      case 'query':
        return this.normalizeQueryResponse(...arguments);
      default:
        return null;
    }
  },

  normalizeFindRecordResponse() {
    return this.normalizeSingleResponse(...arguments);
  },

  normalizeQueryRecordResponse(store, primaryModelClass, payload, id, requestType) {
    let singlePayload = null;
    if (parseInt(payload.results_size) > 0) {
      singlePayload = payload.results[0];
    }
    return this.normalizeSingleResponse(store, primaryModelClass, singlePayload, id, requestType);
  },

  normalizeFindAllResponse() {
    return this.normalizeArrayResponse(...arguments);
  },

  normalizeFindBelongsToResponse() {
    return this.normalizeSingleResponse(...arguments);
  },

  normalizeFindHasManyResponse() {
    return this.normalizeArrayResponse(...arguments);
  },

  normalizeFindManyResponse() {
    return this.normalizeArrayResponse(...arguments);
  },

  normalizeQueryResponse() {
    return this.normalizeArrayResponse(...arguments);
  },

  normalizeSingleResponse(store, primaryModelClass, payload /* id, requestType */) {
    let normalizedData = this.normalize(primaryModelClass, payload).data;
    let formatted      = this.formatResponseData(normalizedData);

    return formatted;
  },

  normalizeArrayResponse(store, primaryModelClass, payload /* id, requestType */ ) {
    let data = [];
    var included = []

    payload.results.map((item) => {
      let normalizedData = this.normalize(primaryModelClass, item).data;
      let formatted      = this.formatResponseData(normalizedData);
      data.push(formatted.data);
      included = included.concat(formatted.included)
    });

    let response =  {
      data: data,
      included: included,
      meta: this.extractMeta(store, primaryModelClass, payload)
    };

    return response;
  },

  /**
    @method extractMeta
    @param {DS.Store} store
    @param {DS.Model} modelClass
    @param {Object} payload
    @return {Object} { total: Integer, limit: Integer, skip: Integer }
  **/
  extractMeta(store, modelClass, payload) {
    if (payload) {
      let meta = {};
      if (payload.hasOwnProperty('results_per_page')) {
        meta.page_size = payload.results_per_page;
      }
      if (payload.hasOwnProperty('page')) {
        meta.page = payload.page;
      }
      if (payload.hasOwnProperty('total_pages')) {
        meta.page_total = payload.total_pages;
      }
      if (payload.hasOwnProperty('total_results_size')) {
        meta.total = payload.total_results_size;
      }
      return meta;
    }
  },

  _nestedRelationships(resourceHash) {
    let relationships    = resourceHash.relationships || {};
    let relationshipKeys = Object.keys(relationships);
    if (relationshipKeys.length === 0) return [];

    let records = []
    relationshipKeys.map(key => {
      makeArray(relationships[key].data).forEach(record => records.push(assign({}, record)));
    });

    return records;
  },

  extractIncludes(resourceHash, included = []) {
    this._nestedRelationships(resourceHash).forEach(relationship => {
      this.extractIncludes(relationship, included);

      included.push(relationship);
    });

    return included;
  },

  removeAttributes(resourceHash, nested) {
    let relationships = resourceHash.relationships;
    let relationshipKeys = Object.keys(relationships);
    relationshipKeys.map(key => {
      let records = makeArray(relationships[key].data);

      records.forEach(record => {
        this.removeAttributes(record, true);
      });
    });

    if (nested) {
       delete resourceHash.attributes;
       delete resourceHash.relationships;
    }

    return resourceHash;
  },

  formatResponseData(normalizedData) {
    /* given an normalized data hash, return {
      data: [passed in data without 'attributes' in relationships]
      included: [flattened array of all nested relationships]
    } */
    let data = this.removeAttributes(copy(normalizedData, true));
    let included = this.extractIncludes(normalizedData).map(include => this.removeAttributes(include));

    return {
      data,
      included
    };
  }
});
