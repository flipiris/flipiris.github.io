'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {htmlText} = require('../scripts/lib/html-text');

test('共享文本提取解码实体、分隔块级内容并保留内联单词', () => {
  assert.equal(htmlText('<p>Hel<em>lo</em>&amp;世界</p><pre>code</pre><div>后</div>'), 'Hello&世界 code 后 ');
});

test('共享文本提取的排除规则完全由调用方传入', () => {
  const source = '<p>正文</p><div class="note">注释</div><code>code</code>';
  assert.equal(htmlText(source), '正文 注释 code');
  assert.equal(htmlText(source, node => node.name === 'div'), '正文 code');
  assert.equal(htmlText(source, node => node.name === 'code'), '正文 注释 ');
});

test('共享文本提取空输入返回空文本，不移除调用方未排除的脚本', () => {
  assert.equal(htmlText(), '');
  assert.equal(htmlText('<script>text()</script>'), 'text()');
});
