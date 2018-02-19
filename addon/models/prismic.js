import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { hasMany } from 'ember-data/relationships';
export default Model.extend({
  firstPublishedAt: attr('date'),
  lastPublishedAt: attr('date'),
  slices: hasMany('prismic-slice')
});
