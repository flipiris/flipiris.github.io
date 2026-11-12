'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const {JSDOM} = require('jsdom');

const page = readFileSync(join(__dirname, '../../../source/appearance/index.md'), 'utf8');
const form = page.slice(page.indexOf('<form'), page.indexOf('</form>') + 7);
const source = readFileSync(join(__dirname, '../../../source/attachments/appearance/script.js'), 'utf8');

test('外观实验室只更新布局数据、媒体条件和输出，保留全部检测选项', () => {
  const dom = new JSDOM(`<html><head><meta name="color-scheme"></head><body class="sample">${form}<pre id="appearance-code"></pre><p id="appearance-status"></p></body></html>`, {runScripts: 'outside-only'});
  const {window} = dom;
  const {document} = window;
  const controls = document.querySelector('form');
  const frames = [];
  window.requestAnimationFrame = callback => frames.push(callback);
  let updates = 0;
  document.addEventListener('appearance:layout', () => updates++);
  window.eval(source);
  for (const layout of ['article', 'page', 'canvas']) {
    controls.elements.layout.value = layout;
    controls.elements.palette.value = 'ink';
    controls.elements.typography.value = 'literary';
    controls.elements.alignment.value = 'balanced';
    controls.dispatchEvent(new window.Event('change'));
    assert.equal(document.body.dataset.layout, layout);
    assert.equal(document.body.dataset.typography, 'literary');
    assert.equal(document.body.dataset.alignment, 'balanced');
    assert.equal(document.body.dataset.canvas, layout === 'canvas' ? 'prose' : undefined);
    assert.equal(document.body.className, 'sample');
    assert.equal(document.querySelector('meta').content, 'dark');
    assert.match(document.querySelector('#appearance-code').textContent, new RegExp(`layout: ${layout}`));
  }
  controls.reset();
  frames.splice(0).forEach(callback => callback());
  assert.equal(document.body.dataset.layout, 'article');
  assert.equal(document.body.dataset.palette, 'rose');
  assert.equal(document.querySelector('meta').content, 'light');
  assert.equal(updates, 5);
  window.close();
});
