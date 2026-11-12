'use strict';

const {posix} = require('node:path');
const {parse} = require('hexo-front-matter');

function folderCategories(source, metadata, mapping) {
  const explicit = metadata.categories || metadata.category;
  const rename = value => Array.isArray(value) ? value.map(rename) : value === '随笔' ? '笔记' : value;
  if (explicit && (!Array.isArray(explicit) || explicit.length)) return [].concat(rename(explicit));
  const path = String(source || '').replace(/\\/g, '/');
  if (!path.startsWith('_posts/')) return [];
  const directories = posix.dirname(path.slice('_posts/'.length));
  return directories === '.' ? [] : directories.split('/').map(name => mapping[name] || name);
}

// 使用 Hexo 自己的分类关系 API；raw 区分作者显式元数据与目录默认值。
hexo.extend.filter.register('before_generate', async function() {
  const mapping = (hexo.theme.config && hexo.theme.config.folder_categories) || {};
  for (const post of hexo.model('Post').toArray()) {
    await post.setCategories(folderCategories(post.source, parse(post.raw || ''), mapping));
  }
});
module.exports = {folderCategories};
