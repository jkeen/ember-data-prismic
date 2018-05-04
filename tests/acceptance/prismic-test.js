import { module, test } from 'qunit';
import { visit, currentURL, findAll } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';

module('Acceptance | prismic', function(hooks) {
  setupApplicationTest(hooks);

  test('visiting url with two uids will load both ways', async function(assert) {
    await visit('/post/development-has-started');
    assert.equal(currentURL(), '/post/development-has-started');

    await visit('/post/ember-data-prismic-development');
    assert.equal(currentURL(), '/post/development-has-started');
  });

  test('visiting /posts displays links to referenced slices', async function(assert) {
    await visit('/posts');
    assert.equal(currentURL(), '/posts');

    assert.deepEqual(findAll('div[data-slice-type="recommended_posts"] > a').map(d => d.textContent), ["This is another thing you should read", "Hot development tips"], "should be two links");
  });

  test('visiting single post displays links to referenced slices', async function(assert) {
    await visit('/post/development-has-started');
    assert.equal(currentURL(), '/post/development-has-started');

    assert.deepEqual(findAll('div[data-slice-type="recommended_posts"] > a').map(d => d.textContent), ["This is another thing you should read", "Hot development tips"], "should be two links");
  });
});
