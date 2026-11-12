'use strict';

const {slugize} = require('hexo-util');
const {recentlyUpdated, publishedDocuments} = require('./lib/documents');

// 属于导航中某个分类的页面不进入「其他页面」。
function isMisc(page, labels) {
  const categories = page.categories && page.categories.toArray ? page.categories.toArray() : [];
  return !categories.some(category => labels.includes(category.name));
}

function miscPages(site, theme) {
  const labels = ((theme && theme.nav_categories) || []).map(item => item.label);
  return publishedDocuments(site)
    .filter(page => isMisc(page, labels))
    .sort((a, b) => (b.date ? b.date.valueOf() : 0) - (a.date ? a.date.valueOf() : 0)
      || a.path.localeCompare(b.path));
}

// 最近更新入口列出所有已发布内容，不截断为侧栏模块。
hexo.extend.helper.register('updated_pages', function() {
  return recentlyUpdated(this.site);
});

hexo.extend.generator.register('updates-index', function(locals) {
  const posts = recentlyUpdated(locals);
  return {
    path: 'updates/index.html',
    layout: 'updates',
    data: {title: '最近更新', layout: 'updates', posts: {length: posts.length, each: callback => posts.forEach(callback)}, current: 1, total: 1}
  };
});

function categoryPath(config, name) {
  return `${config.category_dir}/${slugize((config.category_map || {})[name] || name, {transform: config.filename_case})}/`;
}

// 侧栏的固定入口与带图标的分类，均来自主题 _config.yml。
// 分类还没有文章时仍指向它的（空）页面，见下方 nav-category-pages。
hexo.extend.helper.register('nav_sections', function() {
  const theme = this.theme || {};
  const categories = this.site.categories;
  const misc = theme.nav_misc;
  return {
    misc: misc ? {label: misc.label, icon: misc.icon, path: misc.path, count: miscPages(this.site, theme).length} : null,
    primary: (theme.nav_primary || []).map(item => ({label: item.label, path: item.path})),
    categories: (theme.nav_categories || []).map(item => {
      const found = categories.findOne ? categories.findOne({name: item.label}) : null;
      return {
        label: item.label,
        icon: item.icon,
        category: item.label,
        count: found ? found.length : 0,
        path: found ? found.path : categoryPath(this.config, item.label)
      };
    })
  };
});

function taxonomyIndex(locals, type) {
  const layout = type === 'categories' ? 'categories' : 'tags';
  const directory = type === 'categories' ? hexo.config.category_dir : hexo.config.tag_dir;
  const terms = locals && locals[type] ? locals[type].sort('name').toArray().filter(term => term.length) : [];
  const size = Math.max(1, Number(hexo.theme.config.taxonomy_per_page) || 8);
  const total = Math.max(1, Math.ceil(terms.length / size));
  return Array.from({length: total}, (_, index) => ({
    path: `${directory}/${index ? `${hexo.config.pagination_dir || 'page'}/${index + 1}/` : ''}index.html`,
    layout,
    data: {
      title: type === 'categories' ? '分类索引' : '标签索引', layout,
      terms: terms.slice(index * size, (index + 1) * size),
      base: `${directory}/`, current: index + 1, total,
      current_url: `${directory}/${index ? `${hexo.config.pagination_dir || 'page'}/${index + 1}/` : ''}`
    }
  }));
}
hexo.extend.generator.register('category-index', function(locals) {
  return taxonomyIndex(locals, 'categories');
});

// 「其他页面」：没有导航分类的文章与独立页面，按发布日期倒序，一页列完。
hexo.extend.generator.register('misc-index', function(locals) {
  const misc = hexo.theme.config && hexo.theme.config.nav_misc;
  if (!misc) return;
  const posts = miscPages({posts: {toArray: () => locals.posts.toArray()}, pages: {toArray: () => locals.pages.toArray()}}, hexo.theme.config);
  return {
    path: `${misc.path.replace(/^\/|\/$/g, '')}/index.html`,
    layout: 'misc',
    data: {title: misc.label, layout: 'misc', posts: {length: posts.length, each: callback => posts.forEach(callback), toArray: () => posts}, current: 1, total: 1}
  };
});

hexo.extend.generator.register('tag-index', function(locals) {
  return taxonomyIndex(locals, 'tags');
});

// 导航里声明的分类即使还没有文章，也要有可访问的页面。
hexo.extend.generator.register('nav-category-pages', function(locals) {
  const config = hexo.config;
  const wanted = (hexo.theme.config && hexo.theme.config.nav_categories) || [];
  const existing = locals.categories;
  const empty = {length: 0, each() {}, toArray: () => []};
  return wanted
    .filter(item => !(existing.findOne && existing.findOne({name: item.label})))
    .map(item => ({
      path: `${categoryPath(config, item.label)}index.html`,
      layout: ['category', 'archive'],
      data: {title: item.label, category: item.label, posts: empty, current: 1, total: 1}
    }));
});


hexo.extend.generator.register('legacy-category-urls', function(locals) {
  const {escapeHTML, url_for} = require('hexo-util');
  const routes = new Map();
  function add(name, target) {
    const path = `${hexo.config.category_dir}/${name}/index.html`;
    if (path === `${target}index.html`) return;
    const href = escapeHTML(url_for.call(hexo, target));
    routes.set(path, {path, data: `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${href}"><link rel="canonical" href="${href}"><title>分类已迁移</title><a href="${href}">前往分类</a></html>`});
  }
  for (const category of locals.categories.toArray()) {
    const names = [category.name];
    let parent = category.parent;
    while (parent) {
      const found = locals.categories.findOne({_id: parent});
      if (!found) break;
      names.unshift(found.name);
      parent = found.parent;
    }
    add(names.join('/'), category.path);
  }
  for (const item of hexo.theme.config.nav_categories || []) add(item.label, categoryPath(hexo.config, item.label));
  add('随笔', categoryPath(hexo.config, '笔记'));
  return [...routes.values()];
});
