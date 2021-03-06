import { module, test } from 'qunit';
import {
  visit,
  currentURL,
  findAll,
  waitFor
} from '@ember/test-helpers';
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
    await visit('/');
    assert.equal(currentURL(), '/');
    await waitFor('div[data-slice-type="recommended_posts"] > a:not(.loading):nth-child(2)');

    assert.deepEqual(findAll('div[data-slice-type="recommended_posts"] > a').map(t => t.textContent), ["This is another thing you should read", "Hot development tips"], "should be two links");
  });

  test('visiting single post displays links to referenced slices', async function(assert) {
    await visit('/post/development-has-started');
    assert.equal(currentURL(), '/post/development-has-started');
    await waitFor('div[data-slice-type="recommended_posts"] > a:not(.loading):nth-child(2)');

    assert.deepEqual(findAll('div[data-slice-type="recommended_posts"] > a').map(t => t.textContent), ["This is another thing you should read", "Hot development tips"], "should be two links");
  });
});
