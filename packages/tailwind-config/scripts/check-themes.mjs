import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'theme');

const TONE_SUFFIXES = ['', '-foreground', '-hover', '-active', '-focus', '-disabled', '-disabled-foreground', '-soft', '-soft-hover', '-selected', '-soft-foreground', '-border', '-border-hover', '-border-strong'];
const LADDER = ['background', 'foreground', 'overlay', 'canvas', 'card', 'muted', 'inset', 'inset-hover', 'muted-foreground', 'border', 'input'];
const ROLE_TONES = ['primary', 'accent', 'neutral'];
const SEMANTIC_TONES = ['success', 'warning', 'danger', 'info'];
const HEX = /^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i;

const errors = [];

const parseBlocks = (css) =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
    selector: selector.trim(),
    vars: Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()])),
  }));

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

function checkTone(label, vars, tone, surfaces) {
  for (const suffix of TONE_SUFFIXES) {
    const name = `${tone}${suffix}`;
    if (!(name in vars)) errors.push(`${label}: missing --${name}`);
    else if (!HEX.test(vars[name])) errors.push(`${label}: --${name} is not a hex color`);
  }
  const pairs = [
    ['', '-foreground', 4.5],
    ['-soft', '-soft-foreground', 4.5],
    ['-selected', '-soft-foreground', 4.5],
    ['-disabled', '-disabled-foreground', 4.5],
  ];
  for (const [fill, text, min] of pairs) {
    const [bg, fg] = [vars[`${tone}${fill}`], vars[`${tone}${text}`]];
    if (bg && fg && HEX.test(bg) && HEX.test(fg) && contrast(bg, fg) < min) {
      errors.push(`${label}: --${tone}${text} on --${tone}${fill} is below ${min}:1`);
    }
  }
  const outline = vars[`${tone}-border`];
  for (const surface of surfaces) {
    if (outline && HEX.test(outline) && HEX.test(surface) && contrast(outline, surface) < 3) {
      errors.push(`${label}: --${tone}-border is below 3:1 on ${surface}`);
    }
  }
}

function checkLadder(label, vars) {
  for (const name of LADDER) {
    if (!(name in vars)) errors.push(`${label}: missing --${name}`);
    else if (!HEX.test(vars[name])) errors.push(`${label}: --${name} is not a hex color`);
  }
  for (const surface of ['background', 'card', 'canvas', 'muted', 'inset']) {
    if (contrast(vars.foreground, vars[surface]) < 4.5) errors.push(`${label}: --foreground on --${surface} is below 4.5:1`);
    if (contrast(vars['muted-foreground'], vars[surface]) < 4.5) errors.push(`${label}: --muted-foreground on --${surface} is below 4.5:1`);
  }
  if (contrast(vars.input, vars.background) < 3) errors.push(`${label}: --input is below 3:1 on --background`);
}

const isDark = (selector) => selector.includes('.dark');
const surfacesOf = (vars) => [vars.background, vars.card, vars.canvas];

const themes = readdirSync(join(root, 'themes')).filter((file) => file.endsWith('.css') && file !== 'index.css');
const semantic = parseBlocks(readFileSync(join(root, 'semantic.css'), 'utf8'));

for (const file of themes) {
  const blocks = parseBlocks(readFileSync(join(root, 'themes', file), 'utf8'));
  if (blocks.length !== 2) errors.push(`${file}: expected one light and one dark block`);
  for (const { selector, vars } of blocks) {
    const mode = isDark(selector) ? 'dark' : 'light';
    const label = `${file} (${mode})`;
    checkLadder(label, vars);
    for (const tone of ROLE_TONES) checkTone(label, vars, tone, surfacesOf(vars));
    const semanticVars = semantic.find((block) => isDark(block.selector) === (mode === 'dark'))?.vars ?? {};
    for (const tone of SEMANTIC_TONES) checkTone(`semantic.css vs ${label}`, semanticVars, tone, surfacesOf(vars));
  }
}

if (errors.length) {
  console.error(errors.map((error) => `✗ ${error}`).join('\n'));
  process.exit(1);
}
console.log(`✓ ${themes.length} theme(s) valid`);
