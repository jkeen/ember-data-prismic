import { moduleForModel, test } from 'ember-qunit';
import PrismicModel from 'ember-data-prismic/models/prismic-document';
import PrismicSlice from 'ember-data-prismic/models/prismic-document-slice';

import PrismicObjectTransform from 'ember-data-prismic/transforms/prismic-object';
import PrismicAdapter from 'ember-data-prismic/adapters/prismic';
import PrismicSerializer from 'ember-data-prismic/serializers/prismic';

import attr from 'ember-data/attr';
import { get, computed } from '@ember/object';
import { belongsTo } from 'ember-data/relationships';
import singlePostWithAuthor from '../../helpers/responses/single-post-with-author';
import singlePostWithSliceReferencingPost from '../../helpers/responses/single-post-with-slice-referencing-post';
import singlePostWithSliceReferencingUnknown from '../../helpers/responses/single-post-with-slice-referencing-unknown';
import allPosts from '../../helpers/responses/all-posts';

import { A } from '@ember/array';

var Post, Author;

moduleForModel('prismic-document', 'Unit | Serializer | prismic', {
  // Specify the other units that are required for this test.
  needs: ['serializer:prismic', 'service:prismic'],
  beforeEach() {
    const ApplicationAdapter = PrismicAdapter.extend({});
    this.registry.register('adapter:application', ApplicationAdapter);

    const ApplicationSerializer = PrismicSerializer.extend({});
    this.registry.register('serializer:application', ApplicationSerializer);

    Post = PrismicModel.extend({
      author: belongsTo('author'),
      date  : attr('date'),
      slug  : attr('string'),
      title : attr('string')
    });

    Author = PrismicModel.extend({
      firstName: attr('string'),
      lastName : attr('string'),
      name     : computed('firstName', 'lastName', function() {
        return [get(this, 'firstName'), get(this, 'lastName')].join(" ");
      }),
      photo    : attr('prismic-object'),
      bio      : attr('prismic-object')
    });

    this.registry.register('model:prismic-document', PrismicModel);
    this.registry.register('model:prismic-document-slice', PrismicSlice);
    this.registry.register('transform:prismic-object', PrismicObjectTransform);
    this.registry.register('model:post', Post);
    this.registry.register('model:author', Author);
  }
});

// Sanity check to make sure everything is setup correctly.
test('returns correct serializer for Post', function(assert) {
  assert.ok(this.store().serializerFor('post') instanceof PrismicSerializer, 'serializer returned from serializerFor is an instance of PrismicSerializer');
});

test('normalize with empty resourceHash', function(assert) {
  let resourceHash = null;
  let serializer = this.store().serializerFor('post');

  assert.deepEqual(serializer.normalize(Post, resourceHash), { data: null });
});

test('normalize with single Post payload', function(assert) {
  let serializer = this.store().serializerFor('post');
  let singlePost = singlePostWithAuthor;

  let normalizedPost = serializer.normalizeSingleResponse(this.store(), Post, singlePost);

  assert.equal(normalizedPost.data.type, "post", "type should be post");
  assert.equal(normalizedPost.data.attributes.title, singlePost.data.title, "titles should be the same");
  assert.equal(normalizedPost.data.id, singlePost.uid, "id should be the uid");

  let expectedCreatedAt = new Date(normalizedPost.data.attributes.date);
  let actualCreatedAt = new Date(singlePost.data.date);
  assert.equal(expectedCreatedAt.toString(), actualCreatedAt.toString());
});

test('author is included and referenced in relationships', function(assert) {
  let serializer = this.store().serializerFor('post');
  let postResponse = singlePostWithAuthor;

  let normalizedPost = serializer.normalizeSingleResponse(this.store(), Post, postResponse);

  let author = normalizedPost.data.relationships.author.data;
  assert.equal(author.id, postResponse.data.author.uid);
  assert.equal(author.type, postResponse.data.author.type);

  let authorIncludes = A(normalizedPost.included).filter(d => d.type === 'author')
  let authorInclude = authorIncludes[0];

  assert.equal(authorInclude.id, postResponse.data.author.uid, "id should be uid");
  assert.equal(authorInclude.type, "author");
  assert.equal(authorInclude.attributes.firstName, postResponse.data.author.data.first_name);
  assert.equal(authorInclude.attributes.lastName, postResponse.data.author.data.last_name);
  assert.equal(authorInclude.attributes.recordId, postResponse.data.author.id);
});

test('slices should be included as relationships', function(assert) {
  let serializer = this.store().serializerFor('post');
  let singlePost = singlePostWithAuthor;

  let normalizedPost = serializer.normalizeSingleResponse(this.store(), Post, singlePost);

  let expectedSlices = singlePost.data.body;
  let actualSlicesInRelationships   = normalizedPost.data.relationships.body.data;
  let actualSlicesInIncludes = A(normalizedPost.included).filter(d => d.type === 'prismic-document-slice')
  assert.equal(expectedSlices.length, actualSlicesInRelationships.length, "slice count should be the same in relationships");
  assert.equal(expectedSlices.length, actualSlicesInIncludes.length, "slice count should be the same in includes");

  actualSlicesInRelationships.forEach((r, i) => {
    assert.equal(r.type, 'prismic-document-slice', 'type should be prismic-document-slice');
    assert.equal(r.id, `${singlePost.uid}_s${i}`, "should have unique ids");
  });

  actualSlicesInIncludes.forEach((r, i) => {
    assert.equal(r.type, 'prismic-document-slice', 'type should be prismic-document-slice');
    assert.equal(r.id, `${singlePost.uid}_s${i}`, "should have unique ids");
  });
});

