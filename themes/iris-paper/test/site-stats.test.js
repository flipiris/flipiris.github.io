'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const {runInNewContext} = require('node:vm');

function stats(posts = [], pages = []) {
  let helper;
  runInNewContext(readFileSync(join(__dirname, '../scripts/site-stats.js'), 'utf8'), {
    require,
    hexo: {extend: {helper: {register(name, callback) {
      assert.equal(name, 'site_stats');
      helper = callback;
    }}}}
  });
  return helper.call({site: {
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

test('从所有内容中选取最新日期', () => {
  const date = new Date('2026-10-01T00:00:00Z');
  const updated = new Date('2026-11-10T00:00:00Z');
  const draftDate = new Date('2026-11-11T00:00:00Z');
  const result = stats([{date}, {published: false, updated: draftDate}], [{date, updated}]);
  assert.equal(result.updated, updated);
});
