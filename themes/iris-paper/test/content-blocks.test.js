'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const {runInNewContext} = require('node:vm');
const {JSDOM} = require('jsdom');

function helpers() {
  const registered = {};
  const warnings = [];
  let regenerate;
  runInNewContext(readFileSync(join(__dirname, '../scripts/content-blocks.js'), 'utf8'), {
    require,
    module: {exports: {}},
    hexo: {
      log: {warn: message => warnings.push(message)},
      extend: {filter: {register(name, fn) { regenerate = fn; }}, helper: {register: (name, fn) => { registered[name] = fn; }}}
    }
  });
  return {registered, warnings, regenerate};
}

test('没有注释块时正文原样返回，信息窗不出现第二页', () => {
  const {split_note} = helpers().registered;
  const result = split_note('<p>正文 note</p>');
  assert.equal(result.body, '<p>正文 note</p>');
  assert.equal(result.note, '');
  assert.deepEqual({...split_note('')}, {body: '', note: ''});
  assert.deepEqual({...split_note(undefined)}, {body: '', note: ''});
});

test('注释块从正文移除，内容保留原有标记与实体', () => {
  const {split_note} = helpers().registered;
  const result = split_note('<p>前</p>\n<div class="note">\n<p>注 &amp; <b>x</b></p>\n</div>\n<p>后</p>');
  assert.equal(result.note, '<p>注 &amp; <b>x</b></p>');
  assert.equal(result.body, '<p>前</p>\n\n<p>后</p>');
});

test('嵌套的 div 不会提前结束注释块，多个注释块依次合并', () => {
  const {split_note} = helpers().registered;
  const result = split_note('<div class="note a"><div>内层</div><p>一</p></div><p>正</p><div class="note"><p>二</p></div>');
  assert.equal(result.body, '<p>正</p>');
  assert.equal(result.note, '<div>内层</div><p>一</p>\n<p>二</p>');
});

test('注释块内嵌套的 .note 只算一次；普通 div 与类名相近的元素不受影响', () => {
  const {split_note} = helpers().registered;
  const nested = split_note('<div class="note"><div class="note">里</div>外</div>');
  assert.equal(nested.note, '<div class="note">里</div>外');
  const similar = split_note('<div class="notes">a</div><div class="footnote">b</div><div>c</div>');
  assert.equal(similar.note, '');
  assert.equal(similar.body, '<div class="notes">a</div><div class="footnote">b</div><div>c</div>');
});

test('空注释块被移除但不产生第二页', () => {
  const {split_note} = helpers().registered;
  assert.deepEqual({...split_note('<div class="note"> </div>x')}, {body: 'x', note: ''});
});

test('配色与版式预设：合法值通过，未知值回退默认并只警告一次', () => {
  const {registered, warnings} = helpers();
  assert.deepEqual({...registered.page_style({palette: 'Tech', typography: 'poem'})}, {palette: 'tech', typography: 'poem'});
  assert.deepEqual({...registered.page_style({})}, {palette: '', typography: ''});
  assert.deepEqual({...registered.page_style(undefined)}, {palette: '', typography: ''});
  assert.equal(registered.page_style({palette: 'neon'}).palette, '');
  registered.page_style({palette: 'neon'});
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /neon/);
});

test('预设名称与 presets.css 一一对应', () => {
  const css = readFileSync(join(__dirname, '../source/css/presets.css'), 'utf8');
  const source = readFileSync(join(__dirname, '../scripts/content-blocks.js'), 'utf8');
  const palettes = source.match(/PALETTES = \[([^\]]*)\]/)[1].match(/'(\w+)'/g).map(item => item.slice(1, -1));
  const typographies = source.match(/TYPOGRAPHIES = \[([^\]]*)\]/)[1].match(/'(\w+)'/g).map(item => item.slice(1, -1));
  // rose 是 base.css 中的默认色卡，不需要覆盖；literary / poem 需要各自的规则。
  for (const name of palettes.filter(item => item !== 'rose')) assert.ok(css.includes(`data-palette="${name}"`), name);
  for (const name of typographies) assert.ok(css.includes(`data-typography="${name}"`), name);
});

test('笔记默认增强排版，显式 standard / poem 优先，配色与排版独立', () => {
  const {page_style} = helpers().registered;
  const categories = {toArray: () => [{name: '笔记'}]};
  assert.equal(page_style({categories}).typography, 'enhanced');
  assert.equal(page_style({categories, typography: 'standard'}).typography, 'standard');
  assert.equal(page_style({categories, typography: 'poem', palette: 'wanderers'}).palette, 'wanderers');
  assert.equal(page_style({categories: {toArray: () => [{name: '随笔'}]}}).typography, '');
});

test('完整 HTML 画布保留正文，注入素材基址与隔离通信脚本；片段不进入 iframe', () => {
  const {canvas_document} = helpers().registered;
  assert.equal(canvas_document('<p>片段</p>'), '');
  const html = '<html><head><title>原作</title></head><body><h1 id="a">标题</h1>    <p>原文</p></body></html>';
  const document = canvas_document(html, '/works/test/?a=1&b=2', '/js/canvas-bridge.js');
  const parsed = new JSDOM(document).window.document;
  assert.equal(parsed.querySelector('base').getAttribute('href'), '/works/test/?a=1&b=2');
  assert.equal(parsed.querySelector('script').getAttribute('src'), '/js/canvas-bridge.js');
  assert.ok(document.includes('<h1 id="a">标题</h1>    <p>原文</p>'));
});


test('布局只使用 article/page/canvas，索引回到 page', () => {
  const {page_layout} = helpers().registered;
  for (const layout of ['article', 'canvas', 'page']) assert.equal(page_layout({layout}), layout);
  for (const layout of ['index', 'category', 'misc', 'updates']) assert.equal(page_layout({layout}), 'page');
});

test('增强排版仅改变粗体和斜体文字颜色，不绘制背景高亮', () => {
  const css = readFileSync(join(__dirname, '../source/css/presets.css'), 'utf8');
  for (const name of ['strong', 'em']) {
    const rule = css.match(new RegExp('\\[data-typography="enhanced"\\] \\.article-content ' + name + '\\s*\\{([^}]*)\\}'))[1];
    assert.match(rule, /color:/);
    assert.doesNotMatch(rule, /background|box-decoration/);
  }
});

test('同一轮渲染复用注释解析，下次生成清空缓存', () => {
  const {registered, regenerate} = helpers();
  const source = '<p>正文</p><div class="note">注释</div>';
  const first = registered.split_note(source);
  assert.equal(registered.split_note(source), first);
  regenerate();
  const next = registered.split_note(source);
  assert.notEqual(next, first);
  assert.deepEqual({...next}, {...first});
});
