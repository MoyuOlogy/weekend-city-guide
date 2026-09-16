/* 周末探索 · router.js —— 页面切换
 *
 * 由 index.html 拆分而来（index.html 的 <script>）。每个文件对应原文件里的一个注释模块，
 * 内容是搬运而非重写。要改某个功能，改对应文件即可，不用翻整个 index.html。
 */

/* ---------------- 14. 页面切换 ---------------- */
const PAGES = ['feed','calendar','team','checkin','guide','me','about'];
function go(page){
  PAGES.forEach(p => { const el = $('#page-' + p); if(el) el.hidden = (p !== page); });
  // 底部 Tab 高亮：假期 / 关于 在移动端是「我的」下的子页面，
  // 停在它们上面时底部高亮「我的」，否则用户会看到 5 个 Tab 全都不亮、像迷路了。
  const tabPage = (page === 'calendar' || page === 'about') ? 'me' : page;
  $$('.tb').forEach(b => b.classList.toggle('on', b.dataset.page === tabPage));
  // 左侧栏与「我的 → 更多」里的入口按真实页面高亮，两者不共用 [data-page] 的高亮语义
  $$('.rail-item, .mrow').forEach(b => b.classList.toggle('on', b.dataset.page === page));
  // 分类导航条只在「首页」有意义，其他页面隐藏（我的页也不要顶部导航条）
  const cb = document.querySelector('.catbar');
  if(cb) cb.hidden = (page !== 'feed');
  if(page === 'calendar') renderCalendar();
  // 关于页有两块内容（新手指引 / 项目说明）：没看过引导的人先看引导，看过的直接看说明
  if(page === 'about') renderAbout();
  window.scrollTo({ top:0, behavior:'smooth' });
}
function toggleTheme(){
  const cur = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = cur; save(LS.theme, cur);
  syncThemeIcons();
}
function syncThemeIcons(){
  const dark = document.documentElement.dataset.theme === 'dark';
  const id = dark ? '#i-sun' : '#i-moon';
  ['#themeBtn', '#railTheme'].forEach(sel => {
    const u = $(sel) && $(sel).querySelector('use');
    if(u) u.setAttribute('href', id);
  });
}
// 瀑布流列数：窄屏 2 列 → 桌面最多 4 列（列数少一点、卡片大一点，比 5 列一排更耐看）
function colCount(){
  const el = $('#feed');
  const w = (el ? el.clientWidth : 0) || window.innerWidth;
  return w < 560 ? 2 : w < 860 ? 3 : 4;
}
