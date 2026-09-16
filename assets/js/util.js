/* 周末探索 · util.js —— 工具函数
 *
 * 由 index.html 拆分而来（index.html 的 <script>）。每个文件对应原文件里的一个注释模块，
 * 内容是搬运而非重写。要改某个功能，改对应文件即可，不用翻整个 index.html。
 */

/* ---------------- 0. 工具 ---------------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const ymd = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const buzz = (ms = 12) => { try { navigator.vibrate?.(ms); } catch {} };
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
// 复制文本：先给即时反馈，再尝试写剪贴板。
// 反过来（先 await 剪贴板）会因为权限/无焦点长时间不返回，用户看到的是"点了没反应"。
function copyText(txt, okMsg){
  toast(okMsg || '已复制');
  try{
    const p = navigator.clipboard && navigator.clipboard.writeText(txt);
    if(p && p.catch) p.catch(() => toast('浏览器拒绝了复制，请手动选择文本'));
  }catch{ toast('浏览器不支持自动复制，请手动选择文本'); }
}const LOGIN_EMOJI = ['🙂','🐱','🐼','🦊','🐨','🐧','🦉','🐳','🌵','🍑','🥑','🍊'];
function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 1800);
}
