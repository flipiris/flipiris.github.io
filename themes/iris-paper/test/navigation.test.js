'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const {JSDOM} = require('jsdom');
const source = readFileSync(join(__dirname, '../source/js/navigation.js'), 'utf8');

function fixture({narrow = true, reduced = false, kind = 'post', canvas = false, canvasDocument = false} = {}) {
  const dom = new JSDOM(`<!doctype html><html style="--motion-base:240ms;--ease-out:linear"><body class="layout-${kind}" data-layout="${canvas ? 'canvas' : kind === 'page' ? 'page' : 'article'}"${canvasDocument ? ' data-canvas="document"' : ''}>
    <details id="site-menu" class="hover-panel"><summary>目录</summary><div class="panel-body">菜单</div></details>
    ${kind === 'page' ? '' : '<details class="post-info hover-panel" open><summary>信息</summary><div class="panel-body"><a href="#chapter">章节</a></div></details>'}
    <button class="menu-backdrop" hidden></button><main>正文</main>
  </body></html>`, {runScripts: 'outside-only'});
  const {window} = dom;
  const media = new Map();
  window.matchMedia = query => {
    if (!media.has(query)) {
      const item = new window.EventTarget();
      item.matches = query.includes('max-width') ? narrow : query.includes('reduced-motion') ? reduced : true;
      media.set(query, item);
    }
    return media.get(query);
  };
  // 控制动画完成时刻，验证 details 不会在退场完成前被隐藏。
  window.Element.prototype.animate = function(frames, options) {
    let resolve, reject;
    const animation = {
      frames, options,
      finished: new Promise((yes, no) => { resolve = yes; reject = no; }),
      finish() { resolve(); },
      cancel() { reject(new Error('cancelled')); }
    };
    (this.animations ||= []).push(animation);
    return animation;
  };
  const timers = new Map();
  let timerId = 0;
  window.setTimeout = callback => { timers.set(++timerId, callback); return timerId; };
  window.clearTimeout = id => timers.delete(id);
  window.eval(source);
  const document = window.document;
  const info = document.querySelector('.post-info');
  const menu = document.querySelector('#site-menu');
  return {
    window, document, info, menu,
    pointer(panel, type, pointerType = 'mouse') {
      const event = new window.Event(type);
      Object.defineProperty(event, 'pointerType', {value: pointerType});
      panel.dispatchEvent(event);
    },
    runTimers() { for (const callback of timers.values()) callback(); timers.clear(); },
    backdrop: document.querySelector('.menu-backdrop'),
    click: panel => panel.querySelector('summary').click(),
    animation: panel => panel.querySelector('.panel-body').animations.at(-1),
    async settle(panel) {
      this.animation(panel).finish();
      await Promise.resolve();
    },
    resize(matches) {
      const item = media.get('(max-width: 860px)');
      item.matches = matches;
      item.dispatchEvent(new window.Event('change'));
    },
    dispose: () => window.close()
  };
}

test('宽屏侧栏静态常驻，信息窗不因点击、Esc 或外部点击收起', () => {
  const f = fixture({narrow: false});
  assert.equal(f.menu.open, true);
  assert.equal(f.info.open, true);
  f.click(f.info);
  f.document.dispatchEvent(new f.window.KeyboardEvent('keydown', {key: 'Escape'}));
  f.document.querySelector('main').dispatchEvent(new f.window.MouseEvent('pointerdown', {bubbles: true}));
  assert.equal(f.info.open, true);
  assert.equal(f.backdrop.hidden, true);
  f.dispose();
});

test('两种窄屏抽屉反复开合，每次都创建新动画，退场后才关闭 details', async () => {
  const f = fixture();
  for (const panel of [f.info, f.menu]) {
    for (let cycle = 0; cycle < 3; cycle++) {
      f.click(panel);
      assert.equal(panel.dataset.state, 'opening');
      assert.equal(f.animation(panel).options.duration, 240);
      await f.settle(panel);
      f.click(panel);
      assert.equal(panel.dataset.state, 'closing');
      assert.equal(panel.open, true);
      await f.settle(panel);
      assert.equal(panel.open, false);
    }
    assert.equal(panel.querySelector('.panel-body').animations.length, 6);
  }
  f.dispose();
});

test('快速反向从当前画面继续，旧退场不会关闭重新打开的抽屉', async () => {
  const f = fixture();
  f.click(f.info);
  await f.settle(f.info);
  f.click(f.info);
  const closing = f.animation(f.info);
  f.info.querySelector('.panel-body').style.opacity = '0.5';
  f.click(f.info);
  assert.equal(f.animation(f.info).frames[0].opacity, '0.5');
  closing.finish();
  await f.settle(f.info);
  assert.equal(f.info.open, true);
  assert.equal(f.info.dataset.state, 'open');
  f.dispose();
});

