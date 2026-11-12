'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const {runInNewContext} = require('node:vm');
let generate;
const context = {module: {exports: {}}, require, hexo: {
  config: {}, theme: {config: {sections: [{folder: 'notes', label: '笔记'}, {folder: 'reading', label: '阅读'}]}},
  extend: {filter: {register(name, fn) { assert.equal(name, 'before_generate'); generate = fn; }}}
}};
runInNewContext(readFileSync(join(__dirname, '../scripts/folder-categories.js'), 'utf8'), context);
const {folderCategories} = context.module.exports;
const sections = [{folder: 'notes', label: '笔记'}, {folder: 'reading', label: '阅读'}];
const list = value => JSON.parse(JSON.stringify(value));

test('递归目录默认生成分类链，根目录与独立页没有凭空分类', () => {
  assert.deepEqual(list(folderCategories('_posts/notes/reading/book.md', sections)), ['笔记', '阅读']);
  assert.deepEqual(list(folderCategories('_posts/notes/未映射/book.md', sections)), ['笔记', '未映射']);
  assert.deepEqual(list(folderCategories('_posts/book.md', sections)), []);
  assert.deepEqual(list(folderCategories('about/index.md', sections)), []);
});

test('不读取 front-matter 分类，文件夹变化即改变归属', () => {
  assert.deepEqual(list(folderCategories('_posts/notes/a.md', sections)), ['笔记']);
  assert.deepEqual(list(folderCategories('_posts/reading/a.md', sections)), ['阅读']);
  assert.deepEqual(list(folderCategories('_posts/a.md', sections)), []);
});

test('通过 Hexo setCategories 更新关系，不写入只读 categories getter', async () => {
  let received;
  const post = {source: '_posts/notes/reading/book.md', raw: '---\ntitle: 书\n---\n正文', setCategories: async value => { received = value; }};
  Object.defineProperty(post, 'categories', {get: () => { throw new Error('不应从缓存分类反推作者元数据'); }});
  context.hexo.model = () => ({toArray: () => [post]});
  await generate();
  assert.deepEqual(list(received), ['笔记', '阅读']);
  assert.equal(context.hexo.config.category_map['笔记'], 'notes');
});
