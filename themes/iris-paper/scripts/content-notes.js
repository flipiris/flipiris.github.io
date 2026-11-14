'use strict';

const {parseDocument, DomUtils} = require('htmlparser2');
const NOTE_CLASS = /(?:^|\s)note(?:\s|$)/;

function isNote(node) {
  return node.type === 'tag' && node.name === 'div' && NOTE_CLASS.test(node.attribs.class || '');
}
function splitNote(content) {
  const source = String(content || '');
  if (!source.includes('note')) return {body: source, note: ''};
  const document = parseDocument(source, {withStartIndices: true, withEndIndices: true});
  const notes = DomUtils.findAll(isNote, document.children).filter(node => {
    for (let parent = node.parent; parent; parent = parent.parent) if (isNote(parent)) return false;
    return true;
  });
  if (!notes.length) return {body: source, note: ''};

  const parts = [];
  let body = source;
  for (const node of notes) {
    const children = node.children;
    if (children.length) {
      const inner = source.slice(children[0].startIndex, children[children.length - 1].endIndex + 1).trim();
      if (inner) parts.push(inner);
    }
  }
  for (const node of notes.slice().reverse()) {
    body = body.slice(0, node.startIndex) + body.slice(node.endIndex + 1);
  }
  return {body, note: parts.join('\n')};
}

const notes = new Map();
hexo.extend.filter.register('before_generate', () => notes.clear());
hexo.extend.helper.register('split_note', function(content = '') {
  if (!notes.has(content)) notes.set(content, splitNote(content));
  return notes.get(content);
});

module.exports = {splitNote};
