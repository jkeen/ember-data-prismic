import DS from 'ember-data';
import { A } from '@ember/array';
import { underscore } from '@ember/string' ;
import { assign } from '@ember/polyfills';
import { isArray } from '@ember/array';
import { get } from '@ember/object';
import { isNone, typeOf } from '@ember/utils';

export default DS.JSONSerializer.extend({
  keyForAttribute(key, /* relationship, method */) {
    return underscore(key);
  },

  extractAttributes(modelClass, objHash) {
    let attributeKey;
    let attributes = {};

    let userFields = this.modelFieldData(objHash);
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

      // assign(relationshipHash, this.extractDocumentLinks(fieldData.primary))
    }

    return relationshipHash;
  },

  extractRelationships(modelClass, resourceHash) {
    let relationships = {};
    let fieldData = this.modelFieldData(resourceHash)

    let relationshipHash = this.extractDocumentLinks(fieldData);

    modelClass.eachRelationship((key, relationshipMeta) => {
      let relationshipKey = this.keyForRelationship(key, relationshipMeta.kind, 'deserialize');
      if (relationshipHash[relationshipKey] !== undefined) {
        relationships[key] = {
          data: this.extractRelationship(key, relationshipHash[relationshipKey], resourceHash)
        };
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

      if (relationshipHash.type && !this.modelHasAttributeOrRelationshipNamedType(modelClass)) {
        return {
          id: relationshipHash.uid,
          type: modelClass.modelName
        }
      }

      else if (relationshipHash.data) {
        let data = {
          id: relationshipHash.uid,
          type: modelClass.modelName,
          attributes: this.extractAttributes(modelClass, relationshipHash),
          relationships: this.extractRelationships(modelClass, relationshipHash)
        };
        return data;
      }

      return { id: relationshipHash.uid, type: relationshipModelName };
    }
    else if (typeOf(relationshipHash) === 'array' && this.isSliceData(relationshipHash)) {
      return relationshipHash.map((slice, index) => {

        let id = `${objectData.id}_s${index}`;
        return { id, type: 'prismic-slice' }
      })
    }
  },

  normalize(modelClass, resourceHash) {
    let data = null;
    if (resourceHash) {
      data = {
        id: resourceHash.uid,
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

  modelFieldData(resourceHash) {
    if (resourceHash && resourceHash.data) {
      return resourceHash.data;
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
    let response = {
      data: this.normalize(primaryModelClass, payload).data,
      included: this.extractIncludes(store, payload)
    };

    return response;
  },

  normalizeArrayResponse(store, primaryModelClass, payload /* id, requestType */ ) {
    let data = [];
    var included = []

    payload.results.map((item) => {
      data.push(this.normalize(primaryModelClass, item).data);

      included = included.concat(this.extractIncludes(store, item))
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

  extractIncludes(store, resourceHash) {
    let included = [];

    let fieldData = this.modelFieldData(resourceHash)
    let linkedDocuments = []
    A(Object.keys(fieldData)).map(key => {
      if (get(fieldData, `${key}.link_type`) === 'Document') {
        linkedDocuments.push(get(fieldData, key));
      }
      else if (key === 'body' && this.isSliceData(get(fieldData, key))) {
        let sliceData = get(fieldData, key)
        sliceData.forEach((slice, index) => {
          linkedDocuments.push({
            uid: `${resourceHash.id}_s${index}`,
            type: 'prismic-slice',
            data: slice
          });
        })
      }
    });

    linkedDocuments.map(doc => {
      let normalized = this.normalize(store.modelFor(doc.type), doc)

      included.push(normalized.data);
    });

    //   modelClass.eachRelationship((key, relationship) => {
    //
    //     let relationshipKey = this.keyForRelationship(key, relationshipMeta.kind, 'deserialize');
    //     if (relationshipHash[relationshipKey] !== undefined) {
    //       let record = this.normalize(store.modelFor(key), relationshipHash[relationshipKey]);
    //       included.push(record);
    //     }
    //     // if (DEBUG) {
    //     //   if (resourceHash.relationships[relationshipKey] === undefined && resourceHash.relationships[key] !== undefined) {
    //     //     assert(`Your payload for '${modelClass.modelName}' contains '${key}', but your serializer is setup to look for '${relationshipKey}'. This is most likely because Ember Data's JSON API serializer dasherizes relationship keys by default. You should subclass JSONAPISerializer and implement 'keyForRelationship(key) { return key; }' to prevent Ember Data from customizing your relationship keys.`, false);
    //     //   }
    //     // }
    //   });

    return included;

    //
    //
    // if(payload && payload.hasOwnProperty('includes')) {
    //   let entries = new Array();
    //   let assets = new Array();
    //
    //   if (payload.includes.Entry) {
    //     entries = payload.includes.Entry.map((item) => {
    //       return this.normalize(store.modelFor(item.sys.contentType.sys.id), item).data;
    //     });
    //   }
    //
    //   if (payload.includes.Asset) {
    //     assets = payload.includes.Asset.map((item) => {
    //       return this.normalize(store.modelFor('contentful-asset'), item).data;
    //     });
    //   }
    //
    //   return entries.concat(assets);
    // } else {
    //   return [];
    // }
  }
});
