import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';

module('Acceptance | prismic', function(hooks) {
  setupApplicationTest(hooks);

  test('visiting url with two uids will load both ways', async function(assert) {
    await visit('/post/development-has-started');
    assert.equal(currentURL(), '/post/development-has-started');

    await visit('/post/ember-data-prismic-development');
    assert.equal(currentURL(), '/post/development-has-started');
  });
});
