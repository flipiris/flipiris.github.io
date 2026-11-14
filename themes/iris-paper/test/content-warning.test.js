'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const {JSDOM} = require('jsdom');
const Hexo = require('hexo');
const {splitWarning, hasWarning} = require('../scripts/lib/content-warning');

test('成人内容标签精确匹配，兼容文章标签关系和独立页标签数组', () => {
  assert.equal(hasWarning({tags: {toArray: () => [{name: '成人内容'}]}}), true);
  assert.equal(hasWarning({tags: ['作品', '成人内容']}), true);
  assert.equal(hasWarning({tags: '成人内容'}), true);
  assert.equal(hasWarning({tags: ['非成人内容']}), false);
  assert.equal(hasWarning({tags: [{name: '成人内容研究'}]}), false);
  assert.equal(hasWarning(), false);
});

test('警告块保留原始 HTML、嵌套与实体，多个块顺序合并并从正文移除', () => {
  const source = '<p>前</p><div class="a content-warning"><p>含<strong>暴力</strong> &amp; 描写</p><div>请留意</div></div><p>后</p><div class="content-warning"><p>第二段</p></div>';
  assert.deepEqual(splitWarning(source), {
    body: '<p>前</p><p>后</p>',
    message: '<p>含<strong>暴力</strong> &amp; 描写</p><div>请留意</div>\n<p>第二段</p>'
  });
  assert.equal(splitWarning('<div class="content-warning"><div class="content-warning">内</div>外</div>').message, '<div class="content-warning">内</div>外');
  assert.deepEqual(splitWarning('<p>正文</p><div class="content-warning">\n<p> </p></div>'), {body: '<p>正文</p>', message: ''});
  const similar = '<div class="content-warnings">正文</div><pre>&lt;div class="content-warning"&gt;示例&lt;/div&gt;</pre>';
  assert.deepEqual(splitWarning(similar), {body: similar, message: ''});
  assert.deepEqual(splitWarning(), {body: '', message: ''});
});

function browserFixture({reduced = true} = {}) {
  const dom = new JSDOM('<!doctype html><html class="js" style="--motion-base:250ms;--motion-reveal:500ms;--ease-out:cubic-bezier(0.25, 1, 0.35, 1)"><body><nav><a href="/">首页</a></nav><article class="content-page is-content-locked"><section class="content-warning"><a class="content-warning-continue" href="#content-warning-body">继续阅读</a></section><div class="content-warning-body" tabindex="-1"><h2 id="正文">正文</h2><a href="/next/">链接</a></div></article></body></html>', {url: 'https://example.org/story/#%E6%AD%A3%E6%96%87', runScripts: 'outside-only'});
  const {window} = dom;
  const media = Object.assign(new window.EventTarget(), {matches: reduced});
  window.matchMedia = () => media;
  const animations = [];
  window.Element.prototype.animate = function(keyframes, options) {
    let resolve, reject;
    const finished = new Promise((done, fail) => { resolve = done; reject = fail; });
    const animation = {element: this, keyframes, options, finished, complete: resolve, cancelled: false, cancel() {
      this.cancelled = true;
      reject(new Error('cancelled'));
    }};
    animations.push(animation);
    return animation;
  };
  let scrolled = 0;
  window.document.getElementById('正文').scrollIntoView = () => scrolled++;
  window.eval(readFileSync(path.join(__dirname, '../source/js/content-warning.js'), 'utf8'));
  return {window, document: window.document, media, animations, scrolled: () => scrolled};
}

