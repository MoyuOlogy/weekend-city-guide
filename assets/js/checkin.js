/* 周末探索 · checkin.js —— 打卡
 *
 * 由 index.html 拆分而来（index.html 的 <script>）。每个文件对应原文件里的一个注释模块，
 * 内容是搬运而非重写。要改某个功能，改对应文件即可，不用翻整个 index.html。
 */

/* ---------------- 11. 打卡 ---------------- */
const MOODS = { '🤩':'超值','😌':'治愈','🥵':'累但爽','😐':'一般','😭':'踩雷' };
function renderCheckins(){
  const stats = $('#ckStats'), list = $('#ckList');
  if(!stats) return;
  const mine = store.checkins.filter(c => !c.owner || c.owner === myNick());
  const cost = mine.reduce((s, c) => s + (+c.cost || 0), 0);
  const hours = mine.reduce((s, c) => s + (+c.hours || 0), 0);
  stats.innerHTML = `
    <div class="stat"><b>${mine.length}</b><span>打卡次数</span></div>
    <div class="stat"><b>${hours.toFixed(1)}</b><span>总时长(h)</span></div>
    <div class="stat"><b>¥${cost}</b><span>总花费</span></div>
    <div class="stat"><b>${new Set(mine.map(c => c.title)).size}</b><span>去过的地</span></div>`;
  if(!mine.length){
    list.innerHTML = `<div class="empty"><svg class="big"><use href="#i-pin"></use></svg>还没有打卡记录<br>去过的每个地方都值得被记下来</div>`;
    return;
  }
  list.innerHTML = [...mine].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(c => `
    <div class="tl">
      <div style="display:flex;gap:8px;align-items:flex-start;justify-content:space-between">
        <h4>${c.mood || '📍'} ${esc(c.title)}${c.demo ? '<span class="tag-demo">示例</span>' : ''}</h4>
        <button class="btn warn" data-act="delc" data-id="${c.id}" style="padding:4px 10px;font-size:11.5px">删除</button>
      </div>
      <div class="meta">${esc(c.date)} · ¥${c.cost}/人 · ${c.hours}h${MOODS[c.mood] ? ' · ' + MOODS[c.mood] : ''}</div>
      ${c.note ? `<div class="quote">“${esc(c.note)}”</div>` : ''}
    </div>`).join('');
}
function addCheckin(title){
  if(!title){ toast('填一下去了哪里～'); return false; }
  store.checkins.unshift({ id:uid(), title, date:$('#cDate').value || ymd(new Date()),
    cost:+$('#cCost').value || 0, hours:+$('#cHours').value || 1,
    mood: currentMood, note:$('#cNote').value.trim(), owner:myNick(), ts:Date.now() });
  persistStore(); sync.schedule(); renderCheckins(); renderMe(); return true;
}
let currentMood = '🤩';
