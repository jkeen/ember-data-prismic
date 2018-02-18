import Transform from 'ember-data/transform';
import { RichText } from 'prismic-dom'
import Ember from 'ember';
const { String } = Ember
export default Transform.extend({
  deserialize(serialized) {
    return String.htmlSafe(RichText.asHtml(serialized));
  },

  serialize(deserialized) {
    return RichText.asHtml(deserialized);
  }
});
