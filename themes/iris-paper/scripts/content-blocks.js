'use strict';

const {parseDocument, DomUtils} = require('htmlparser2');
const {escapeHTML} = require('hexo-util');
const PALETTES = ['rose', 'tech', 'wanderers', 'sepia', 'ink'];
const TYPOGRAPHIES = ['standard', 'enhanced', 'literary', 'poem'];

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

function pageLayout(page) {
  return ['article', 'canvas'].includes(page.layout) ? page.layout : 'page';
}
hexo.extend.helper.register('page_layout', pageLayout);

hexo.extend.helper.register('canvas_document', function(content, base, bridge) {
  const html = String(content || '');
  if (!/<html[\s>]/i.test(html)) return '';
  const escaped = escapeHTML(String(base || ''));
  const prepared = escaped ? html.replace(/<head([^>]*)>/i, '<head$1><base href="' + escaped + '">') : html;
  const script = '<script src="' + escapeHTML(String(bridge || '/js/canvas-bridge.js')) + '"></script>';
  return prepared.replace(/<\/body>/i, script + '</body>');
});

module.exports = {splitNote};
