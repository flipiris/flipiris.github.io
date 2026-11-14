'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const {JSDOM} = require('jsdom');
const source = readFileSync(join(__dirname, '../source/js/reading.js'), 'utf8');

let scrollHeight = 4000;

function fixture({reduced = false, withNote = true, height = 4000, locked = false} = {}) {
  scrollHeight = height;
  const dom = new JSDOM(`<!doctype html><html><body>
    <div class="read-progress read-progress-header"><span></span></div>
    <details class="post-info" open>
      <div class="read-progress read-progress-rail"><span></span></div>
      ${withNote ? `<div class="info-tabs">
        <button role="tab" aria-selected="true">信息</button>
        <button role="tab" aria-selected="false" tabindex="-1">注释</button></div>` : ''}
      <div class="info-pages" data-page="1">
        <section class="info-page" id="info-page-1"></section>${withNote ? '<section id="info-page-2" class="info-page info-note">注</section>' : ''}
      </div>
    </details>
    <article class="content-page${locked ? ' is-content-locked' : ''}"><div class="article-content"><p id="a">一</p><p id="b">二</p><p id="c">三</p></div></article>
  </body></html>`, {runScripts: 'outside-only', pretendToBeVisual: true});
  const {window} = dom;
  window.matchMedia = query => Object.assign(new window.EventTarget(), {matches: query.includes('reduced-motion') ? reduced : false});
  const observers = [];
  window.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; this.targets = new Set(); observers.push(this); }
    observe(el) { this.targets.add(el); }
    unobserve(el) { this.targets.delete(el); }
    disconnect() { this.targets.clear(); }
  };
  // 第一段在首屏内，其余在首屏下方。
  window.innerHeight = 800;
  Object.defineProperty(window.document.documentElement, 'scrollHeight', {configurable: true, get: () => scrollHeight});
  const tops = {a: 100, b: 1200, c: 2000};
  for (const [id, top] of Object.entries(tops)) {
    window.document.getElementById(id).getBoundingClientRect = () => ({top, bottom: top + 20});
  }
  window.eval(source);
  return {window, document: window.document, observers};
}

test('逐段浮现：首屏段落直接可见，其余等进入视口后才显现', () => {
  const f = fixture();
  const [a, b, c] = ['a', 'b', 'c'].map(id => f.document.getElementById(id));
  assert.ok(a.classList.contains('is-visible'));
  assert.ok(!b.classList.contains('is-visible'));
  assert.equal(f.observers[0].targets.size, 2);
  f.observers[0].callback([
    {isIntersecting: true, target: c, boundingClientRect: {top: 700}},
    {isIntersecting: true, target: b, boundingClientRect: {top: 600}}
  ]);
  assert.ok(b.classList.contains('is-visible') && c.classList.contains('is-visible'));
  // 同一批按页面顺序错开，且显现后不再观察。
  assert.equal(b.style.getPropertyValue('--reveal-delay'), '0ms');
  assert.equal(c.style.getPropertyValue('--reveal-delay'), '50ms');
  assert.equal(f.observers[0].targets.size, 0);
  f.window.close();
});

test('减少动态效果时不挂起任何段落，也不隐藏正文', () => {
  const f = fixture({reduced: true});
  assert.equal(f.observers.length, 0);
  assert.equal(f.document.querySelectorAll('.reveal').length, 0);
  f.window.close();
});

test('内容警告确认后才启动逐段浮现，再次确认不重复创建观察器', () => {
  const f = fixture({locked: true});
  assert.equal(f.observers.length, 0);
  assert.equal(f.document.querySelectorAll('.reveal').length, 0);
  f.document.querySelector('.content-page').classList.remove('is-content-locked');
  f.document.dispatchEvent(new f.window.Event('content:continue'));
  assert.equal(f.observers.length, 1);
  assert.equal(f.observers[0].targets.size, 2);
  f.document.dispatchEvent(new f.window.Event('content:continue'));
  assert.equal(f.observers.length, 1);
  f.window.close();
});

test('信息窗页签切换第二页，方向键移动焦点，选中状态同步', () => {
  const f = fixture();
  const info = f.document.querySelector('.info-pages');
  const [first, second] = f.document.querySelectorAll('[role="tab"]');
  second.click();
  assert.equal(info.dataset.page, '2');
  assert.equal(second.getAttribute('aria-selected'), 'true');
  assert.equal(first.getAttribute('aria-selected'), 'false');
  assert.equal(first.tabIndex, -1);
  assert.equal(f.document.querySelector('#info-page-1').hidden, true);
  assert.equal(f.document.querySelector('#info-page-2').hidden, false);
  second.dispatchEvent(new f.window.KeyboardEvent('keydown', {key: 'ArrowLeft', bubbles: true}));
  assert.equal(info.dataset.page, '1');
  assert.equal(f.document.activeElement, first);
  f.window.close();
});

test('没有注释块时不会出现页签，脚本也不报错', () => {
  const f = fixture({withNote: false});
  assert.equal(f.document.querySelectorAll('[role="tab"]').length, 0);
  assert.equal(f.document.querySelector('.info-pages').dataset.page, '1');
  f.window.close();
});

test('阅读进度同时写入顶栏和信息窗两条进度条', () => {
  const f = fixture();
  const bars = f.document.querySelectorAll('.read-progress');
  const values = Array.from(bars, bar => bar.style.getPropertyValue('--progress'));
  assert.equal(values.length, 2);
  assert.ok(values.every(value => value !== '' && value === values[0]));
  f.window.close();
});

test('进度按真实可滚动距离计算：中途为比例，滚到底（含吸附范围）恒为 1', () => {
  const f = fixture({height: 4000});
  const bar = f.document.querySelector('.read-progress');
  const frame = () => new Promise(resolve => f.window.requestAnimationFrame(() => setTimeout(resolve, 0)));
  const scrollTo = async y => {
    Object.defineProperty(f.window, 'scrollY', {configurable: true, value: y});
    f.window.dispatchEvent(new f.window.Event('scroll'));
    await frame();
  };
  return (async () => {
    await scrollTo(1600);                       // 可滚动距离 3200，一半
    assert.equal(bar.style.getPropertyValue('--progress'), '0.5000');
    assert.ok(!bar.classList.contains('is-complete'));
    await scrollTo(3200 - 20);                  // 离底 20px，吸附为 1
    assert.equal(bar.style.getPropertyValue('--progress'), '1.0000');
    assert.ok(bar.classList.contains('is-complete'));
    await scrollTo(0);
    assert.ok(bar.classList.contains('is-idle'));
    f.window.close();
  })();
});

test('页面短到无法滚动时进度条保持隐藏，而不是显示满格', () => {
  const f = fixture({height: 810});
  const bar = f.document.querySelector('.read-progress');
  assert.ok(bar.classList.contains('is-idle'));
  assert.equal(bar.style.getPropertyValue('--progress'), '0.0000');
  f.window.close();
});
