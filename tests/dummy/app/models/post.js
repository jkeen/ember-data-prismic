import Prismic from 'ember-data-prismic/models/prismic-document';
import attr from 'ember-data/attr';
import { belongsTo } from 'ember-data/relationships';

export default Prismic.extend({
  author: belongsTo('author'),
  date  : attr('date'),
  title : attr('string')
});