test('document linked within a slice should be included as relationship in all posts response', function(assert) {

  // post
  //  -> slice
  //  -> slice
  //    -> post
  //  -> slice

  let serializer = this.store().serializerFor('post');
  let normalizedPost = serializer.normalizeArrayResponse(this.store(), Post, allPosts);
  let referencedPostsInIncludes = A(normalizedPost.included).filter(d => d.type === 'post')
  assert.equal(referencedPostsInIncludes.length, 2, "should be included");

  let referenceSlice = normalizedPost.included.filter(d => d.id === 'development-has-started_s2')[0];

  assert.equal(get(referenceSlice, 'relationships.references.data').length, 2, "relationships to posts should be listed");
});


test('document linked within a slice should be included as relationship', function(assert) {

  // post
  //  -> slice
  //  -> slice
  //    -> post
  //  -> slice

  let serializer = this.store().serializerFor('post');
  let post = singlePostWithSliceReferencingPost;
  let normalizedPost = serializer.normalizeSingleResponse(this.store(), Post, post);
  let referencedPostsInIncludes = A(normalizedPost.included).filter(d => d.type === 'post')
  assert.equal(referencedPostsInIncludes.length, 2, "should be included");

  let referenceSlice = normalizedPost.included.filter(d => d.id === 'development-has-started_s2')[0];

  assert.equal(get(referenceSlice, 'relationships.references.data').length, 2, "relationships to posts should be listed");
});

test('unknown document linked within a slice should be included as relationship', function(assert) {

  // post
  //  -> slice
  //  -> slice
  //    -> song
  //  -> slice

  let serializer = this.store().serializerFor('post');
  let post = singlePostWithSliceReferencingUnknown;
  let normalizedPost = serializer.normalizeSingleResponse(this.store(), Post, post);
  let referencedPostsInIncludes = A(normalizedPost.included).filter(d => d.type === 'prismic-document')
  assert.equal(referencedPostsInIncludes.length, 1, "should be included");
});

test('included should not have deep relationships with attributes', function(assert) {
  let serializer = this.store().serializerFor('post');
  let post = singlePostWithSliceReferencingPost;
  let normalizedPost = serializer.normalizeSingleResponse(this.store(), Post, post);
  let recommendedPosts = normalizedPost.included.find(d => d.attributes.sliceType === 'recommended_posts')
  assert.equal(recommendedPosts.relationships.references.data[0].attributes, undefined, "should not have attributes");
});

// test('included slices should have ids based off parent', function(assert) {
//   let serializer = this.store().serializerFor('post');
//   let post = singlePostWithSliceReferencingPost;
//   let normalizedPost = serializer.normalizeSingleResponse(this.store(), Post, post);
//   A(normalizedPost.included).filterBy('type', "prismic-document-slice").forEach(inc => {
//
//   });
// });

test('included posts in single response should keep recordId and use uid for id', function(assert) {
  let serializer = this.store().serializerFor('post');
  let post = singlePostWithSliceReferencingPost;
  let normalizedPost = serializer.normalizeSingleResponse(this.store(), Post, post);
  A(normalizedPost.included).filterBy('type', "post").forEach(inc => {
    assert.notEqual(inc.attributes.recordId, inc.attributes.uid, "should not have same record id and uid");
    assert.notEqual(inc.attributes.recordId, inc.id, "should not have same record id and uid");
    assert.equal(inc.id, inc.attributes.uid, "have same uid and id");
  });
});

test('included posts in all posts response should keep recordId and use uid for id', function(assert) {
  let serializer = this.store().serializerFor('post');
  let normalizedPost = serializer.normalizeArrayResponse(this.store(), Post, allPosts);
  A(normalizedPost.included).filterBy('type', "post").forEach(inc => {
    assert.notEqual(inc.attributes.recordId, inc.attributes.uid, "should not have same record id and uid");
    assert.notEqual(inc.attributes.recordId, inc.id, "should not have same record id and uid");
    assert.equal(inc.id, inc.attributes.uid, "have same uid and id");
  });
});

test('slice items should have single top level key', function(assert) {
  let serializer = this.store().serializerFor('post');
  let post = singlePostWithSliceReferencingPost;
  let normalizedPost = serializer.normalizeSingleResponse(this.store(), Post, post);
  A(normalizedPost.included).filterBy('type', "prismic-document-slice").forEach(slice => {
    A(slice.attributes.items).forEach(item => {
      if (Object.keys(item).length > 0) {
        assert.ok(Object.keys(item).length === 1, `should have single top level key`);
      }
    })
  });
});

test('slice items should have single top level key in all response', function(assert) {
  let serializer = this.store().serializerFor('post');
  let normalizedPost = serializer.normalizeArrayResponse(this.store(), Post, allPosts);

  A(normalizedPost.included).filterBy('type', "prismic-document-slice").forEach(slice => {
    A(slice.attributes.items).forEach(item => {
      if (Object.keys(item).length > 0) {
        assert.ok(Object.keys(item).length === 1, `should have single top level key`);
      }
    })
  });
});
