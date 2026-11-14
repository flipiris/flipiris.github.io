'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const {runInNewContext} = require('node:vm');
const {createRequire} = require('node:module');

function fixture() {
  let generate;
  const module = {exports: {}};
  runInNewContext(readFileSync(join(__dirname, '../scripts/search-index.js'), 'utf8'), {
    module, require: createRequire(join(__dirname, '../scripts/search-index.js')),
    hexo: {
      config: {url: 'https://example.org/blog/', root: '/blog/', pretty_urls: {trailing_index: false, trailing_html: false}},
      extend: {generator: {register: (name, fn) => { generate = fn; }}}
    }
  });
  return {generate, searchText: module.exports.searchText};
}

test('搜索正文解码实体与分段，去除完整 HTML 画布的脚本、样式和 head', () => {
  assert.equal(fixture().searchText('<html><head><title>内部标题</title><style>.hidden{}</style></head><body><p>甲 &amp; 乙</p><p>丙</p><script>danger()</script></body></html>'), '甲 & 乙 丙');
});

test('搜索保留代码和作者注释，排除模板与无脚本回退内容', () => {
  assert.equal(fixture().searchText('<pre>code</pre><div class="note">作者注释</div><template>隐藏</template><noscript>回退</noscript>'), 'code 作者注释');
});

test('索引含公开文章与独立页，不含草稿、附件与生成索引，遵守子路径网址', () => {
  const {generate} = fixture();
  const result = generate({
    posts: {toArray: () => [
      {title: '文章', path: 'post/index.html', content: '<p>正文</p>', tags: {toArray: () => [{name: '文学'}]}},
      {published: false, path: 'draft/', content: '不公开'}
    ]},
    pages: {toArray: () => [{title: '关于', path: 'about/index.html', content: '介绍'}, {path: 'attachments/style.css', content: 'CSS'}]}
  });
  assert.equal(result.path, 'search.json');
  const data = JSON.parse(result.data);
  assert.deepEqual(data.map(item => item.url), ['/blog/about/', '/blog/post/']);
  assert.deepEqual(data[1].tags, ['文学']);
  assert.equal(data[1].text, '正文');
});
