import { moduleFor, test } from 'ember-qunit';

moduleFor('adapter:prismic', 'Unit | Adapter | prismic', {
  // Specify the other units that are required for this test.
  needs: ['service:prismic']
});

// Replace this with your real tests.
test('it exists', function(assert) {
  let adapter = this.subject();
  assert.ok(adapter);
});
