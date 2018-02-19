import Prismic from 'ember-data-prismic/models/prismic';
import attr from 'ember-data/attr';
import { belongsTo, hasMany } from 'ember-data/relationships';

export default Prismic.extend({
  author: belongsTo('author'),
  body: hasMany('prismic-slice'),
  date: attr('date'),
  slug: attr('string'),
  title: attr('string')
});
