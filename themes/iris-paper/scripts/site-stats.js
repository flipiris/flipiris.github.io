'use strict';

const {parseDocument, DomUtils} = require('htmlparser2');
const moment = require('moment-timezone');
const {publishedDocuments, standalonePages, updateTime} = require('./lib/documents');

// 中日韩文字逐字计数，其余语言按单词计数；不计代码、注释块、标签、样式和脚本。
function countWords(content) {
  const document = parseDocument(content);
  const excluded = DomUtils.findAll(node =>
    ['pre', 'code', 'script', 'style'].includes(node.name)
    || (node.name === 'figure' && /(?:^|\s)highlight(?:\s|$)/.test(node.attribs.class || ''))
    // 注释块不属于正文，与信息窗第二页的口径一致。
    || (node.name === 'div' && /(?:^|\s)note(?:\s|$)/.test(node.attribs.class || '')),
  document.children);
  for (const node of excluded) DomUtils.removeElement(node);
  // 块级元素之间添加分隔，内联强调不拆开单词；实体由 HTML 解析器解码。
  const blocks = DomUtils.findAll(node => /^(?:p|div|h[1-6]|li|br|tr|td|th|section|article|blockquote)$/.test(node.name), document.children);
  for (const node of blocks) DomUtils.appendChild(node, {type: 'text', data: ' ', parent: null, prev: null, next: null});
  const text = DomUtils.textContent(document);
  let characters = 0;
  const words = text.replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu, () => {
    characters++;
    return ' ';
  });
  return characters + (words.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || []).length;
}

hexo.extend.helper.register('page_stats', function(content) {
  const words = countWords(content || '');
  return {words, minutes: Math.max(1, Math.ceil(words / 300))};
});

hexo.extend.helper.register('site_stats', function() {
  const documents = publishedDocuments(this.site);
  let words = 0;
  let updated;
  let first;
  let longest;
  const categories = new Set();
  const tags = new Set();
  const counts = new Map();
  for (const document of documents) {
    const length = countWords(document.content || '');
    words += length;
    if (!longest || length > longest.words) longest = {title: document.title, path: document.path, words: length};
    const latest = updateTime(document);
    if (latest && (!updated || latest.valueOf() > updated.valueOf())) updated = latest;
    if (document.date && (!first || document.date.valueOf() < first.valueOf())) first = document.date;
    const names = document.categories && document.categories.toArray ? document.categories.toArray().map(item => item.name) : [];
    names.forEach(name => {
      categories.add(name);
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    if (document.tags && document.tags.toArray) document.tags.toArray().forEach(tag => tags.add(tag.name));
  }
  const configured = ((this.theme && this.theme.nav_categories) || []).map(item => item.label);
  const distribution = configured.map(label => ({label, count: counts.get(label) || 0}));
  distribution.push({label: '其他页面', count: documents.filter(document => {
    const names = document.categories && document.categories.toArray ? document.categories.toArray().map(item => item.name) : [];
    return !names.some(name => configured.includes(name));
  }).length});
  return {
    pages: documents.length, words, updated, first, longest, distribution,
    posts: this.site.posts.toArray().filter(page => page.published !== false).length,
    standalone: standalonePages(this.site).length,
    tags: tags.size, categories: categories.size,
    average: documents.length ? Math.round(words / documents.length) : 0,
    minutes: Math.ceil(words / 300)
  };
});

// 日期按网站时区归日；这是内容快照，不把一次最近更新推算成历史修订次数。
hexo.extend.helper.register('site_activity', function(now) {
  const timezone = (this.config && this.config.timezone) || 'Asia/Shanghai';
  const end = moment.tz(now || new Date(), timezone).startOf('day');
  const start = end.clone().subtract(364, 'days');
  const gridStart = start.clone().day(0);
  const gridEnd = end.clone().day(6);
  const counts = new Map();
  for (const document of publishedDocuments(this.site)) {
    const latest = updateTime(document);
    if (!latest) continue;
    const key = moment.tz(latest.valueOf(), timezone).format('YYYY-MM-DD');
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const cells = [];
  const months = [];
  let activeDays = 0;
  let updates = 0;
  for (const day = gridStart.clone(); day.isSameOrBefore(gridEnd); day.add(1, 'day')) {
    const date = day.format('YYYY-MM-DD');
    const inRange = day.isSameOrAfter(start) && day.isSameOrBefore(end);
    const count = inRange ? counts.get(date) || 0 : 0;
    if (count) { activeDays++; updates += count; }
    const column = Math.floor(cells.length / 7) + 1;
    if (day.date() === 1 && inRange) months.push({label: day.format('M月'), column});
    cells.push({date, count, inRange, level: Math.min(count, 4)});
  }
  if (!months.length || months[0].column > 2) months.unshift({label: start.format('M月'), column: 1});
  return {cells, months, weeks: cells.length / 7, activeDays, updates, start: start.format('YYYY.MM.DD'), end: end.format('YYYY.MM.DD')};
});