test('侧栏遮罩随进退场显示、淡出；信息抽屉不会启用遮罩', async () => {
  const f = fixture();
  f.click(f.menu);
  assert.equal(f.backdrop.hidden, false);
  await f.settle(f.menu);
  f.click(f.menu);
  assert.equal(f.backdrop.hidden, false);
  f.backdrop.animations.at(-1).finish();
  await f.settle(f.menu);
  assert.equal(f.backdrop.hidden, true);
  f.click(f.info);
  assert.equal(f.backdrop.hidden, true);
  f.dispose();
});

test('退场中切回宽屏立即恢复信息窗，且清除遮罩', async () => {
  const f = fixture();
  f.click(f.info);
  await f.settle(f.info);
  f.click(f.info);
  const closing = f.animation(f.info);
  f.resize(false);
  closing.finish();
  await Promise.resolve();
  assert.equal(f.info.open, true);
  assert.equal(f.info.dataset.state, 'wide');
  assert.equal(f.menu.open, true);
  assert.equal(f.backdrop.hidden, true);
  f.dispose();
});

test('减少动态效果时直接开合，不等待动画', () => {
  const f = fixture({reduced: true});
  f.click(f.menu);
  assert.equal(f.menu.dataset.state, 'open');
  f.click(f.menu);
  assert.equal(f.menu.open, false);
  assert.equal(f.backdrop.hidden, true);
  assert.equal(f.menu.querySelector('.panel-body').animations, undefined);
  f.dispose();
});


test('page 不包含信息窗口，窄屏仍可开合站点目录', async () => {
  const f = fixture({narrow: true, kind: 'page'});
  assert.equal(f.info, null);
  f.click(f.menu);
  await f.settle(f.menu);
  assert.equal(f.menu.open, true);
  f.click(f.menu);
  await f.settle(f.menu);
  assert.equal(f.menu.open, false);
  f.dispose();
});

test('canvas 宽屏使用常驻侧栏，目录与信息同时可见', () => {
  const f = fixture({narrow: false, canvas: true});
  assert.equal(f.menu.open, true);
  assert.equal(f.info.open, true);
  assert.equal(f.menu.dataset.state, 'wide');
  assert.equal(f.info.dataset.state, 'wide');
  f.click(f.info);
  assert.equal(f.info.open, true);
  f.dispose();
});

test('完整 HTML 画布宽屏也使用顶栏抽屉，目录与信息互斥', async () => {
  const f = fixture({narrow: false, canvas: true, canvasDocument: true});
  assert.equal(f.menu.open, false);
  assert.equal(f.info.open, false);
  f.click(f.menu);
  await f.settle(f.menu);
  assert.equal(f.menu.open, true);
  f.click(f.info);
  assert.equal(f.menu.dataset.state, 'closing');
  await f.settle(f.menu);
  await f.settle(f.info);
  assert.equal(f.info.open, true);
  assert.equal(f.menu.open, false);
  f.dispose();
});

test('鼠标悬停展开、移出延迟收起；点击固定展开后不会误收起', async () => {
  const f = fixture({narrow: true});
  f.pointer(f.menu, 'pointerenter');
  await f.settle(f.menu);
  assert.equal(f.menu.open, true);
  f.pointer(f.menu, 'pointerleave');
  assert.equal(f.menu.dataset.state, 'open');
  f.runTimers();
  await f.settle(f.menu);
  assert.equal(f.menu.open, false);
  f.pointer(f.menu, 'pointerenter');
  await f.settle(f.menu);
  f.click(f.menu);
  f.pointer(f.menu, 'pointerleave');
  f.runTimers();
  assert.equal(f.menu.dataset.state, 'open');
  assert.equal(f.menu.querySelector('summary').getAttribute('aria-expanded'), 'true');
  f.dispose();
});

test('触屏不模拟悬停，Esc 关闭后焦点回到开关', async () => {
  const f = fixture();
  f.pointer(f.menu, 'pointerenter', 'touch');
  assert.equal(f.menu.open, false);
  f.click(f.menu);
  await f.settle(f.menu);
  f.document.dispatchEvent(new f.window.KeyboardEvent('keydown', {key: 'Escape'}));
  await f.settle(f.menu);
  assert.equal(f.menu.open, false);
  assert.equal(f.document.activeElement, f.menu.querySelector('summary'));
  f.dispose();
});
