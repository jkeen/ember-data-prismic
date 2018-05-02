import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { hasMany } from 'ember-data/relationships';
import { get } from '@ember/object';

export default Model.extend({
  init() {
    let items      = this.getWithDefault('items', []);
    let references = this.getWithDefault('references', []);
    //
    let modeledItems = items.map((item) => {
      let keys = Object.keys(item);
      if (keys.length === 1 && get(item, `${keys[0]}.id`)) {
        let model = references.filterBy('id', get(item, `${keys[0]}.uid`))[0];
        return model ? model : item;
      }
      else {
        return item;
      }
    })

    this.set('items', modeledItems);
    this._super(...arguments);
  },

  sliceType : attr(),
  sliceLabel: attr(),
  items     : attr(),
  primary   : attr(),
  references: hasMany('prismic-document', { polymorphic: true, async: false })
});
