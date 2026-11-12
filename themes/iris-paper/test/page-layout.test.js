'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const ejs = require('ejs');
const {JSDOM} = require('jsdom');

const template = readFileSync(join(__dirname, '../layout/_partial/page-title.ejs'), 'utf8');

test('标题输出为单一文本节点，保留原始标题并转义', () => {
  const title = '耳光响亮，和解草草：《章鱼噼的原罪》的叙事塌陷';
  const doc = new JSDOM(ejs.render(template, {title})).window.document;
  const h1 = doc.querySelector('.page-title');
  assert.equal(h1.tagName, 'H1');
  assert.equal(h1.textContent, title);
  assert.equal(h1.children.length, 0);
  const escaped = new JSDOM(ejs.render(template, {title: '<你好> 🏳️‍⚧️'})).window.document;
  assert.equal(escaped.querySelector('h1').textContent, '<你好> 🏳️‍⚧️');
  assert.equal(escaped.querySelector('你好'), null);
});

test('首页、归档、分类、标签、其他页面与最近更新复用 page 模板', () => {
  for (const name of ['index', 'archive', 'categories', 'tags', 'misc', 'updates']) {
    const source = readFileSync(join(__dirname, `../layout/${name}.ejs`), 'utf8');
    assert.match(source, /partial\('page',/);
    assert.doesNotMatch(source, /archive-page/);
  }
  const css = readFileSync(join(__dirname, '../source/css/pages.css'), 'utf8');
  assert.match(css, /\.page-header \.page-title::after\s*\{[^}]*display: inline-block;[^}]*vertical-align: bottom;/);
});

test('文学段落外边距保留作者原来的 0.75em，所有 main 使用 1000px 上限，page 宽度为 800px', () => {
  const presets = readFileSync(join(__dirname, '../source/css/presets.css'), 'utf8');
  const base = readFileSync(join(__dirname, '../source/css/base.css'), 'utf8');
  const layout = readFileSync(join(__dirname, '../source/css/layout.css'), 'utf8');
  assert.match(presets, /\[data-typography="literary"\] \.article-content p\s*\{\s*margin: 0\.75em;/);
  assert.match(base, /--content-width: 1000px;/);
  assert.match(base, /--page-width: 800px;/);
  assert.match(layout, /#main-content\s*\{[^}]*max-width: 1000px;/);
});
