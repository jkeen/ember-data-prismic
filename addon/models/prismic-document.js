import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { hasMany } from 'ember-data/relationships';
import { computed } from '@ember/object';

export default Model.extend({
  recordId            : attr('string'),
  uid                 : attr(),
  tags                : attr(),
  slugs               : attr(),
  alternateLanguages  : attr(),
  firstPublicationDate: attr('date'),
  lastPublicationDate : attr('date'),
  body                : hasMany('prismic-document-slice', { async: false })
});
