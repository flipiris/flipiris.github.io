'use strict';

const {slugize} = require('hexo-util');

hexo.extend.helper.register('recent_pages', function() {
  return this.site.posts.toArray().filter(post => post.published !== false)
    .concat(this.site.pages.toArray())
    .sort((a, b) => (b.date ? b.date.valueOf() : 0) - (a.date ? a.date.valueOf() : 0)
      || a.path.localeCompare(b.path))
    .slice(0, 5)
    .map(page => ({label: page.title || page.path, path: page.path}));
});

function categoryPath(config, name) {
  return `${config.category_dir}/${slugize(name, {transform: config.filename_case})}/`;
}

// 侧栏的固定入口与带图标的分类，均来自主题 _config.yml。
// 分类还没有文章时仍指向它的（空）页面，见下方 nav-category-pages。
hexo.extend.helper.register('nav_sections', function() {
  const theme = this.theme || {};
  const categories = this.site.categories;
  return {
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

hexo.extend.generator.register('category-index', function() {
  return {
    path: `${hexo.config.category_dir}/index.html`,
    layout: 'categories',
    data: {title: '分类', layout: 'categories'}
  };
});

hexo.extend.generator.register('tag-index', function() {
  return {
    path: `${hexo.config.tag_dir}/index.html`,
    layout: 'tags',
    data: {title: '标签', layout: 'tags'}
  };
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
