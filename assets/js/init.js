/* 周末探索 · init.js —— 启动
 *
 * 由 index.html 拆分而来（index.html 的 <script>）。每个文件对应原文件里的一个注释模块，
 * 内容是搬运而非重写。要改某个功能，改对应文件即可，不用翻整个 index.html。
 */

/* ---------------- 18. 启动 ---------------- */
function renderCats(){
  // 分类纯文字不带图标 —— 减少视觉噪音
  $('#catbar').innerHTML = ['全部'].concat(TYPES).map(c =>
    `<button class="cat ${c === cat ? 'on' : ''}" data-cat="${c}">${c === '全部' ? '推荐' : c}</button>`).join('');
}
async function refreshWeather(){
  weather = await fetchWeather(prefs.city);
  renderWeatherBar(); renderFeed();
  if($('#page-calendar') && !$('#page-calendar').hidden) renderCalendar();
}
(async function init(){
  document.documentElement.dataset.theme = load(LS.theme, 'light');
  syncThemeIcons();

  // 分享链接导入
  const m = location.hash.match(/#r=(.+)$/);
  if(m){
    try{
      const data = decodeState(m[1]);
      sync.receive({ ...data, room:'' }, Date.now());
      history.replaceState(null, '', location.pathname);
      setTimeout(() => toast('已从分享链接导入'), 500);
    }catch{ toast('分享链接解析失败'); }
  }

  renderCats();
  seedDemo();                        // 首次访问灌入示例数据，让四个页面都不是空白（我的页可一键清除）
  renderAll();
  maybeStartTour();                  // 首次访问强制走一遍新手引导（不阻塞下面的天气请求）
  persistPrefs();
  if(me.nick) $('#meName').textContent = me.nick;

  // 直接打开 #/note/xxx 深链（可分享、可刷新、可从聊天记录点回来）
  const noteMatch = location.hash.match(/^#\/note\/(.+)$/);
  if(noteMatch && findAct(noteMatch[1])) openDetail(noteMatch[1]);
  await refreshWeather();
  renderCalendar();                  // 天气到了之后把日历里的预报补上
  if(me.room){ sync.join(me.room); }   // 自动重连上次的房间
  // 心跳保持在线状态
  setInterval(() => { if(me.room) sync.publish(); }, 90000);
  window.addEventListener('resize', debounce(renderFeed, 220));
})();
