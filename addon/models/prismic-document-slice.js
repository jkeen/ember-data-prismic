import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { hasMany } from 'ember-data/relationships';
import { get } from '@ember/object';
import { computed } from '@ember/object';
import { A } from '@ember/array';
// import EmberObject from '@ember/object';

export default Model.extend({
  sliceType : attr(),
  sliceLabel: attr(),

  primary   : attr(),
  items     : attr(),
  repeatable: computed('items', 'references', function() {
    let items = A(get(this, 'items')).map((item) => {
      let keys = Object.keys(item);
      if (keys.length > 0) {
        if (keys.length === 1 && get(item, `${keys[0]}.link_type`) === "Document") {
          let model = this.references.filterBy('id', get(item, `${keys[0]}.uid`))[0];
          // let generic = EmberObject.create(get(item, keys[0]));
          return model ? model : get(item, keys[0]);
        }
      }
      return item;
    })

    return items;
  }),
  references: hasMany('prismic-document', { polymorphic: true, async: false })
});
