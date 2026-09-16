/* 周末探索 · me.js —— 我的
 *
 * 由 index.html 拆分而来（index.html 的 <script>）。每个文件对应原文件里的一个注释模块，
 * 内容是搬运而非重写。要改某个功能，改对应文件即可，不用翻整个 index.html。
 */

/* ---------------- 13. 我的 ---------------- */
function renderMe(){
  $('#meAvatar').textContent = me.emoji;
  $('#meName').textContent = me.nick || '未设置昵称';
  $('#meSub').textContent = me.nick ? `本机身份 · 数据会署你的名字` : '设置昵称后即可组队、发攻略';
  const myCk = store.checkins.filter(c => !c.owner || c.owner === myNick());
  const favs = activityLib().filter(a => iLiked(a.id));
  // 统计可点击跳转
  $('#meStats').innerHTML = `
    <button class="stat" data-page="team"><b>${store.teams.filter(t => t.owner === myNick()).length}</b><span>我发起的队</span></button>
    <button class="stat" data-page="checkin"><b>${myCk.length}</b><span>打卡</span></button>
    <button class="stat" data-page="guide"><b>${store.guides.filter(g => g.author === myNick()).length}</b><span>攻略</span></button>
    <button class="stat" data-jump="fav"><b>${favs.length}</b><span>收藏</span></button>`;
  $('#meSyncTitle').textContent = me.room ? `房间 ${me.room}` : '未加入云端房间';
  $('#meSyncSub').textContent = me.room ? sync.statusText() : '加入房间后，手机建的活动电脑能立刻看到';
  const cdb = $('#clearDemoBtn'); if(cdb) cdb.hidden = !hasDemo();
  $('#meFavList').innerHTML = favs.length ? favs.map(a => {
    const g = coverGrad(a);
    return `<div class="row-card" style="display:flex;gap:12px;align-items:center">
      <a href="#/note/${a.id}" data-note="${a.id}" style="width:46px;height:46px;border-radius:8px;display:grid;place-items:center;font-size:20px;background:linear-gradient(135deg,${g[0]},${g[1]})">${TYPE_EMOJI[a.type] || '🎈'}</a>
      <div style="flex:1;min-width:0">
        <a href="#/note/${a.id}" data-note="${a.id}"><h3 style="margin:0;font-size:14px;font-weight:600;color:var(--text)">${esc(a.name)}</h3></a>
        <div class="meta">${esc(a.type)} · ${a.price === 0 ? '免费' : '¥' + a.price} · ${a.hours}h</div>
      </div>
      <a class="btn line" href="#/note/${a.id}" data-note="${a.id}">查看</a>
    </div>`;
  }).join('') : `<div class="empty">还没有收藏，在推荐里点心形图标就会出现在这里</div>`;
  observeIn();
}
