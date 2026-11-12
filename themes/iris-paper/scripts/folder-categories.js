'use strict';

const {posix} = require('node:path');

function folderCategories(source, sections) {
  const path = String(source || '').replace(/\\/g, '/');
  if (!path.startsWith('_posts/')) return [];
  const directory = posix.dirname(path.slice('_posts/'.length));
  const labels = new Map(sections.map(item => [item.folder, item.label]));
  return directory === '.' ? [] : directory.split('/').map(name => labels.get(name) || name);
}

hexo.extend.filter.register('before_generate', async function() {
  const sections = hexo.theme.config.sections || [];
  hexo.config.category_map = Object.fromEntries(sections.map(item => [item.label, item.folder]));
  for (const post of hexo.model('Post').toArray()) {
    await post.setCategories(folderCategories(post.source, sections));
  }
});

module.exports = {folderCategories};
