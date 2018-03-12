import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { hasMany } from 'ember-data/relationships';
export default Model.extend({
  recordId: attr('string'),
  uid: attr(),
  tags: attr('prismic-object'),
  slugs: attr('prismic-object'),
  alternateLanguages: attr('prismic-object'),
  firstPublicationDate: attr('date'),
  lastPublicationDate: attr('date'),
  body: hasMany('prismic-document-slice', { async: false })
});
