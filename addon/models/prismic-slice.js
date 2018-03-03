import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
  sliceType: attr(),
  sliceLabel: attr(),

  items: attr(),
  primary: attr()


  // format data automatically using formatter

});
