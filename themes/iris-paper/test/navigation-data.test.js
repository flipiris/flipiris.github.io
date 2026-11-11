'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const {runInNewContext} = require('node:vm');

function fixture() {
  const helpers = {};
  const generators = {};
  runInNewContext(readFileSync(join(__dirname, '../scripts/navigation-data.js'), 'utf8'), {
    hexo: {
      config: {category_dir: 'categories'},
      extend: {
        helper: {register: (name, fn) => { helpers[name] = fn; }},
        generator: {register: (name, fn) => { generators[name] = fn; }}
      }
    }
  });
  return {helpers, generators};
}

test('最近新增按发布日期而非更新日期排序，包含独立页并排除草稿，最多五项', () => {
  const posts = Array.from({length: 6}, (_, i) => ({
    title: `文章${i}`, path: `post-${i}/`, date: new Date(2026, 0, i + 1)
  }));
  posts[0].updated = new Date(2027, 0, 1);
  posts.push({title: '草稿', published: false, path: 'draft/', date: new Date(2028, 0, 1)});
  const pages = [{title: '关于', path: 'about/', date: new Date(2026, 1, 1)}];
  const result = fixture().helpers.recent_pages.call({site: {
    posts: {toArray: () => posts}, pages: {toArray: () => pages}
  }});
  assert.deepEqual(Array.from(result, item => item.label), ['关于', '文章5', '文章4', '文章3', '文章2']);
  assert.equal(result[0].path, 'about/');
  assert.equal(posts[0].title, '文章0');
});

test('空站点不生成虚假的最近新增入口，分类索引仍有可访问的页面', () => {
  const {helpers, generators} = fixture();
  assert.equal(helpers.recent_pages.call({site: {
    posts: {toArray: () => []}, pages: {toArray: () => []}
  }}).length, 0);
  const index = generators['category-index']();
  assert.equal(index.path, 'categories/index.html');
  assert.equal(index.layout, 'categories');
});
