/* 周末探索 · team.js —— 组队
 *
 * 由 index.html 拆分而来（index.html 的 <script>）。每个文件对应原文件里的一个注释模块，
 * 内容是搬运而非重写。要改某个功能，改对应文件即可，不用翻整个 index.html。
 */

/* ---------------- 10. 组队 ---------------- */
function renderTeams(){
  const box = $('#teamList'); if(!box) return;
  const nick = myNick();
  $('#teamCount').textContent = store.teams.length ? `${store.teams.length} 个队伍` : '';
  if(!store.teams.length){
    box.innerHTML = `<div class="empty"><svg class="big"><use href="#i-team"></use></svg>还没有队伍<br>点底部红色「＋」发起一个，从推荐里组队也行</div>`;
    return;
  }
  box.innerHTML = store.teams.map(t => {
    const joined = t.members.includes(nick), pct = Math.min(100, Math.round(t.members.length / t.cap * 100));
    const full = t.members.length >= t.cap;
    return `<div class="row-card">
      <div class="rt">
        <div>
          <h3>${esc(t.title)}${t.demo ? '<span class="tag-demo">示例</span>' : ''}</h3>
          <div class="meta">时间：${esc(t.time || '时间待定')} · 人均 ¥${t.budget} · 发起人 ${esc(t.owner)}</div>
        </div>
        <div class="ring ${t.owner === nick ? 'mine' : ''}" style="--p:${pct}"><span>${t.members.length}/${t.cap}</span></div>
      </div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="faces">${t.members.map(m => `<span class="${m === nick ? 'me' : ''}">${m === t.owner ? '👑' : '🙋'} ${esc(m)}</span>`).join('')}</div>
      <div class="btnrow">
        <button class="btn ${joined ? 'line' : 'pri'}" data-act="join" data-id="${t.id}" ${(!joined && full) ? 'disabled' : ''}>
          ${joined ? '✓ 已加入（点此退出）' : (full ? '已满员' : '＋ 我要加入')}</button>
        <button class="btn line" data-act="share" data-id="${t.id}"><svg class="ri" width="16" height="16"><use href="#i-link"></use></svg>邀请文案</button>
        ${t.owner === nick ? `<button class="btn warn" data-act="delt" data-id="${t.id}">解散</button>` : ''}
      </div>
    </div>`;
  }).join('');
  observeIn();
}
function createTeam(title){
  if(!me.nick) { toast('先在「我的」里设置昵称'); return false; }
  if(!title) { toast('写一下要去干嘛～'); return false; }
  store.teams.unshift({ id:uid(), owner:me.nick, title, time:$('#tTime').value.trim(),
    cap:Math.max(2, +$('#tCap').value || 4), budget:Math.max(0, +$('#tBudget').value || 0),
    members:[me.nick], ts:Date.now() });
  persistStore(); sync.schedule(); renderTeams(); return true;
}
