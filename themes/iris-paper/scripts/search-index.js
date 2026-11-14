'use strict';

const {htmlText} = require('./lib/html-text');
const {url_for} = require('hexo-util');
const {publishedDocuments} = require('./lib/documents');
const {isWarning} = require('./lib/content-warning');

function searchText(content = '') {
  return htmlText(content, node =>
    ['head', 'script', 'style', 'template', 'noscript'].includes(node.name) || isWarning(node)
  ).replace(/\s+/g, ' ').trim();
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