test('只有继续阅读解除遮罩与 inert，焦点进入正文，恢复锚点且通知阅读脚本', () => {
  const f = browserFixture();
  const page = f.document.querySelector('article');
  const warning = f.document.querySelector('.content-warning');
  const body = f.document.querySelector('.content-warning-body');
  let continued = 0;
  f.document.addEventListener('content:continue', () => continued++);
  warning.click();
  f.document.dispatchEvent(new f.window.KeyboardEvent('keydown', {key: 'Escape'}));
  assert.equal(page.classList.contains('is-content-locked'), true);
  assert.equal(body.hasAttribute('inert'), true);
  assert.equal(f.document.querySelector('nav').hasAttribute('inert'), false);
  warning.querySelector('a').click();
  assert.equal(page.classList.contains('is-content-locked'), false);
  assert.equal(warning.hidden, true);
  assert.equal(body.hasAttribute('inert'), false);
  assert.equal(body.hasAttribute('aria-hidden'), false);
  assert.equal(f.document.activeElement, body);
  assert.equal(continued, 1);
  assert.equal(f.scrolled(), 1);
  assert.equal(f.window.location.hash, '#%E6%AD%A3%E6%96%87');
  assert.equal(f.animations.length, 0);
  assert.equal(f.window.localStorage.length, 0);
  assert.equal(f.window.sessionStorage.length, 0);
  f.window.close();
});

test('离开页面和浏览器历史缓存恢复时重新锁定，新访问不继承确认', () => {
  const f = browserFixture();
  const page = f.document.querySelector('article');
  const link = page.querySelector('.content-warning-continue');
  link.click();
  f.window.dispatchEvent(new f.window.PageTransitionEvent('pagehide'));
  assert.equal(page.classList.contains('is-content-locked'), true);
  assert.equal(page.querySelector('.content-warning').hidden, false);
  assert.equal(page.querySelector('.content-warning-body').getAttribute('aria-hidden'), 'true');
  link.click();
  f.window.dispatchEvent(new f.window.PageTransitionEvent('pageshow', {persisted: true}));
  assert.equal(page.classList.contains('is-content-locked'), true);
  const next = browserFixture();
  assert.equal(next.document.querySelector('.content-warning-body').hasAttribute('inert'), true);
  f.window.close();
  next.window.close();
});

test('遮罩淡出与正文显现同步，结束后恢复交互和焦点，重复点击不重启动画', async () => {
  const f = browserFixture({reduced: false});
  const warning = f.document.querySelector('.content-warning');
  const body = f.document.querySelector('.content-warning-body');
  const link = warning.querySelector('a');
  let continued = 0;
  f.document.addEventListener('content:continue', () => continued++);
  link.click();
  link.click();
  assert.equal(f.animations.length, 2);
  assert.equal(f.animations[0].element, warning);
  assert.deepEqual(Array.from(f.animations[0].keyframes, frame => frame.opacity), [1, 0]);
  assert.equal(f.animations[0].options.duration, 250);
  assert.equal(f.animations[1].element, body);
  assert.equal(f.animations[1].keyframes[0].opacity, 0);
  assert.equal(f.animations[1].options.duration, 500);
  assert.equal(body.hasAttribute('inert'), true);
  assert.equal(warning.hidden, false);
  assert.equal(continued, 0);
  f.animations.forEach(animation => animation.complete());
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(warning.hidden, true);
  assert.equal(body.hasAttribute('inert'), false);
  assert.equal(f.document.activeElement, body);
  assert.equal(continued, 1);
  assert.ok(f.animations.every(animation => animation.cancelled));
  f.window.close();
});

test('退场中离开页面会取消动画并重锁；旧动画完成不会解除新警告', async () => {
  const f = browserFixture({reduced: false});
  const body = f.document.querySelector('.content-warning-body');
  const warning = f.document.querySelector('.content-warning');
  warning.querySelector('a').click();
  f.window.dispatchEvent(new f.window.PageTransitionEvent('pagehide'));
  f.animations.forEach(animation => animation.complete());
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(f.document.querySelector('.is-content-locked'));
  assert.equal(body.hasAttribute('inert'), true);
  assert.equal(warning.hidden, false);
  assert.ok(f.animations.every(animation => animation.cancelled));
  warning.querySelector('a').click();
  assert.equal(f.animations.length, 4);
  f.animations.slice(2).forEach(animation => animation.complete());
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(body.hasAttribute('inert'), false);
  f.window.close();
});

