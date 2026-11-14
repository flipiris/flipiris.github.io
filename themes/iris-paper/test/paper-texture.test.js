'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join, dirname, resolve} = require('node:path');
const {JSDOM} = require('jsdom');

test('纸纹只用于 literary / poem 的 content-page，保留配色和文字层', () => {
  const cssPath = join(__dirname, '../source/css/presets.css');
  const css = readFileSync(cssPath, 'utf8');
  const doc = new JSDOM(`<style>${css}</style><body><article class="content-page"><div class="article-content"></div></article></body>`).window.document;
  const rule = [...doc.styleSheets[0].cssRules].find(rule => rule.style?.getPropertyValue('background-image'));
  assert.ok(rule);
  for (const typography of ['standard', 'enhanced', 'literary', 'poem']) {
    doc.body.dataset.typography = typography;
    assert.equal(doc.querySelector('.content-page').matches(rule.selectorText), ['literary', 'poem'].includes(typography));
    assert.equal(doc.querySelector('.article-content').matches(rule.selectorText), false);
  }
  assert.equal(rule.style.getPropertyValue('background-repeat'), 'repeat');
  assert.equal(rule.style.getPropertyValue('background-color'), '');
  assert.equal(rule.style.getPropertyValue('filter'), '');
  const asset = rule.style.getPropertyValue('background-image').match(/url\(["']?([^"')]+)["']?\)/)[1];
  const svg = new JSDOM(readFileSync(resolve(dirname(cssPath), asset), 'utf8'), {contentType: 'image/svg+xml'}).window.document;
  assert.equal(svg.querySelectorAll('feTurbulence[stitchTiles="stitch"]').length, 2);
  assert.equal(svg.querySelector('feFuncA').getAttribute('slope'), '.07');
});
