'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync, readdirSync} = require('node:fs');
const {join} = require('node:path');
const {JSDOM} = require('jsdom');

const cssRoot = join(__dirname, '../source/css');
const base = readFileSync(join(cssRoot, 'base.css'), 'utf8');
const presets = readFileSync(join(cssRoot, 'presets.css'), 'utf8');
const roles = ['heading-1', 'heading-2', 'heading-3', 'strong', 'emphasis'];
const rgbVariables = css => Object.fromEntries([...css.matchAll(/--([\w-]+): ([\d ]+);/g)].map(([, name, rgb]) => [name, rgb.split(' ').map(Number)]));
const defaults = rgbVariables(base.slice(0, base.indexOf('}')));
const linear = value => (value /= 255) <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
const luminance = rgb => rgb.map(linear).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);

function lab(rgb) {
  const [r, g, b] = rgb.map(linear);
  const f = value => value > 0.008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116;
  const x = f((r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047);
  const y = f(r * 0.2126729 + g * 0.7151522 + b * 0.072175);
  const z = f((r * 0.0193339 + g * 0.119192 + b * 0.9503041) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

for (const name of ['rose', 'tech', 'wanderers', 'ink', 'sepia']) {
  test(`${name}：标题、粗体、斜体分别设色，正文和界面文字保持可读`, () => {
    const rule = presets.match(new RegExp(`body\\[data-palette="${name}"\\] \\{([^}]+)\\}`));
    const palette = {...defaults, ...rgbVariables(rule ? rule[1] : '')};
    for (const role of [...roles, 'ink', 'muted', 'accent', 'brand']) {
      for (const background of ['paper', 'bg']) {
        assert.ok(contrast(palette[role], palette[background]) >= 4.5, `${name}/${role} on ${background}`);
      }
    }
    for (let i = 0; i < roles.length; i++) {
      for (const other of roles.slice(i + 1)) {
        const a = lab(palette[roles[i]]);
        const b = lab(palette[other]);
        assert.ok(Math.hypot(...a.map((value, j) => value - b[j])) >= 25, `${name}: ${roles[i]} vs ${other}`);
      }
    }
    assert.doesNotMatch(presets, /--heading-[123]: var\(--(?:strong|emphasis)\)/);
  });
}

test('亮暗配色按选择器优先级覆盖，ink 日间复用默认色', () => {
  const tools = readFileSync(join(cssRoot, 'tools.css'), 'utf8');
  const dom = new JSDOM(`<style>${base}\n${presets}\n${tools}</style><body></body>`);
  const {document} = dom.window;
  const rules = Array.from(document.styleSheets[0].cssRules).filter(rule => rule.style && rule.style.getPropertyValue('--bg'));
  function values(element) {
    const result = {};
    for (const [order, rule] of rules.entries()) {
      for (const selector of rule.selectorText.split(',')) {
        if (!element.matches(selector)) continue;
        const specificity = (selector.match(/\[|:root/g) || []).length * 100 + (selector.match(/\bbody\b/g) || []).length;
        for (const key of ['--bg', '--paper', '--ink', '--accent']) {
          const value = rule.style.getPropertyValue(key).trim();
          if (value && (!result[key] || specificity > result[key].specificity || (specificity === result[key].specificity && order >= result[key].order))) {
            result[key] = {value, specificity, order};
          }
        }
      }
    }
    return Object.fromEntries(Object.entries(result).map(([key, entry]) => [key, entry.value]));
  }
  for (const [palette, mode, expected] of [['ink', 'light', '247 246 242'], ['ink', '', '23 26 30'], ['ink', 'dark', '23 26 30'], ['tech', 'dark', '23 26 30'], ['sepia', 'dark', '23 26 30'], ['wanderers', 'dark', '23 26 30']]) {
    document.body.dataset.palette = palette;
    if (mode) document.documentElement.dataset.mode = mode;
    else delete document.documentElement.dataset.mode;
    assert.equal(values(document.documentElement)['--bg'], expected, `${palette}/${mode} root`);
    assert.equal(values(document.body)['--bg'], expected, `${palette}/${mode} body`);
  }
  assert.equal((base + presets + tools).match(/--bg: 247 246 242;/g).length, 1);
  dom.window.close();
});

test('既有作品样式与主题样式都展开声明，不使用单行压缩规则', () => {
  function styles(directory) {
    return readdirSync(directory, {withFileTypes: true}).flatMap(item => {
      const file = join(directory, item.name);
      return item.isDirectory() ? styles(file) : file.endsWith('.css') ? [file] : [];
    });
  }
  for (const file of [...styles(cssRoot), ...styles(join(__dirname, '../../../source'))]) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /^[^\n{}]*\{[^\n{}]+\}/m, file);
  }
});
