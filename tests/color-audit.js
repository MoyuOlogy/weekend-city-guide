/* 颜色审计：扫描全站源码里的所有颜色，断言不存在蓝/紫色相（hue 185°–335°）
 *
 * 用法： node tests/color-audit.js
 *
 * 注意：v2.7 把单文件拆成了 index.html + assets/css/* + assets/js/*，
 * 如果这里只读 index.html，样式搬家之后这个审计就变成「扫了个寂寞」却依然打印通过 ——
 * 静默失效的测试比没有测试更危险。所以：
 *   1. 递归扫描 index.html 与 assets/ 下的 .css / .js
 *   2. 额外断言「扫到的颜色数量不低于下限」，文件列表一旦被改坏会立刻大声失败
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const MIN_COLORS = 60;           // 拆分前后实测都是 71 个；掉到 60 以下说明有文件没被扫到
const EXPECT_CSS = 4;            // assets/css/*.css 至少这么多
const EXPECT_JS = 20;            // assets/js/*.js 至少这么多

function collect(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name.startsWith('_')) continue;   // 跳过临时/忽略目录
      collect(p, out);
    } else if (/\.(css|js)$/i.test(e.name)) {
      out.push(p);
    }
  }
  return out;
}

const files = [path.join(root, 'index.html'), ...collect(path.join(root, 'assets'))];
const sources = files.filter(f => fs.existsSync(f));
if (!sources.length) {
  console.error('❌ 一个源文件都没找到，颜色审计无法进行');
  process.exit(1);
}

const colors = new Set();
for (const file of sources) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(/#[0-9a-fA-F]{6}\b/g)) colors.add(m[0].toLowerCase());
  for (const m of text.matchAll(/#[0-9a-fA-F]{3}\b/g)) colors.add(m[0].toLowerCase());
  for (const m of text.matchAll(/rgba?\(([^)]+)\)/g)) {
    const p = m[1].split(',').map(s => s.trim());
    if (p.length >= 3 && p.slice(0, 3).every(x => /^\d+$/.test(x))) {
      colors.add('rgb(' + p.slice(0, 3).join(',') + ')');
    }
  }
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
  // 只看真正有色彩、且不过亮不过暗的颜色；近乎黑白的颜色色相无意义
  const chromatic = s > 0.15 && l > 0.08 && l < 0.92;
  if (!chromatic) continue;
  if (h >= 185 && h <= 335) bad.push(`${c}  hue=${h.toFixed(0)}° sat=${(s * 100).toFixed(0)}% light=${(l * 100).toFixed(0)}%`);
  else kept.push(`${c}  hue=${h.toFixed(0)}°`);
}

console.log(`扫描 ${sources.length} 个文件（index.html + assets/*）：`);
sources.forEach(f => console.log('   ' + path.relative(root, f).replace(/\\/g, '/')));
console.log(`\n扫描到 ${colors.size} 个颜色，其中有彩色 ${kept.length} 个：`);
kept.sort().forEach(k => console.log('   ' + k));

let failed = false;
const cssCount = sources.filter(f => /\.css$/i.test(f)).length;
const jsCount = sources.filter(f => /\.js$/i.test(f)).length;
if (!sources.some(f => f.endsWith('index.html'))) {
  console.log('\n❌ 没有扫到 index.html');
  failed = true;
}
if (cssCount < EXPECT_CSS || jsCount < EXPECT_JS) {
  console.log(`\n❌ 扫到的源文件太少：css=${cssCount}（期望 ≥${EXPECT_CSS}）js=${jsCount}（期望 ≥${EXPECT_JS}）` +
              '\n   样式/脚本很可能被挪到别的地方了，这个审计等于没跑。');
  failed = true;
}
if (bad.length) {
  console.log('\n❌ 检测到禁用色相（蓝/紫 185°–335°）：');
  bad.forEach(x => console.log('   ' + x));
  failed = true;
}
if (colors.size < MIN_COLORS) {
  console.log(`\n❌ 只扫到 ${colors.size} 个颜色（下限 ${MIN_COLORS}）—— 大概率是有源文件没被扫到（比如样式被挪到新目录）。`);
  failed = true;
}
if (failed) process.exit(1);
console.log('\n✅ 通过：全站无蓝/紫色相，仅有红/橙/黄/绿等暖色与中性色');
