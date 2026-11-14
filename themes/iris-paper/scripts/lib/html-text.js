'use strict';

const {parseDocument, DomUtils} = require('htmlparser2');
const BLOCK = /^(?:p|div|h[1-6]|li|br|tr|td|th|section|article|blockquote|pre)$/;

function htmlText(content = '', exclude = () => false) {
  const document = parseDocument(content);
  const excluded = DomUtils.findAll(exclude, document.children);
  for (const node of excluded) DomUtils.removeElement(node);
  const blocks = DomUtils.findAll(node => BLOCK.test(node.name), document.children);
  for (const node of blocks) DomUtils.appendChild(node, {type: 'text', data: ' ', parent: null, prev: null, next: null});
  return DomUtils.textContent(document);
}

module.exports = {htmlText};
