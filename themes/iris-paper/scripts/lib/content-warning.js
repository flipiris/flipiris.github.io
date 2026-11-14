'use strict';

const {parseDocument, DomUtils} = require('htmlparser2');

function isWarning(node) {
  return node.type === 'tag' && node.name === 'div' && /(?:^|\s)content-warning(?:\s|$)/.test(node.attribs.class || '');
}

function splitWarning(content = '') {
  const source = String(content || '');
  if (!source.includes('content-warning')) return {body: source, message: ''};
  const document = parseDocument(source, {withStartIndices: true, withEndIndices: true});
  const blocks = DomUtils.findAll(isWarning, document.children).filter(node => {
    for (let parent = node.parent; parent; parent = parent.parent) if (isWarning(parent)) return false;
    return true;
  });
  const messages = [];
  let body = source;
  for (const node of blocks) {
    if (!DomUtils.textContent(node).trim() && !DomUtils.findOne(child => child.name === 'img', node.children)) continue;
    if (node.children.length) messages.push(source.slice(node.children[0].startIndex, node.children.at(-1).endIndex + 1).trim());
  }
  for (const node of blocks.slice().reverse()) body = body.slice(0, node.startIndex) + body.slice(node.endIndex + 1);
  return {body, message: messages.join('\n')};
}

function hasWarning(page = {}) {
  const tags = page.tags?.toArray ? page.tags.toArray() : [].concat(page.tags || []);
  return tags.some(tag => (typeof tag === 'string' ? tag : tag.name) === '成人内容');
}

module.exports = {isWarning, splitWarning, hasWarning};
