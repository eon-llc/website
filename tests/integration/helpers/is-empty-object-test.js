import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Helper | is-empty-object', function(hooks) {
  setupRenderingTest(hooks);

  test('returns true for empty objects', async function(assert) {
    this.set('inputValue', {});

    await render(hbs`{{#if (is-empty-object inputValue)}}empty{{else}}not empty{{/if}}`);

    assert.equal(this.element.textContent.trim(), 'empty');
  });

  test('returns false for non-empty objects', async function(assert) {
    this.set('inputValue', {key1: 'value'});

    await render(hbs`{{#if (is-empty-object inputValue)}}empty{{else}}not empty{{/if}}`);

    assert.equal(this.element.textContent.trim(), 'not empty');
  });
});
