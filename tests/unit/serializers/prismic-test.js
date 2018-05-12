import { moduleForModel, test } from 'ember-qunit';
import PrismicModel from 'ember-data-prismic/models/prismic-document';
import PrismicSlice from 'ember-data-prismic/models/prismic-document-slice';

import PrismicAdapter from 'ember-data-prismic/adapters/prismic';
import PrismicSerializer from 'ember-data-prismic/serializers/prismic';

import attr from 'ember-data/attr';
import { get, computed } from '@ember/object';
import { belongsTo } from 'ember-data/relationships';
import singlePostWithAuthor from '../../helpers/responses/single-post-with-author';
import singlePostWithSliceReferencingPost from '../../helpers/responses/single-post-with-slice-referencing-post';
import singlePostWithSliceReferencingUnknown from '../../helpers/responses/single-post-with-slice-referencing-unknown';
import allPosts from '../../helpers/responses/all-posts';
import { getOwner } from '@ember/application';
// import { run } from '@ember/runloop';
import { A } from '@ember/array';

var Post, Author;
// let env, store, adapter, serializer;

moduleForModel('prismic-document', 'Unit | Serializer | prismic', {
  // Specify the other units that are required for this test.
  needs: ['serializer:prismic', 'service:prismic', 'model:prismic-document'],
  beforeEach() {
    const owner = getOwner(this);


    const ApplicationAdapter = PrismicAdapter.extend({});
    owner.register('adapter:application', ApplicationAdapter);

    const ApplicationSerializer = PrismicSerializer.extend({});
    owner.register('serializer:application', ApplicationSerializer);

    Post = PrismicModel.extend({
      author: belongsTo('author'),
      date  : attr('date'),
      title : attr('string')
    });

    Author = PrismicModel.extend({
      firstName: attr('string'),
      lastName : attr('string'),
      name     : computed('firstName', 'lastName', function() {
        return [get(this, 'firstName'), get(this, 'lastName')].join(" ");
      }),
      photo    : attr(),
      bio      : attr()
    });

    owner.register('model:prismic-document', PrismicModel);
    owner.register('model:prismic-document-slice', PrismicSlice);
    owner.register('model:post', Post);
    owner.register('model:author', Author);
  }
});

// Sanity check to make sure everything is setup correctly.
test('returns correct serializer for Post', function(assert) {
  assert.ok(this.store().serializerFor('post') instanceof PrismicSerializer, 'serializer returned from serializerFor is an instance of PrismicSerializer');
});

test('normalize with empty resourceHash', function(assert) {
  let resourceHash = null;
  let serializer = this.store().serializerFor('post');

  assert.deepEqual(serializer.normalize(this.store().modelFor('post'), resourceHash), { data: null });
});

test('normalize with single Post payload', async function(assert) {
  let serializer = this.store().serializerFor('post');

  let singlePost = singlePostWithAuthor;
  let normalizedPost = serializer.normalizeSingleResponse(this.store(), this.store().modelFor('post'), singlePost);

  assert.equal(get(normalizedPost, 'data.attributes.title'), singlePost.data.title, "titles should be the same");
  assert.equal(get(normalizedPost, 'data.id'), singlePost.uid, "id should be the uid");
  assert.equal(get(normalizedPost, 'data.type'), "post", "type should be post");

  let expectedCreatedAt = new Date(normalizedPost.data.attributes.date);
  let actualCreatedAt = new Date(singlePost.data.date);
  assert.equal(expectedCreatedAt.toString(), actualCreatedAt.toString());
});

test('author is an embedded relationship', function(assert) {
  let serializer = this.store().serializerFor('post');
  let postResponse = singlePostWithAuthor;

  let normalizedPost = serializer.normalizeResponse(this.store(), this.store().modelFor('post'), postResponse, 'development-has-started', 'findRecord');

  let author = normalizedPost.data.relationships.author.data;
  assert.equal(author.type, postResponse.data.author.type, 'type should be');
  assert.equal(author.first_name, postResponse.data.author.first_name, 'first name')
});

test('document linked within a slice should be included as relationship in all posts response', function(assert) {
  // post
  //  -> slice
  //  -> slice
  //    -> post
  //  -> slice

  let serializer = this.store().serializerFor('post');
  let normalizedPost = serializer.normalizeArrayResponse(this.store(), this.store().modelFor('post'), allPosts);
  let referencePost = normalizedPost.data.filter(d => d.id === 'development-has-started')[0];
  assert.equal(get(referencePost, 'relationships.references.data').length, 2, "relationships to posts should be listed");
});

test('document linked within a slice should be included as relationship', function(assert) {
  // post
  //  -> slice
  //  -> slice
  //    -> post
  //  -> slice

  let serializer = this.store().serializerFor('post');
  let post = singlePostWithSliceReferencingPost;
  let normalizedPost = serializer.normalizeSingleResponse(this.store(), this.store().modelFor('post'), post);
  assert.equal(get(normalizedPost, 'data.relationships.references.data').length, 2, "relationships to posts should be listed");
});

test('unknown document linked within a slice should be included as relationship', function(assert) {

  // post
  //  -> slice
  //  -> slice
  //    -> song
  //  -> slice

  let serializer = this.store().serializerFor('post');
  let post = singlePostWithSliceReferencingUnknown;
  let normalizedPost = serializer.normalizeSingleResponse(this.store(), this.store().modelFor('post'), post);
  assert.equal(get(normalizedPost, 'data.relationships.references.data').length, 1, "relationships to posts should be listed");
});
