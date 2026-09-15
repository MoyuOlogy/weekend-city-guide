/* 颜色审计：扫描 index.html 中所有颜色，断言不存在蓝/紫色相（185°–335°） */
const fs = require('fs');
const html = fs.readFileSync('D:/dsh/meituan/index.html', 'utf8');
const colors = new Set();
for (const m of html.matchAll(/#[0-9a-fA-F]{6}\b/g)) colors.add(m[0]);
for (const m of html.matchAll(/#[0-9a-fA-F]{3}\b/g)) colors.add(m[0]);
for (const m of html.matchAll(/rgba?\(([^)]+)\)/g)) {
  const p = m[1].split(',').map(s => s.trim());
  if (p.length >= 3 && p.slice(0, 3).every(x => /^\d+$/.test(x))) colors.add('rgb(' + p.slice(0, 3).join(',') + ')');
}
const toRgb = c => {
  if (c.startsWith('rgb')) return c.replace(/rgba?\(|\)/g, '').split(',').map(Number);
  let h = c.slice(1);
  if (h.length === 3) h = h.split('').map(x => x + x).join('');
  return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16));
};
const hsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
  let h = 0, s = 0;
  if (d) {
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = 60 * (((g - b) / d) % 6);
    else if (mx === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
    if (h < 0) h += 360;
  }
  return [h, s, l];
};
const bad = [], kept = [];
for (const c of colors) {
  const [r, g, b] = toRgb(c), [h, s, l] = hsl(r, g, b);
  if (s > 0.15 && l > 0.08 && l < 0.92 && h >= 185 && h <= 335) bad.push(`${c}  hue=${h.toFixed(0)}° sat=${(s * 100).toFixed(0)}% light=${(l * 100).toFixed(0)}%`);
  else if (s > 0.15 && l > 0.08 && l < 0.92) kept.push(`${c}  hue=${h.toFixed(0)}°`);
}
console.log(`扫描到 ${colors.size} 个颜色，其中有彩色 ${kept.length} 个：`);
kept.sort().forEach(k => console.log('   ' + k));
if (bad.length) {
  console.log('\n❌ 检测到禁用色相（蓝/紫 185°–335°）：');
  bad.forEach(x => console.log('   ' + x));
  process.exit(1);
}
console.log('\n✅ 通过：全站无蓝/紫色相，仅有红/橙/黄/绿等暖色与中性色');
