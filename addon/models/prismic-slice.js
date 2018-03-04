import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { hasMany } from 'ember-data/relationships';
export default Model.extend({
  sliceType: attr(),
  sliceLabel: attr(),

  items: attr(),
  primary: attr(),
  references: hasMany('prismic-reference', { polymorphic: true, async: false })
});
