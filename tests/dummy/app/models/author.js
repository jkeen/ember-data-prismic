import Prismic from 'ember-data-prismic/models/prismic';
import attr from 'ember-data/attr';
import { computed, get } from '@ember/object';
export default Prismic.extend({
  firstName: attr('string'),
  lastName: attr('string'),
  name: computed('firstName', 'lastName', function() {
    return [get(this, 'firstName'), get(this, 'lastName')].join(" ");
  }),
  photo: attr('prismic-object'),
  bio: attr('prismic-object')
});
