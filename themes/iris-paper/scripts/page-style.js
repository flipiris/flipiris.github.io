'use strict';

const PALETTES = ['rose', 'tech', 'wanderers', 'sepia', 'ink'];
const TYPOGRAPHIES = ['standard', 'enhanced', 'literary', 'poem'];

const warned = new Set();
function pick(kind, value, allowed) {
  if (!value) return '';
  const name = String(value).trim().toLowerCase();
  if (allowed.includes(name)) return name;
  const key = `${kind}:${name}`;
  if (!warned.has(key) && hexo.log && hexo.log.warn) {
    warned.add(key);
    hexo.log.warn(`未知的 ${kind}「${name}」，可选：${allowed.join('、')}`);
  }
  return '';
}

hexo.extend.helper.register('page_style', function(page) {
  const data = page || {};
  return {
    palette: pick('palette', data.palette, PALETTES),
    typography: pick('typography', data.typography, TYPOGRAPHIES) || (!data.typography && data.categories && data.categories.toArray && data.categories.toArray().some(item => item.name === '笔记') ? 'enhanced' : '')
  };
});
