'use strict';

const {parseDocument, DomUtils} = require('htmlparser2');

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
  // 使用当前构建可见的内容，默认构建不包含草稿及未来文章。
  const posts = this.site.posts.toArray().filter(post => post.published !== false);
  const pages = this.site.pages.toArray();
  const documents = posts.concat(pages);
  let words = 0;
  let updated;
  for (const document of documents) {
    words += countWords(document.content || '');
    const latest = document.updated || document.date;
    if (latest && (!updated || latest.valueOf() > updated.valueOf())) updated = latest;
  }
  return {pages: documents.length, words, updated};
});