test('退场中开启减少动态效果立即完成，取消剩余动画', () => {
  const f = browserFixture({reduced: false});
  f.document.querySelector('.content-warning-continue').click();
  f.media.matches = true;
  f.media.dispatchEvent(new f.window.Event('change'));
  assert.equal(f.document.querySelector('.content-warning').hidden, true);
  assert.equal(f.document.querySelector('.content-warning-body').hasAttribute('inert'), false);
  assert.ok(f.animations.every(animation => animation.cancelled));
  f.window.close();
});

test('警告内容只水平居中、顶部排列，继续阅读复用正文链接样式', () => {
  const css = readFileSync(path.join(__dirname, '../source/css/content-warning.css'), 'utf8');
  const prose = readFileSync(path.join(__dirname, '../source/css/prose.css'), 'utf8');
  assert.match(css, /\.content-warning-card\s*\{[^}]*margin: 0 auto;[^}]*text-align: center;/);
  assert.match(prose, /\.article-content a,\s*\.content-warning a\s*\{[^}]*text-decoration: underline;/);
  const action = css.match(/\.content-warning-continue\s*\{([^}]*)\}/)[1];
  assert.doesNotMatch(action, /padding:|border:|background:|min-height:/);
});

test('无脚本模板不锁定正文交互，继续阅读锚点指向正文且提示可直接阅读', () => {
  const ejs = require('ejs');
  const render = (name, data) => ejs.render(readFileSync(path.join(__dirname, '../layout', name + '.ejs'), 'utf8'), data);
  const html = render('_partial/content-page', {
    page: {}, content_warning: () => ({enabled: true, message: ''}),
    contentClass: '', contentTitle: false, contentBody: '<p>正文 <a href="/next/">下一页</a></p>', contentFooter: false,
    partial: (name, data) => render(name, data)
  });
  const document = new JSDOM(html).window.document;
  const body = document.getElementById('content-warning-body');
  assert.equal(body.hasAttribute('inert'), false);
  assert.equal(body.hasAttribute('aria-hidden'), false);
  assert.equal(body.hidden, false);
  assert.equal(body.querySelector('a').getAttribute('href'), '/next/');
  assert.equal(document.querySelector('.content-warning-continue').getAttribute('href'), '#' + body.id);
  assert.match(document.querySelector('noscript').textContent, /未启用 JavaScript 也可阅读/);
});

