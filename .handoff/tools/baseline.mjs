import {browser} from '/tmp/cdp.mjs';
const b = await browser();
const base = 'http://127.0.0.1:4010';
const out = process.argv[2] || 'before';
const cases = [
  ['home-1440x900', '/', 1440, 900],
  ['article-1440x900', '/scherzo/', 1440, 900],
  ['article-1440x1100', '/scherzo/', 1440, 1100],
  ['article-1440x700', '/scherzo/', 1440, 700],
  ['page-1440x900', '/categories/', 1440, 900],
  ['narrow-768x1024', '/scherzo/', 768, 1024],
  ['narrow-390x844', '/scherzo/', 390, 844],
  ['canvas-1440x900', '/scp-cn-4001/', 1440, 900],
];
for (const [name, path, w, h] of cases) {
  const p = await b.page({width: w, height: h});
  await p.goto(base + path);
  await p.shot(`/tmp/shots/${out}-${name}.png`);
  const m = await p.eval(`(() => { const r = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
    return JSON.stringify({docW: document.documentElement.scrollWidth, winW: innerWidth, side: r('.side-nav'), sideContent: (() => {const e=document.querySelector('.side-nav-content'); return e? [e.scrollHeight, e.clientHeight]:null})(), info: r('.post-info'), infoBody: (() => {const e=document.querySelector('.post-info-body'); return e? [e.scrollHeight, e.clientHeight]:null})(), main: r('#main-content')}); })()`);
  console.log(name, m);
  await p.close();
}
b.close();
