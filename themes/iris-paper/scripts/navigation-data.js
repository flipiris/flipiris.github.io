'use strict';

const {slugize} = require('hexo-util');
const {recentlyUpdated, publishedDocuments} = require('./lib/documents');
function postCollection(posts = []) {
  return {length: posts.length, each: callback => posts.forEach(callback), toArray: () => posts};
}

function isMisc(page, labels) {
  const categories = page.categories && page.categories.toArray ? page.categories.toArray() : [];
  return !categories.some(category => labels.includes(category.name));
}

function miscPages(site, theme) {
  const labels = ((theme && theme.sections) || []).map(item => item.label);
  return publishedDocuments(site)
    .filter(page => isMisc(page, labels))
    .sort((a, b) => (b.date ? b.date.valueOf() : 0) - (a.date ? a.date.valueOf() : 0)
      || a.path.localeCompare(b.path));
}
hexo.extend.helper.register('updated_pages', function() {
  return recentlyUpdated(this.site);
});

hexo.extend.generator.register('updates-index', function(locals) {
  const posts = recentlyUpdated(locals);
  return {
    path: 'updates/index.html',
    layout: 'updates',
    data: {title: '最近更新', layout: 'updates', posts: postCollection(posts), current: 1, total: 1}
  };
});

function categoryPath(config, name) {
  return `${config.category_dir}/${slugize((config.category_map || {})[name] || name, {transform: config.filename_case})}/`;
}
hexo.extend.helper.register('nav_sections', function() {
  const theme = this.theme || {};
  const categories = this.site.categories;
  const misc = theme.nav_misc;
  return {
    misc: misc ? {label: misc.label, icon: misc.icon, path: misc.path, count: miscPages(this.site, theme).length} : null,
    primary: (theme.nav_primary || []).map(item => ({label: item.label, path: item.path})),
    categories: (theme.sections || []).filter(item => item.nav !== false).map(item => {
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
  const config = hexo.config;
  const theme = hexo.theme.config || {};
  const pagination = config.pagination_dir || 'page';
  const layout = type === 'categories' ? 'categories' : 'tags';
  const directory = type === 'categories' ? config.category_dir : config.tag_dir;
  const terms = locals && locals[type] ? locals[type].sort('name').toArray().filter(term => term.length) : [];
  const size = Math.max(1, Number(theme.taxonomy_per_page) || 8);
  const total = Math.max(1, Math.ceil(terms.length / size));
  return Array.from({length: total}, (_, index) => ({
    path: `${directory}/${index ? `${pagination}/${index + 1}/` : ''}index.html`,
    layout,
    data: {
      title: type === 'categories' ? '分类索引' : '标签索引', layout,
      terms: terms.slice(index * size, (index + 1) * size),
      base: `${directory}/`, current: index + 1, total,
      current_url: `${directory}/${index ? `${pagination}/${index + 1}/` : ''}`
    }
  }));
}
hexo.extend.generator.register('category-index', function(locals) {
  return taxonomyIndex(locals, 'categories');
});
hexo.extend.generator.register('misc-index', function(locals) {
  const theme = hexo.theme.config || {};
  const misc = theme.nav_misc;
  if (!misc) return;
  const posts = miscPages(locals, theme);
  return {
    path: `${misc.path.replace(/^\/|\/$/g, '')}/index.html`,
    layout: 'misc',
    data: {title: misc.label, layout: 'misc', posts: postCollection(posts), current: 1, total: 1}
  };
});

hexo.extend.generator.register('tag-index', function(locals) {
  return taxonomyIndex(locals, 'tags');
});
hexo.extend.generator.register('nav-category-pages', function(locals) {
  const config = hexo.config;
  const theme = hexo.theme.config || {};
  const wanted = theme.sections || [];
  const existing = locals.categories;
  const empty = postCollection();
  return wanted
    .filter(item => !(existing.findOne && existing.findOne({name: item.label})))
    .map(item => ({
      path: `${categoryPath(config, item.label)}index.html`,
      layout: ['category', 'archive'],
      data: {title: item.label, category: item.label, posts: empty, current: 1, total: 1}
    }));
});
