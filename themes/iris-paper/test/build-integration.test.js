'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const Hexo = require('hexo');
const {JSDOM} = require('jsdom');

// 用独立临时站点走真实 Hexo 处理器、分类关系、生成器和 EJS，不改作者内容。
test('真实构建：目录子分类、英文路径、两层分页、增强排版与 HTML 画布', async () => {
  const root = path.resolve(__dirname, '../../..');
  const base = await fs.mkdtemp(path.join(os.tmpdir(), 'iris-build-'));
  const write = async (name, content) => {
    const target = path.join(base, name);
    await fs.mkdir(path.dirname(target), {recursive: true});
    await fs.writeFile(target, content);
  };
  let hexo;
  try {
    await fs.mkdir(path.join(base, 'themes'));
    await fs.symlink(path.join(root, 'themes/iris-paper'), path.join(base, 'themes/iris-paper'));
    await fs.symlink(path.join(root, 'node_modules'), path.join(base, 'node_modules'));
    await fs.copyFile(path.join(root, 'package.json'), path.join(base, 'package.json'));
    await write('_config.yml', `title: Test\nauthor: Writer\nurl: https://example.org\ntheme: iris-paper\npermalink: :title/\ndefault_category: ''\nper_page: 3\npretty_urls:\n  trailing_index: false\n  trailing_html: false\ntheme_config:\n  taxonomy_per_page: 2\n  taxonomy_preview: 2\n  sections:\n    - {folder: notes, label: 笔记, icon: edit_note}\n    - {folder: reading, label: 阅读, icon: article, nav: false}\n    - {folder: works, label: 作品, icon: palette}\n`);
    await write('source/_data/home.md', '![轻鸢](/photo.jpg "清晨的山")\n\n# 关于\n\n<blockquote class="home-profile">\n<img src="/avatar.png" alt="头像">\n<div>\n\n**首页介绍**。\n\n[链接](/about/)\n\n</div>\n</blockquote>');
    const workNotes = [];
    for (const name of ['九尾猫漫游录', '入水愿', '调笑令']) {
      const source = await fs.readFile(path.join(root, `source/_posts/works/${name}.md`), 'utf8');
      workNotes.push(source.match(/<div class="note">[\s\S]*?<\/div>/)[0]);
    }
    for (let i = 0; i < 7; i++) await write(`source/_posts/notes/reading/book-${i}.md`, `---\ntitle: 笔记${i}\nlayout: article\ndate: 2020-01-01\npermalink: book-${i}/\ntags: [标签${i}]\n---\n# 正文标题\n\n**强调** 与 *语气*。\n\n${workNotes[i] || ''}`);
    await write('source/_posts/notes/explicit.md', '---\ntitle: 显式分类\ndate: 2020-01-01\npermalink: explicit/\ncategories: [作品]\ntypography: standard\n---\n正文');
    await write('source/_posts/works/canvas.html', '---\ntitle: 画布元数据\nauthor: Author\ndate: 2020-01-01\nlayout: canvas\npermalink: canvas/\ncanvas_base: /attachments/test/\ndisableNunjucks: true\n---\n<html><head><title>内部标题</title></head><body>    <p id="story">实际正文</p></body></html>');
    await write('source/about/index.md', '---\ntitle: 关于\nlayout: page\ndate: 2020-01-01\n---\n## 页面章节\n\n独立页正文');
    await write('source/lab/index.md', '---\ntitle: 外观\nlayout: page\npermalink: appearance/\ndate: 2020-01-02\n---\n外观正文');
    await write('source/_posts/canonical.md', '---\ntitle: 新布局\nlayout: article\npermalink: canonical/\ndate: 2020-01-01\npalette: wanderers\ntypography: enhanced\n---\n**粗体** 与 *斜体*');
    await write('source/_posts/canonical-canvas.md', '---\ntitle: 新画布\nlayout: canvas\npermalink: canonical-canvas/\ndate: 2020-01-01\n---\n正文');
    hexo = new Hexo(base, {silent: true});
    await hexo.init();
    await hexo.call('generate');
    const document = async name => new JSDOM(await fs.readFile(path.join(base, 'public', name, 'index.html'), 'utf8')).window.document;
    const about = await document('about');
    assert.equal(about.querySelector('.site-menu .toc'), null);
    assert.equal(about.querySelector('.post-info'), null);
    assert.equal(about.querySelector('.site-layout > .site-rail + main').id, 'main-content');
    assert.ok(about.querySelector('article.content-page'));
    assert.equal(about.querySelector('header.site-header .site-menu'), null);
    assert.equal(about.querySelector('.has-post-info'), null);
    const categoryIndex = await document('categories');
    assert.equal(categoryIndex.querySelector('.post-info'), null);
    const home = await document('');
    assert.equal(home.querySelector('.post-info'), null);
    assert.ok(home.querySelector('.site-layout > .site-rail + main article.content-page'));
    assert.equal(home.querySelector('.site-identity-hero').classList.contains('page-frame'), false);
    assert.equal(home.querySelector('.top-nav').textContent.trim(), '');
    assert.ok(home.querySelector('#site-tools-slot .site-tools #search-toggle'));
    assert.ok(home.querySelector('#site-search[aria-labelledby="search-title"]'));
    assert.equal(home.querySelectorAll('.site-tools').length, 1);
    assert.equal(home.querySelectorAll('.nav-primary').length, 1);
    assert.equal(home.querySelector('.home-intro figcaption').textContent, '清晨的山');
    assert.match(home.querySelector('.home-intro').textContent, /首页介绍/);
    assert.equal(home.querySelector('.home-profile > img').getAttribute('src'), '/avatar.png');
    assert.equal(home.querySelector('.home-profile > div strong').textContent, '首页介绍');
    assert.equal(home.querySelector('.home-profile > div a').getAttribute('href'), '/about/');
    assert.equal(home.querySelector('.home-intro figure img').getAttribute('title'), null);
    assert.ok(home.querySelector('link[href="/attachments/home/home.css"]'));
    assert.equal(about.querySelector('link[href$="/attachments/home/home.css"]'), null);
    const misc = await document('misc');
    assert.equal(misc.querySelectorAll('.post-item').length, 4);
    assert.ok(misc.querySelector('a[href="/appearance/"]'));
    assert.equal(misc.querySelector('a[href="/appearance/index.html"]'), null);
    assert.equal((await document('appearance')).title, '外观 · Writer');
    const canonical = await document('canonical');
    assert.equal(canonical.body.dataset.layout, 'article');
    assert.equal(canonical.body.dataset.palette, 'wanderers');
    assert.ok(canonical.querySelector('article.content-page'));
    assert.ok(canonical.querySelector('.post-info'));
    const canonicalCanvas = await document('canonical-canvas');
    assert.equal(canonicalCanvas.body.dataset.layout, 'canvas');
    assert.equal(canonicalCanvas.body.dataset.canvas, 'prose');
    assert.ok(canonicalCanvas.querySelector('article.content-page'));
    assert.equal(canonicalCanvas.querySelector('.page-title'), null);
    assert.equal(canonicalCanvas.querySelector('.article-footer'), null);
    assert.ok(canonicalCanvas.querySelector('.site-rail'));
    assert.ok(canonicalCanvas.querySelector('.post-info'));
    assert.ok(canonicalCanvas.querySelector('.site-footer'));
    assert.equal(home.querySelector('#recent-title'), null);
    assert.ok(home.querySelector('.home-overview + .overview-details'));
    assert.equal(home.querySelector('.overview-stats .detail-stats'), null);
    const note = await document('book-0');
    assert.equal(note.body.dataset.typography, 'enhanced');
    const sidebar = note.querySelector('.site-menu-body');
    assert.equal(sidebar.lastElementChild.className, 'social-links');
    assert.equal(sidebar.querySelectorAll('.social-links svg').length, 0);
    assert.equal(sidebar.querySelectorAll('.social-links :is(a[href], button:disabled)').length, 4);
    assert.ok(sidebar.querySelector('.social-links a[aria-label="SCP 基金会"]'));
    assert.ok(sidebar.querySelector('.social-links a[aria-label="Bangumi"]'));
    assert.equal(sidebar.querySelectorAll('.social-links .social-icon').length, 4);
    assert.equal(sidebar.querySelectorAll('.social-links img').length, 0);
    for (const name of ['github', 'x']) {
      assert.match(sidebar.querySelector(`.social-icon-${name}`).getAttribute('style'), new RegExp(`/icons/${name}\\.svg`));
      assert.match(await fs.readFile(path.join(base, `public/icons/${name}.svg`), 'utf8'), /<svg[^>]*viewBox="0 0 24 24"/);
    }
    const noteLinks = [
      'https://mp.weixin.qq.com/s/cmQB6jYGgx6OFtm_1n0Oyg',
      'https://scp-wiki-cn.wikidot.com/drowning-to-life',
      'https://scp-wiki-cn.wikidot.com/gudianaiqing-gushiji#toc2'
    ];
    for (let i = 0; i < noteLinks.length; i++) {
      const work = await document(`book-${i}`);
      assert.equal(work.querySelector('.info-note a').getAttribute('href'), noteLinks[i]);
      assert.equal(work.querySelector('.article-content .note'), null);
      assert.doesNotMatch(work.querySelector('.info-note').textContent, /\]\(https:/);
    }
    assert.match(sidebar.querySelector('.social-icon-bangumi').getAttribute('style'), /\/icons\/bangumi\.svg/);
    assert.match(sidebar.querySelector('.social-icon-wikidot').getAttribute('style'), /\/icons\/scp-foundation\.png/);
    assert.equal(sidebar.querySelector('.social-links').previousElementSibling.className, 'site-stats');
    assert.equal(sidebar.querySelector('.nav-categories a[href="/categories/reading/"]'), null);
    const search = JSON.parse(await fs.readFile(path.join(base, 'public/search.json'), 'utf8'));
    assert.ok(search.some(item => item.url === '/book-0/' && item.text.includes('强调')));
    assert.ok(search.some(item => item.url === '/about/'));
    assert.ok(search.some(item => item.url === '/canvas/' && item.text.includes('实际正文')));
    assert.equal(search.some(item => item.url.includes('/attachments/')), false);
    assert.equal(search.some(item => item.url === '/categories/'), false);
    assert.equal(note.querySelector('.page-title').textContent, '笔记0');
    assert.equal(note.querySelector('.article-content h1').textContent, '正文标题');
    assert.equal((await document('explicit')).body.dataset.typography, 'standard');
    assert.equal((await document('categories/notes/reading')).querySelectorAll('.post-item').length, 3);
    assert.equal((await document('categories/notes/reading/page/2')).querySelectorAll('.post-item').length, 3);
    assert.equal((await document('categories/notes/reading/page/3')).querySelectorAll('.post-item').length, 1);
    assert.equal((await document('categories')).querySelectorAll('.taxonomy-card').length, 2);
    assert.equal((await document('categories/page/2')).querySelectorAll('.taxonomy-card').length, 1);
    assert.equal((await document('tags/page/4')).querySelectorAll('.taxonomy-card').length, 1);
    const canvas = await document('canvas');
    assert.equal(canvas.querySelector('.page-title'), null);
    assert.equal(canvas.title, '画布元数据 · Writer');
    assert.equal(canvas.querySelector('meta[name="author"]').content, 'Author');
    const frame = canvas.querySelector('.canvas-document');
    assert.ok(!frame.getAttribute('sandbox').includes('allow-same-origin'));
    const inner = new JSDOM(frame.srcdoc).window.document;
    assert.equal(inner.querySelector('#story').textContent, '实际正文');
    assert.equal(inner.querySelector('base').getAttribute('href'), '/attachments/test/');
    assert.equal(inner.querySelector('script').getAttribute('src'), '/js/canvas-bridge.js');
    assert.equal(canvas.body.dataset.canvas, 'document');
    assert.ok(canvas.querySelector('.site-header'));
    assert.ok(canvas.querySelector('.top-nav'));
    assert.ok(canvas.querySelector('.site-rail'));
    assert.ok(canvas.querySelector('.site-menu'));
    assert.equal(canvas.querySelector('.article-footer'), null);
    assert.ok(canvas.querySelector('.post-info'));
    assert.ok(canvas.querySelector('.site-footer'));
    assert.equal(canvas.querySelector('link[href="/css/compact.css"]').getAttribute('media'), null);
    const first = hexo.model('Post').findOne({source: '_posts/notes/reading/book-0.md'});
    assert.deepEqual(first.categories.toArray().map(item => item.name), ['笔记', '阅读']);
    const explicit = hexo.model('Post').findOne({source: '_posts/notes/explicit.md'});
    assert.deepEqual(explicit.categories.toArray().map(item => item.name), ['笔记']);
    const works = await document('categories/works');
    assert.ok(works.querySelector('a[href="/canvas/"]'));
    assert.equal((await document('misc')).querySelector('a[href="/canvas/"]'), null);
    const beforeWords = (await document('')).querySelector('.site-stats').textContent;
    await write('source/_posts/notes/explicit.md', '---\ntitle: 显式分类\ndate: 2020-01-01\npermalink: explicit/\ncategories: [作品]\n---\n' + '字'.repeat(1000));
    await hexo.call('generate');
    assert.notEqual((await document('')).querySelector('.site-stats').textContent, beforeWords);
    assert.equal((await document('explicit')).body.dataset.typography, 'enhanced');
  } finally {
    if (hexo) await hexo.exit();
    await fs.rm(base, {recursive: true, force: true});
  }
});
