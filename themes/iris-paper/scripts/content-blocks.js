'use strict';

const {parseDocument, DomUtils} = require('htmlparser2');

// 页面元数据可调用的预设；名称对应 source/css/presets.css。
const PALETTES = ['rose', 'tech', 'wanderers', 'sepia', 'ink'];
const TYPOGRAPHIES = ['standard', 'enhanced', 'literary', 'poem'];

const NOTE_CLASS = /(?:^|\s)note(?:\s|$)/;

function isNote(node) {
  return node.type === 'tag' && node.name === 'div' && NOTE_CLASS.test(node.attribs.class || '');
}

// 把正文里的 <div class="note"> 取出，放进信息窗第二页。
// 返回 {body, note}：body 不含注释块，note 是块内部的 HTML（没有注释块时为空串）。
// 用原文的下标截取，保留作者写下的实体与标记，不经过二次序列化。
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

hexo.extend.helper.register('split_note', splitNote);

// 校验 front-matter 中的 palette / typography；未知名称退回默认并给出一次提示。
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
    palette: pick('palette', String(data.palette || '').trim().toLowerCase().replace(/^wanderer$/, 'wanderers'), PALETTES),
    typography: pick('typography', data.typography, TYPOGRAPHIES) || (!data.typography && data.categories && data.categories.toArray && data.categories.toArray().some(item => ['笔记', '随笔'].includes(item.name)) ? 'enhanced' : '')
  };
});

module.exports = {splitNote};


function pageLayout(page) {
  if (['canvas', 'work'].includes(page.layout) || page.presentation === 'canvas') return 'canvas';
  return ['article', 'post'].includes(page.layout) ? 'article' : 'page';
}
hexo.extend.helper.register('page_layout', pageLayout);
hexo.extend.helper.register('page_presentation', function(page) {
  return pageLayout(page) === 'canvas' ? 'canvas' : 'paper';
});

hexo.extend.helper.register('canvas_document', function(content, base, bridge) {
  const html = String(content || '');
  if (!/<html[\s>]/i.test(html)) return '';
  // srcdoc 内相对链接默认跟随外层页面；可显式给出作品素材目录。
  const escaped = String(base || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const prepared = escaped ? html.replace(/<head([^>]*)>/i, '<head$1><base href="' + escaped + '">') : html;
  const script = '<script src="' + String(bridge || '/js/canvas-bridge.js').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;') + '"></script>';
  return prepared.replace(/<\/body>/i, script + '</body>');
});
