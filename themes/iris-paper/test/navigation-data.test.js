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
    require,
    hexo: {
      theme: {config: {nav_categories: [{label: '文章'}, {label: '评论'}]}},
      config: {category_dir: 'categories', tag_dir: 'tags', filename_case: 0},
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

test('侧栏分类按主题配置排列，带文章数；没有文章的分类也指向可访问的页面', () => {
  const {helpers} = fixture();
  const found = {name: '文章', length: 3, path: 'categories/文章/'};
  const result = helpers.nav_sections.call({
    config: {category_dir: 'categories', filename_case: 0},
    theme: {
      nav_primary: [{label: '页面一览', path: '/archives/'}, {label: '标签索引', path: '/tags/'}],
      nav_categories: [{label: '文章', icon: 'article'}, {label: '评论', icon: 'forum'}]
    },
    site: {categories: {findOne: query => query.name === '文章' ? found : null}}
  });
  assert.deepEqual(Array.from(result.primary, item => item.label), ['页面一览', '标签索引']);
  assert.deepEqual(Array.from(result.categories, item => [item.label, item.icon, item.count]), [['文章', 'article', 3], ['评论', 'forum', 0]]);
  assert.equal(result.categories[0].path, 'categories/文章/');
  assert.match(result.categories[1].path, /^categories\/.+\/$/);
});

test('标签索引页与未创建文章的导航分类都会生成页面', () => {
  const {generators} = fixture();
  assert.equal(generators['tag-index']().path, 'tags/index.html');
  assert.equal(generators['tag-index']().layout, 'tags');
  const pages = generators['nav-category-pages']({categories: {findOne: query => query.name === '文章' ? {} : null}});
  assert.equal(pages.length, 1);
  assert.equal(pages[0].data.category, '评论');
  assert.match(pages[0].path, /index\.html$/);
});
