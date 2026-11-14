'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const {runInNewContext} = require('node:vm');
const {createRequire} = require('node:module');

function helpers() {
  const registered = {};
  runInNewContext(readFileSync(join(__dirname, '../scripts/site-stats.js'), 'utf8'), {
    require: createRequire(join(__dirname, '../scripts/site-stats.js')),
    hexo: {extend: {filter: {register() {}}, helper: {register(name, callback) {
      registered[name] = callback;
    }}}}
  });
  return registered;
}

function stats(posts = [], pages = []) {
  return helpers().site_stats.call({site: {
    posts: {toArray: () => posts},
    pages: {toArray: () => pages}
  }});
}

test('空站点为零，不产生虚假的更新时间', () => {
  const result = stats();
  assert.equal(result.pages, 0);
  assert.equal(result.words, 0);
  assert.equal(result.updated, undefined);
});

test('页面统计复用正文字数口径，以每分钟 300 字向上取整', () => {
  const pageStats = helpers().page_stats;
  assert.equal(pageStats('<p>中文 Hello</p><pre>不计代码</pre>').words, 3);
  assert.equal(pageStats('<p>' + '字'.repeat(300) + '</p>').minutes, 1);
  assert.equal(pageStats('<p>' + '字'.repeat(301) + '</p>').minutes, 2);
  assert.equal(pageStats('').words, 0);
  assert.equal(pageStats('').minutes, 1);
});

test('仅计算已发布文章与独立页面，跳过草稿', () => {
  const result = stats([
    {published: true, content: '<p>文章</p>'},
    {published: false, content: '<p>草稿不计入</p>'}
  ], [{content: '<p>About me</p>'}]);
  assert.equal(result.pages, 2);
  assert.equal(result.words, 4);
});

test('中日韩文字逐字、其他语言逐词，支持无空格的中英混排', () => {
  const result = stats([{content: '<p>Hello中文 world 日本語 한글</p>'}]);
  assert.equal(result.words, 9);
});

test('解码 HTML 实体，分隔段落，不拆开内联强调中的单词', () => {
  const result = stats([{content: '<p>Hel<em>lo</em>&nbsp;world &amp; &#20013;</p><p>再见</p><!-- 不计注释 -->'}]);
  assert.equal(result.words, 5);
});

test('排除代码块、内联代码、行号、脚本和样式', () => {
  const result = stats([{content: '<p>正文<code>code</code></p><pre>ignore this</pre><figure class="highlight bash"><table><tr><td>1</td><td>hexo generate</td></tr></table></figure><script>ignore this</script><style>body {color: red}</style>'}]);
  assert.equal(result.words, 2);
});

test('统计不套用搜索的 head、template 与 noscript 排除规则', () => {
  const content = '<head><title>metadata </title></head><template><p>template</p></template><noscript><p>fallback</p></noscript><p>body</p><pre>code</pre><div class="note">note</div>';
  assert.equal(helpers().page_stats(content).words, 4);
});

test('从所有内容中选取最新日期', () => {
  const date = new Date('2026-10-01T00:00:00Z');
  const updated = new Date('2026-11-10T00:00:00Z');
  const draftDate = new Date('2026-11-11T00:00:00Z');
  const result = stats([{date}, {published: false, updated: draftDate}], [{date, updated}]);
  assert.equal(result.updated, updated);
});

test('注释块不计入正文字数', () => {
  const result = stats([{content: '<p>正文</p><div class="note"><p>这是很长的作者注释</p></div>', date: new Date(2026, 0, 1)}]);
  assert.equal(result.words, 2);
});

test('详细统计保留正文口径，列出标签、分类、平均字数和最长页面', () => {
  const result = helpers().site_stats.call({
    theme: {sections: [{label: '作品'}, {label: '随笔'}]},
    site: {
      posts: {toArray: () => [
        {title: '长文', path: 'long/', content: '<p>一二三四</p>', categories: {toArray: () => [{name: '作品'}, {name: '随笔'}]}, tags: {toArray: () => [{name: '原创'}]}},
        {title: '短文', path: 'short/', content: '<p>一二</p>', categories: {toArray: () => [{name: '作品'}]}, tags: {toArray: () => [{name: '原创'}, {name: '小说'}]}}
      ]},
      pages: {toArray: () => [{title: '独立', path: 'page/', content: '<p>一二三</p>'}, {published: false, content: '不统计'}]}
    }
  });
  assert.equal(result.pages, 3);
  assert.equal(result.posts, 2);
  assert.equal(result.standalone, 1);
  assert.equal(result.categories, 2);
  assert.equal(result.tags, 2);
  assert.equal(result.average, 3);
  assert.equal(result.longest.title, '长文');
  assert.equal(result.minutes, 1);
  assert.deepEqual(Array.from(result.distribution, item => [item.label, item.count]), [['作品', 2], ['随笔', 1], ['其他页面', 1]]);
});

test('热力图按上海时区计最近更新，每页仅一次，覆盖 365 天并排除范围外与草稿', () => {
  const result = helpers().site_activity.call({config: {timezone: 'Asia/Shanghai'}, site: {
    posts: {toArray: () => [
      {date: new Date('2026-01-01'), updated: new Date('2026-11-11T16:30:00Z')},
      {date: new Date('2026-11-12T02:00:00Z')},
      {date: new Date('2024-01-01')},
      {published: false, updated: new Date('2026-11-12')},
      {updated: new Date('2027-01-01')}
    ]}, pages: {toArray: () => [{date: new Date('2026-11-11T10:00:00Z')}]}
  }}, new Date('2026-11-12T06:00:00Z'));
  assert.equal(result.cells.filter(cell => cell.inRange).length, 365);
  assert.equal(result.cells.length % 7, 0);
  assert.equal(result.cells.find(cell => cell.date === '2026-11-12').count, 2);
  assert.equal(result.cells.find(cell => cell.date === '2026-01-01').count, 0);
  assert.equal(result.activeDays, 2);
  assert.equal(result.updates, 3);
  assert.equal(result.end, '2026.11.12');
});

test('空站点与闰年热力图仍生成完整日历，不制造更新', () => {
  const result = helpers().site_activity.call({site: {
    posts: {toArray: () => []}, pages: {toArray: () => []}
  }}, new Date('2024-03-01T00:00:00Z'));
  assert.equal(result.updates, 0);
  assert.equal(result.activeDays, 0);
  assert.equal(result.cells.filter(cell => cell.inRange).length, 365);
  assert.ok(result.cells.some(cell => cell.date === '2024-02-29' && cell.inRange));
});

test('独立资源不进入统计、最近更新或其他页面，独立 HTML 文档仍保留', () => {
  const {publishedDocuments} = require('../scripts/lib/documents');
  const site = {posts: {toArray: () => []}, pages: {toArray: () => [
    {path: 'mtf/index.html', content: '<p>正文</p>'},
    {path: 'standalone.html', layout: false, content: '<p>页面</p>'},
    {path: 'attachments/style.css', content: '忽略样式'},
    {path: 'attachments/main.js', content: '忽略脚本'},
    {path: 'draft/index.html', published: false}
  ]}};
  assert.deepEqual(publishedDocuments(site).map(page => page.path), ['mtf/index.html', 'standalone.html']);
  const result = helpers().site_stats.call({site});
  assert.equal(result.pages, 2);
  assert.equal(result.words, 4);
});
