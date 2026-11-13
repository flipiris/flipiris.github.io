'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const ejs = require('ejs');
const {JSDOM} = require('jsdom');

const template = readFileSync(join(__dirname, '../layout/_partial/page-title.ejs'), 'utf8');

test('标题输出为单一文本节点，保留原始标题并转义', () => {
  const title = '耳光响亮，和解草草：《章鱼噼的原罪》的叙事塌陷';
  const doc = new JSDOM(ejs.render(template, {title})).window.document;
  const h1 = doc.querySelector('.page-title');
  assert.equal(h1.tagName, 'H1');
  assert.equal(h1.textContent, title);
  assert.equal(h1.children.length, 0);
  const escaped = new JSDOM(ejs.render(template, {title: '<你好> 🏳️‍⚧️'})).window.document;
  assert.equal(escaped.querySelector('h1').textContent, '<你好> 🏳️‍⚧️');
  assert.equal(escaped.querySelector('你好'), null);
});

test('首页、归档、分类、标签、其他页面与最近更新复用 page 模板', () => {
  for (const name of ['index', 'archive', 'categories', 'tags', 'misc', 'updates']) {
    const source = readFileSync(join(__dirname, `../layout/${name}.ejs`), 'utf8');
    assert.match(source, /partial\('page',/);
    assert.doesNotMatch(source, /archive-page/);
  }
  const css = readFileSync(join(__dirname, '../source/css/pages.css'), 'utf8');
  assert.match(css, /\.page-header \.page-title::after\s*\{[^}]*display: inline-block;[^}]*vertical-align: bottom;/);
});

test('文学段落外边距保留作者原来的 0.75em，所有 main 使用 1000px 上限，page 宽度为 800px', () => {
  const presets = readFileSync(join(__dirname, '../source/css/presets.css'), 'utf8');
  const base = readFileSync(join(__dirname, '../source/css/base.css'), 'utf8');
  const layout = readFileSync(join(__dirname, '../source/css/layout.css'), 'utf8');
  assert.match(presets, /\[data-typography="literary"\] \.article-content p\s*\{\s*margin: 0\.75em;/);
  assert.match(base, /--content-width: 1000px;/);
  assert.match(base, /--page-width: 800px;/);
  assert.match(layout, /#main-content\s*\{[^}]*max-width: 1000px;/);
});

test('首页专用样式集中在 home.css，只在首页加载，图片宽屏靠右浮动', () => {
  const root = join(__dirname, '..');
  const layout = readFileSync(join(root, 'layout/layout.ejs'), 'utf8');
  assert.match(layout, /if \(home\) \{[\s\S]*?\/attachments\/home\/home\.css/);
  const home = readFileSync(join(root, '../../source/attachments/home/home.css'), 'utf8');
  assert.match(home, /\.home-intro > figure:first-of-type\s*\{[\s\S]*?float: right;/);
  for (const name of ['pages.css', 'layout.css', 'compact.css']) {
    const css = readFileSync(join(root, 'source/css', name), 'utf8');
    assert.doesNotMatch(css, /\.home-overview|\.home-intro|\.home-image|site-identity-hero|body\.is-home/);
  }
});

test('画布不给侧栏触发器加 backdrop-filter，避免固定抽屉被 40px 父级裁切', () => {
  const layout = readFileSync(join(__dirname, '../source/css/layout.css'), 'utf8');
  assert.doesNotMatch(layout, /:is\(\.top-nav, \.site-menu,/);
  assert.match(layout, /:is\(\.top-nav, \.site-menu-body, \.post-info-body\)/);
});

test('完整 HTML 画布宽屏保留紧凑页脚，窄屏隐藏；不影响其他布局', () => {
  const css = readFileSync(join(__dirname, '../source/css/layout.css'), 'utf8');
  assert.match(css, /body\[data-layout="canvas"\]\[data-canvas="document"\] \.site-footer\s*\{[^}]*padding-block: 4px;/);
  assert.match(css, /@media \(max-width: 860px\)\s*\{\s*body\[data-layout="canvas"\]\[data-canvas="document"\] \.site-footer\s*\{\s*display: none;/);
});

test('外观实验室保留原生 select，统一箭头并为边框与文字预留间距', () => {
  const css = readFileSync(join(__dirname, '../../../source/attachments/appearance-lab/style.css'), 'utf8');
  assert.match(css, /\.appearance-controls select\s*\{[^}]*-webkit-appearance: none;[^}]*appearance: none;[^}]*padding: 8px 36px 8px 10px;/);
  assert.match(css, /\.appearance-controls label::after\s*\{[^}]*right: 14px;[^}]*pointer-events: none;/);
  const source = readFileSync(join(__dirname, '../../../source/_posts/dev/外观实验室.md'), 'utf8');
  assert.equal((source.match(/<select\b/g) || []).length, 4);
});

test('新增社交图标通过单色遮罩继承链接颜色，悬停和键盘焦点与原有图标一致', () => {
  const css = readFileSync(join(__dirname, '../source/css/navigation.css'), 'utf8');
  assert.match(css, /\.social-links \.social-icon\s*\{[^}]*background-color: currentColor;[^}]*-webkit-mask: var\(--social-icon\)[^}]*mask: var\(--social-icon\)/);
  assert.match(css, /\.social-icon-wikidot\s*\{[^}]*mask-mode: luminance;/);
  assert.match(css, /\.social-links a:focus-visible\s*\{[^}]*color: rgb\(var\(--accent\)\);/);
  assert.doesNotMatch(css, /filter: grayscale/);
});

test('信息窗与进度条显式共用圆角，进度填充只由面板外轮廓裁切', () => {
  const css = readFileSync(join(__dirname, '../source/css/info.css'), 'utf8');
  for (const selector of ['.post-info', '.post-info-body', '.read-progress-rail']) {
    const escaped = selector.replace(/\./g, '\\.');
    assert.match(css, new RegExp(`${escaped} \\{[^}]*border-radius: var\\(--nav-radius\\);`));
  }
  assert.match(css, /\.read-progress-rail > span\s*\{[^}]*border-radius: 0;/);
});
