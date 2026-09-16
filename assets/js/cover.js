/* 周末探索 · cover.js —— 封面（纯 CSS 暖色，零外链）
 *
 * 由 index.html 拆分而来（index.html 的 <script>）。每个文件对应原文件里的一个注释模块，
 * 内容是搬运而非重写。要改某个功能，改对应文件即可，不用翻整个 index.html。
 */

/* ---------------- 4. 封面（纯 CSS 暖色，零外链） ---------------- */
const GRADS = [
  ['#FFD9A8','#FF8B5E'], ['#FFDCE3','#FF7A93'], ['#FFEFC4','#F5B942'], ['#E7F0DA','#8FB863'],
  ['#F6E2D3','#C98A5E'], ['#FFE2D1','#FF9E7A'], ['#FBD9C4','#DE7048'], ['#EDE4D8','#B99C7A'],
  ['#FFE9B8','#E9A93B'], ['#E5EFE0','#7BA377'], ['#FADFCF','#D97757'], ['#F2E6D8','#BF9E80'],
  ['#FFDBDE','#E8697B'], ['#FFF2D4','#E0AC46'], ['#E8EFE1','#87A465'], ['#FFE5E0','#D9705F']
];
const PATTERNS = ['grain','rings','none'];
const hash = s => { let h = 0; for(let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
let gradSeed = 0;
const coverGrad = a => GRADS[(hash(a.id + a.name) + gradSeed) % GRADS.length];
const coverDecor = a => {
  const k = hash(a.id + a.name), pat = PATTERNS[k % 3];
  return (pat === 'rings' ? '<div class="rings"></div>' : '') + (pat === 'grain' ? '<div class="grain"></div>' : '');
};
function coverHTML(a, h, extra){
  return `<div class="cover" style="height:${h}px;background:linear-gradient(135deg,${coverGrad(a).join(',')})">
    ${coverDecor(a)}
    <span class="emo">${TYPE_EMOJI[a.type] || '🎈'}</span>
    <span class="badge bl ${a.price === 0 ? 'free' : ''}">${a.price === 0 ? '免费' : '¥' + a.price}</span>
    ${extra || ''}
  </div>`;
}
const coverHeights = [190, 240, 165, 215, 180, 255];
