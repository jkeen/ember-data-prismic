import PrismicSerializer from 'ember-data-prismic/serializers/prismic';

export default PrismicSerializer.extend({
  attrs: {
    author: { embedded: 'always' },
  }
});
