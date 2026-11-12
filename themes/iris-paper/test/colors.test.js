'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync, readdirSync} = require('node:fs');
const {join} = require('node:path');

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
