import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import computed from '@ember/computed';
export default Model.extend({
  slice_type: attr(),
  slice_label: attr(),

  type: computed.alias('slice_type'),
  label: computed.alias('slice_label'),

  items: attr(),
  primary: attr()
});
