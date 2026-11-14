'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const ejs = require('ejs');
const {JSDOM} = require('jsdom');
const theme = readFileSync(join(__dirname, '../source/js/theme.js'), 'utf8');
const source = readFileSync(join(__dirname, '../source/js/site-tools.js'), 'utf8');

function fixture({stored, systemDark = false, blocked = false, fetch} = {}) {
  const partial = (name, data) => `<span class="icon">${data.name}</span>`;
  const tools = ejs.render(readFileSync(join(__dirname, '../layout/_partial/site-tools.ejs'), 'utf8'), {partial});
  const search = ejs.render(readFileSync(join(__dirname, '../layout/_partial/search.ejs'), 'utf8'), {partial, url_for: path => `/blog${path}`});
  const dom = new JSDOM(`<html ><head><meta name="color-scheme"></head><body>${tools}${search}</body></html>`, {url: 'https://example.org/blog/', runScripts: 'outside-only'});
  const {window} = dom;
  const system = new window.EventTarget();
  system.matches = systemDark;
  window.matchMedia = () => system;
  if (stored) window.localStorage.setItem('iris-mode', stored);
  if (blocked) Object.defineProperty(window, 'localStorage', {get() { throw new Error('blocked'); }});
  window.HTMLDialogElement.prototype.showModal = function() { this.open = true; };
  window.HTMLDialogElement.prototype.close = function() { this.open = false; this.dispatchEvent(new window.Event('close')); };
  window.fetch = fetch || (async () => ({ok: true, json: async () => []}));
  window.eval(theme);
  window.eval(source);
  const document = window.document;
  return {
    window, document, system, root: document.documentElement,
    mode: document.querySelector('#mode-toggle'),
    dialog: document.querySelector('dialog'),
    search: document.querySelector('#search-toggle'),
    status: document.querySelector('#search-status'),
    results: document.querySelector('#search-results'),
    async settle() { for (let i = 0; i < 8; i++) await Promise.resolve(); },
    input(value) {
      document.querySelector('input').value = value;
      document.querySelector('input').dispatchEvent(new window.Event('input'));
    },
    dispose: () => window.close()
  };
}

test('模式按系统→昼→夜循环，记忆选择并更新三种图标与 color-scheme', () => {
  const f = fixture({systemDark: true});
  assert.equal(f.root.dataset.modePreference, 'system');
  assert.equal(f.root.dataset.mode, 'dark');
  assert.equal(f.mode.querySelector('.icon').textContent, 'brightness_auto');
  f.mode.click();
  assert.equal(f.root.dataset.modePreference, 'light');
  assert.equal(f.root.dataset.mode, 'light');
  assert.equal(f.window.localStorage.getItem('iris-mode'), 'light');
  assert.equal(f.mode.querySelector('.icon').textContent, 'light_mode');
  assert.equal(f.mode.title, '显示模式：日间；切换至夜间');
  f.mode.click();
  assert.equal(f.root.dataset.mode, 'dark');
  assert.equal(f.mode.querySelector('.icon').textContent, 'dark_mode');
  assert.equal(f.document.querySelector('meta').content, 'dark');
  f.mode.click();
  assert.equal(f.root.dataset.modePreference, 'system');
  assert.equal(f.mode.querySelector('.icon').textContent, 'brightness_auto');
  assert.equal(f.document.body.dataset.palette, undefined);
  f.dispose();
  const stored = fixture({stored: 'light', systemDark: true});
  assert.equal(stored.root.dataset.mode, 'light');
  stored.dispose();
});

test('跟随系统响应实时变化，固定昼夜不受影响；跨标签和清除偏好可同步', () => {
  const f = fixture();
  f.system.matches = true;
  f.system.dispatchEvent(new f.window.Event('change'));
  assert.equal(f.root.dataset.mode, 'dark');
  f.mode.click();
  f.system.dispatchEvent(new f.window.Event('change'));
  assert.equal(f.root.dataset.mode, 'light');
  f.window.dispatchEvent(new f.window.StorageEvent('storage', {key: 'iris-mode', newValue: 'dark'}));
  assert.equal(f.root.dataset.modePreference, 'dark');
  assert.equal(f.mode.querySelector('.icon').textContent, 'dark_mode');
  f.window.dispatchEvent(new f.window.StorageEvent('storage', {key: null}));
  assert.equal(f.root.dataset.modePreference, 'system');
  assert.equal(f.root.dataset.mode, 'dark');
  f.dispose();
});

