'use strict';

const {parseDocument, DomUtils} = require('htmlparser2');
const {url_for} = require('hexo-util');
const {publishedDocuments} = require('./lib/documents');

function searchText(content = '') {
  const document = parseDocument(content);
  const excluded = DomUtils.findAll(node => ['head', 'script', 'style', 'template', 'noscript'].includes(node.name), document.children);
  for (const node of excluded) DomUtils.removeElement(node);
  const blocks = DomUtils.findAll(node => /^(?:p|div|h[1-6]|li|br|tr|td|th|section|article|blockquote|pre)$/.test(node.name), document.children);
  for (const node of blocks) DomUtils.appendChild(node, {type: 'text', data: ' ', parent: null, prev: null, next: null});
  return DomUtils.textContent(document).replace(/\s+/g, ' ').trim();
}

hexo.extend.generator.register('search-index', function(locals) {
  const documents = publishedDocuments(locals).map(page => ({
    title: page.title || page.path,
    url: url_for.call(hexo, page.path),
    tags: page.tags && page.tags.toArray ? page.tags.toArray().map(tag => tag.name) : [],
    text: searchText(page.content)
  })).sort((a, b) => a.url.localeCompare(b.url));
  return {path: 'search.json', data: JSON.stringify(documents)};
});

module.exports = {searchText};
