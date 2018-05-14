import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Prismic from 'prismic-javascript';

module('Unit | Adapter | prismic', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let adapter = this.owner.lookup('adapter:prismic');
    assert.ok(adapter);
  });
});