test('禁用存储仍可切换；实验室预览不改写模式偏好或页面配色', () => {
  const f = fixture({blocked: true});
  assert.equal(f.root.dataset.mode, 'light');
  f.mode.click();
  f.mode.click();
  assert.equal(f.root.dataset.mode, 'dark');
  f.document.body.dataset.palette = 'tech';
  f.document.dispatchEvent(new f.window.Event('appearance:layout'));
  assert.equal(f.root.dataset.mode, 'light');
  assert.equal(f.root.dataset.modePreference, 'dark');
  assert.equal(f.document.body.dataset.palette, 'tech');
  f.dispose();
});

test('搜索惰性加载一次，匹配标题/标签/完整正文，多词同时命中，结果安全输出', async () => {
  const data = [
    {title: '河岸', tags: ['诗歌'], text: '早晨经过河岸。', url: '/blog/river/'},
    {title: '读书', tags: ['笔记'], text: '一段只有正文出现的河岸', url: '/blog/book/'},
    {title: '<img src=x onerror=alert(1)>', tags: ['HTML'], text: '<script>文本</script>', url: '/blog/html/'}
  ];
  let calls = 0;
  const f = fixture({fetch: async url => {
    assert.equal(url, '/blog/search.json');
    calls++;
    return {ok: true, json: async () => data};
  }});
  assert.equal(calls, 0);
  f.search.click();
  assert.equal(f.dialog.open, true);
  assert.equal(f.search.getAttribute('aria-expanded'), 'true');
  assert.equal(f.document.activeElement.id, 'search-input');
  f.input('河岸');
  await f.settle();
  assert.equal(f.results.children.length, 2);
  assert.equal(f.results.querySelector('h3').textContent, '河岸');
  f.input('河岸 诗歌');
  assert.equal(f.results.children.length, 1);
  f.input('不存在');
  assert.match(f.status.textContent, /没有找到/);
  f.input('ｈｔｍｌ');
  assert.equal(f.results.children.length, 1);
  assert.equal(f.results.querySelector('img'), null);
  assert.equal(f.results.querySelector('h3').textContent, data[2].title);
  f.document.querySelector('input').dispatchEvent(new f.window.KeyboardEvent('keydown', {key: 'Escape', bubbles: true, cancelable: true}));
  assert.equal(f.dialog.open, false);
  assert.equal(f.search.getAttribute('aria-expanded'), 'false');
  assert.equal(f.document.activeElement, f.search);
  assert.equal(f.document.body.classList.contains('search-open'), false);
  f.search.click();
  assert.equal(calls, 1);
  f.dispose();
});

test('加载失败可重试，搜索用最新输入；快捷键可打开，关闭时恢复焦点', async () => {
  let calls = 0;
  const f = fixture({fetch: async () => ++calls === 1 ? {ok: false} : {ok: true, json: async () => [{title: '夜行', tags: [], text: '月光', url: '/blog/night/'}]}});
  f.document.dispatchEvent(new f.window.KeyboardEvent('keydown', {ctrlKey: true, key: 'k', cancelable: true}));
  await f.settle();
  assert.equal(f.dialog.open, true);
  assert.equal(f.search.getAttribute('aria-expanded'), 'true');
  assert.match(f.status.textContent, /加载失败/);
  assert.equal(f.document.querySelector('#search-retry').hidden, false);
  f.input('月光');
  f.document.querySelector('#search-retry').click();
  await f.settle();
  assert.equal(f.results.children.length, 1);
  assert.equal(f.document.querySelector('#search-retry').hidden, true);
  assert.equal(calls, 2);
  f.dialog.close();
  assert.equal(f.document.activeElement, f.search);
  f.dispose();
});
