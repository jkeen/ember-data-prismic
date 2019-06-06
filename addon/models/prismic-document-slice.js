import { A } from '@ember/array';
import EmberObject from '@ember/object';
import { get, computed } from '@ember/object';

export default EmberObject.extend({
  repeatable: computed('items', 'parent.references', function() {
    let items = A(get(this, 'items')).map((item) => {
      let keys = Object.keys(item);
      if (keys.length > 0) {
        if (keys.length === 1 && get(item, `${keys[0]}.link_type`) === "Document") {
          let model = A(get(this, 'parent.references')).filterBy('id', get(item, `${keys[0]}.uid`))[0];
          // let generic = EmberObject.create(get(item, keys[0]));
          return model ? model : get(item, keys[0]);
        }
      }
      return item;
    })

    return items;
  })
});
