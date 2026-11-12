'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const {runInNewContext} = require('node:vm');
const {createRequire} = require('node:module');

function fixture() {
  const helpers = {};
  const generators = {};
  runInNewContext(readFileSync(join(__dirname, '../scripts/navigation-data.js'), 'utf8'), {
    require: createRequire(join(__dirname, '../scripts/navigation-data.js')),
    hexo: {
      theme: {config: {
        nav_categories: [{label: '作品'}, {label: '随笔'}],
        nav_misc: {label: '其他页面', icon: 'folder_open', path: '/misc/'}
      }},
      config: {category_dir: 'categories', tag_dir: 'tags', filename_case: 0},
      extend: {
        helper: {register: (name, fn) => { helpers[name] = fn; }},
        generator: {register: (name, fn) => { generators[name] = fn; }}
      }
    }
  });
  return {helpers, generators};
}

test('最近更新按修改日期排序，包含独立页、排除草稿，不限制条数', () => {
  const posts = Array.from({length: 6}, (_, i) => ({
    title: `文章${i}`, path: `post-${i}/`, date: new Date(2026, 0, i + 1)
  }));
  posts[0].updated = new Date(2027, 0, 1);
  posts.push({title: '草稿', published: false, path: 'draft/', date: new Date(2028, 0, 1)});
  const pages = [{title: '关于', path: 'about/', date: new Date(2026, 1, 1)}];
  const result = fixture().helpers.updated_pages.call({site: {
    posts: {toArray: () => posts}, pages: {toArray: () => pages}
  }});
  assert.deepEqual(Array.from(result, item => item.title), ['文章0', '关于', '文章5', '文章4', '文章3', '文章2', '文章1']);
  assert.equal(result[0].path, 'post-0/');
  assert.equal(posts[0].title, '文章0');
});

test('空站点没有虚假的最近更新内容，分类索引仍有可访问的页面', () => {
  const {helpers, generators} = fixture();
  assert.equal(helpers.updated_pages.call({site: {
    posts: {toArray: () => []}, pages: {toArray: () => []}
  }}).length, 0);
  const [index] = generators['category-index']();
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
  assert.equal(generators['tag-index']()[0].path, 'tags/index.html');
  assert.equal(generators['tag-index']()[0].layout, 'tags');
  const pages = generators['nav-category-pages']({categories: {findOne: query => query.name === '作品' ? {} : null}});
  assert.equal(pages.length, 1);
  assert.equal(pages[0].data.category, '随笔');
  assert.match(pages[0].path, /index\.html$/);
});

test('其他页面收录没有导航分类的文章与独立页，按发布日期倒序；有分类的不收录', () => {
  const {helpers, generators} = fixture();
  const category = name => ({toArray: () => [{name}]});
  const none = {toArray: () => []};
  const posts = [
    {title: '无分类', path: 'a/', date: new Date(2026, 0, 2), categories: none},
    {title: '作品', path: 'b/', date: new Date(2026, 0, 3), categories: category('作品')},
    {title: '随笔', path: 'c/', date: new Date(2026, 0, 4), categories: category('随笔')},
    {title: '未列入导航的分类', path: 'd/', date: new Date(2026, 0, 5), categories: category('杂项')},
    {title: '草稿', path: 'e/', published: false, date: new Date(2026, 0, 6), categories: none}
  ];
  const pages = [{title: '关于', path: 'about/', date: new Date(2026, 0, 1), categories: none}];
  const locals = {posts: {toArray: () => posts}, pages: {toArray: () => pages}};
  const theme = {nav_categories: [{label: '作品'}, {label: '随笔'}], nav_misc: {label: '其他页面', icon: 'folder_open', path: '/misc/'}};
  const index = generators['misc-index'].call({}, locals);
  assert.equal(index.path, 'misc/index.html');
  assert.equal(index.layout, 'misc');
  assert.deepEqual(Array.from(index.data.posts.toArray(), item => item.title), ['未列入导航的分类', '无分类', '关于']);
  const sections = helpers.nav_sections.call({
    config: {category_dir: 'categories', filename_case: 0}, theme,
    site: {categories: {findOne: () => null}, posts: locals.posts, pages: locals.pages}
  });
  assert.equal(sections.misc.count, 3);
  assert.equal(sections.misc.path, '/misc/');
});

test('最近更新索引输出所有内容，缺少修改日期则取发布日期，同日按路径稳定排序', () => {
  const date = new Date('2026-11-11T00:00:00Z');
  const locals = {
    posts: {toArray: () => [{title: '后', path: 'z/', date}, {title: '前', path: 'a/', updated: date}]},
    pages: {toArray: () => [{title: '独立页', path: 'page/', date: new Date('2026-11-12T00:00:00Z')}, {published: false, path: 'draft/'}]}
  };
  const result = fixture().generators['updates-index'](locals);
  const titles = [];
  result.data.posts.each(page => titles.push(page.title));
  assert.equal(result.path, 'updates/index.html');
  assert.equal(result.layout, 'updates');
  assert.deepEqual(titles, ['独立页', '前', '后']);
});

test('分类和标签索引按卡片分页，不丢失分类，分页地址稳定', () => {
  const {generators} = fixture();
  const terms = Array.from({length: 19}, (_, i) => ({name: `分类${i}`, length: 2}));
  const query = {sort: () => ({toArray: () => terms})};
  const result = generators['category-index']({categories: query});
  assert.equal(result.length, 3);
  assert.equal(result[0].path, 'categories/index.html');
  assert.equal(result[1].path, 'categories/page/2/index.html');
  assert.equal(result[2].data.terms.length, 3);
  assert.deepEqual(Array.from(result.flatMap(item => item.data.terms)), terms);
  assert.equal(result[1].data.base, 'categories/');
});

test('没有文章的导航分类也遵守 category_map', () => {
  const {helpers} = fixture();
  const result = helpers.nav_sections.call({
    config: {category_dir: 'categories', category_map: {笔记: 'notes'}},
    theme: {nav_categories: [{label: '笔记', icon: 'edit_note'}]},
    site: {categories: {findOne: () => null}}
  });
  assert.equal(result.categories[0].path, 'categories/notes/');
});
