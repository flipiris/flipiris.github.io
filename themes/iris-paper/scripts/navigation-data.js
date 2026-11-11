'use strict';

hexo.extend.helper.register('recent_pages', function() {
  return this.site.posts.toArray().filter(post => post.published !== false)
    .concat(this.site.pages.toArray())
    .sort((a, b) => (b.date ? b.date.valueOf() : 0) - (a.date ? a.date.valueOf() : 0)
      || a.path.localeCompare(b.path))
    .slice(0, 5)
    .map(page => ({label: page.title || page.path, path: page.path}));
});

hexo.extend.generator.register('category-index', function() {
  return {
    path: `${hexo.config.category_dir}/index.html`,
    layout: 'categories',
    data: {title: '分类', layout: 'categories'}
  };
});
