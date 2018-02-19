import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { computed } from '@ember/object';

export default Model.extend({
  type: attr(),
  label: attr(),

  items: attr(),
  primary: attr()


  // format data automatically using formatter

});
