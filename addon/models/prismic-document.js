import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { hasMany, belongsTo } from 'ember-data/relationships';
import { A } from '@ember/array';
import { computed } from '@ember/object';
import Slice from './prismic-document-slice';
import { getWithDefault } from '@ember/object';

export default Model.extend({
  recordId            : attr('string'),
  recordType          : attr('string'),
  uid                 : attr('string'),
  tags                : attr(),
  slugs               : attr(),
  alternateLanguages  : attr(),
  firstPublicationDate: attr('date'),
  lastPublicationDate : attr('date'),
  body                : attr(),
  linkedDocuments     : attr(),
  slices              : computed('body', function() {
    return A(getWithDefault(this, 'body', [])).map(data => {
      let slice = Slice.create({
        sliceType: data.slice_type,
        sliceLabel: data.slice_label
      });
      slice.set('items', data.items);
      slice.set('primary', data.primary);
      slice.set('parent', this);

      return slice;
    })
  }),

  // References within slices

  parent              : belongsTo('prismic-document', { async: true, inverse: 'references'}),
  references          : hasMany('prismic-document', { polymorphic: true, async: true, inverse: 'parent'})
});
