import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Helper | prismic-html', function(hooks) {
  setupRenderingTest(hooks);

  // Replace this with your real tests.
  test('it renders', async function(assert) {
    this.set('inputValue', [
      {
        "type": "paragraph",
        "text": "Jeff wrote this addon after being frustrated with not having a data adapter for prismic. He knew Prismic was a little funky in the way it operated compared to other data sources, but still felt that having a data adapter would be great.",
        "spans": [
          {
            "start": 97,
            "end": 104,
            "type": "hyperlink",
            "data": {
              "link_type": "Web",
              "url": "https://prismic.io"
            }
          },
          {
            "start": 165,
            "end": 169,
            "type": "em"
          },
          {
            "start": 213,
            "end": 220,
            "type": "strong"
          }
        ]
      }
    ]);

    await render(hbs`{{prismic-html inputValue}}`);
    assert.equal(this.element.querySelector('a').href, 'https://prismic.io/');
    assert.equal(this.element.querySelector('em').textContent, 'data');
    assert.equal(this.element.querySelector('strong').textContent, 'adapter');
    assert.equal(this.element.textContent.trim(), 'Jeff wrote this addon after being frustrated with not having a data adapter for prismic. He knew Prismic was a little funky in the way it operated compared to other data sources, but still felt that having a data adapter would be great.');
  });
});