test('真实构建：三种布局、独立页、默认/自定义警告、注释、大纲及索引统计', async () => {
  const root = path.resolve(__dirname, '../../..');
  const base = await fs.mkdtemp(path.join(os.tmpdir(), 'iris-warning-'));
  const write = async (name, content) => {
    const file = path.join(base, name);
    await fs.mkdir(path.dirname(file), {recursive: true});
    await fs.writeFile(file, content);
  };
  let hexo;
  try {
    await fs.mkdir(path.join(base, 'themes'));
    await fs.symlink(path.join(root, 'themes/iris-paper'), path.join(base, 'themes/iris-paper'));
    await fs.symlink(path.join(root, 'node_modules'), path.join(base, 'node_modules'));
    await fs.copyFile(path.join(root, 'package.json'), path.join(base, 'package.json'));
    await write('_config.yml', 'title: Test\nauthor: Writer\nurl: https://example.org/blog\nroot: /blog/\ntheme: iris-paper\npermalink: :title/\ndefault_layout: article\ndefault_category: ""\n');
    for (const layout of ['article', 'page', 'canvas']) {
      await write(`source/_posts/${layout}.md`, `---\ntitle: ${layout}\nlayout: ${layout}\ndate: 2020-01-01\ntags: [成人内容]\n---\n## 正文章节\n\n正文\n\n<div class="content-warning">\n\n含有**暴力描写**。\n\n</div>\n\n<div class="note">\n\n注释\n\n</div>`);
    }
    await write('source/_posts/default.md', '---\ntitle: default\nlayout: article\ndate: 2020-01-01\ntags: [成人内容]\n---\n正文');
    await write('source/_posts/normal.md', '---\ntitle: normal\nlayout: article\ndate: 2020-01-01\ntags: [普通]\n---\n正文');
    await write('source/adult/index.md', '---\ntitle: 独立页\nlayout: page\ntags: [成人内容]\n---\n正文');
    await write('source/_posts/document.html', '---\ntitle: document\nlayout: canvas\ndate: 2020-01-01\ntags: [成人内容]\n---\n<!doctype html><html><head><title>原作</title></head><body><div class="content-warning"><p>HTML 自定义说明</p></div><h2 id="story">作品章节</h2><p>作品正文</p></body></html>');
    hexo = new Hexo(base, {silent: true});
    await hexo.init();
    await hexo.call('generate');
    const document = async name => new JSDOM(await fs.readFile(path.join(base, 'public', name, 'index.html'), 'utf8')).window.document;
    for (const layout of ['article', 'page', 'canvas']) {
      const doc = await document(layout);
      assert.ok(doc.querySelector('.content-page.is-content-locked > .content-warning'));
      const warningBody = doc.querySelector('.content-warning-body');
      assert.ok(warningBody.querySelector('.article-content'));
      assert.equal(warningBody.hasAttribute('inert'), false);
      assert.equal(warningBody.hasAttribute('aria-hidden'), false);
      assert.equal(doc.querySelector('.content-warning-continue').hash, '#content-warning-body');
      assert.equal(doc.querySelector('.content-warning-message strong').textContent, '暴力描写');
      assert.equal(doc.querySelector('.article-content .content-warning'), null);
      assert.ok(doc.querySelector('script[src="/blog/js/content-warning.js"]'));
      assert.ok(doc.querySelector('link[href="/blog/css/content-warning.css"]'));
      if (layout !== 'page') {
        assert.equal(doc.querySelector('.info-note').textContent.trim(), '注释');
        assert.equal(doc.querySelectorAll('.toc-link').length, 1);
        assert.equal(doc.querySelector('.post-stats .stat-number').textContent, '6');
      }
    }
    assert.ok((await document('adult')).querySelector('.content-page.is-content-locked'));
    const defaults = await document('default');
    assert.match(defaults.querySelector('.content-warning-message').textContent, /18 周岁/);
    assert.equal(defaults.querySelector('.content-warning-continue').textContent, '继续阅读');
    assert.equal(defaults.querySelector('.content-warning-continue').tagName, 'A');
    assert.equal(defaults.querySelector('.content-warning-label'), null);
    assert.equal(defaults.querySelector('.content-warning button'), null);
    assert.equal((await document('')).querySelector('.content-warning'), null);
    assert.equal((await document('tags/成人内容')).querySelector('.content-warning'), null);
    assert.match(defaults.querySelector('.content-warning noscript').textContent, /未启用 JavaScript 也可阅读/);
    const normal = await document('normal');
    assert.equal(normal.querySelector('.content-warning'), null);
    assert.equal(normal.querySelector('.content-warning-body'), null);
    assert.equal(normal.querySelector('script[src$="/js/content-warning.js"]'), null);
    const canvas = await document('document');
    assert.equal(canvas.body.dataset.canvas, 'document');
    assert.match(canvas.querySelector('.content-warning-message').textContent, /HTML 自定义说明/);
    const inner = new JSDOM(canvas.querySelector('iframe').srcdoc).window.document;
    assert.equal(inner.querySelector('.content-warning'), null);
    assert.equal(inner.querySelector('h2').textContent, '作品章节');
    assert.ok(inner.querySelector('script[src="/blog/js/canvas-bridge.js"]'));
    const search = JSON.parse(await fs.readFile(path.join(base, 'public/search.json'), 'utf8'));
    assert.equal(search.find(item => item.title === 'article').text.includes('暴力描写'), false);
    assert.equal(search.find(item => item.title === 'document').text, '作品章节 作品正文');
  } finally {
    if (hexo) await hexo.exit();
    await fs.rm(base, {recursive: true, force: true});
  }
});
