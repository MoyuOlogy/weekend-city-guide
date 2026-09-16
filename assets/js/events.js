/* 周末探索 · events.js —— 事件总线（全局点击委托）
 *
 * 由 index.html 拆分而来（index.html 的 <script>）。每个文件对应原文件里的一个注释模块，
 * 内容是搬运而非重写。要改某个功能，改对应文件即可，不用翻整个 index.html。
 */

/* ---------------- 16. 事件总线 ---------------- */
const isTouch = () => matchMedia('(hover:none)').matches;   // 触屏才用「双击点赞」那套延迟逻辑

// 打开活动详情 + 写入 hash（真链接语义：可分享、可前进后退）
function openNote(id){
  if(!findAct(id)) return;
  openDetail(id);
  try{ history.pushState({ note:id }, '', '#/note/' + id); }catch{}
}
document.addEventListener('click', async e => {
  const t = e.target;

  // 卡片 / 标题 / 作者都是真链接：桌面立即打开（不再等 240ms，避免被误判成双击）
  const noteLink = t.closest('[data-note]');
  if(noteLink){
    if(e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;   // 允许新标签页打开
    e.preventDefault();
    if(isTouch()) return;            // 触屏交给 pointerup，保留双击点赞
    return openNote(noteLink.dataset.note);
  }

  // 只在悬停提示里的长尾信息（天气描述 / 降水概率 / 假期起止）：触屏没有悬停，
  // 点一下直接把提示内容弹出来，否则手机上这些信息等于不存在。
  const tipEl = t.closest('[data-tip]');
  if(tipEl && tipEl.dataset.tip){ toast(tipEl.dataset.tip); return; }

  // 导航：移动端底部 Tab / 桌面端左侧栏 / 顶栏「＋」（＋ 必须先判断，否则会被通用规则吃掉）
  if(t.closest('#plusBtn') || t.closest('#railPublish') || t.closest('#postMini')){ buzz(); return openPublish(null); }
  const nav = t.closest('[data-page]');
  if(nav){ buzz(); return go(nav.dataset.page); }

  // 分类
  const catEl = t.closest('.cat');
  if(catEl){ cat = catEl.dataset.cat; renderCats(); renderFeed(); return; }

  // chip 组
  const chip = t.closest('.chip');
  if(chip){
    const box = chip.parentElement;
    const known = ['fTypes','fExtra','fHours','cMood','nIndoor'].includes(box.id) || box.classList.contains('seg');
    // 认识之外的 chip（例如攻略里的标签）绝不能在这里被吞掉：
    // 以前会对任何 .chip 都执行 persistPrefs()+renderFeed()+return，导致"点了没反应"
    if(!known){
      const tag = chip.dataset.tag;
      if(tag){                       // 攻略标签 = 按标签筛选首页
        keyword = tag;
        const q = $('#q'); if(q) q.value = tag;
        go('feed'); renderFeed();
        toast(`已按「#${tag}」筛选`);
      }
      return;
    }
    if(box.id === 'fTypes'){ const v = chip.dataset.type; prefs.types = prefs.types.includes(v) ? prefs.types.filter(x => x !== v) : prefs.types.concat(v); chip.classList.toggle('on'); }
    else if(box.id === 'fExtra'){ const v = chip.dataset.extra; prefs.extras = prefs.extras.includes(v) ? prefs.extras.filter(x => x !== v) : prefs.extras.concat(v); chip.classList.toggle('on'); }
    else if(box.id === 'fHours'){ prefs.hours = +chip.dataset.hours; $$('#fHours .chip').forEach(c => c.classList.toggle('on', c === chip)); }
    else if(box.id === 'cMood'){ currentMood = chip.dataset.mood; $$('#cMood .chip').forEach(c => c.classList.toggle('on', c === chip)); }
    else if(box.id === 'nIndoor'){ $$('#nIndoor .chip').forEach(c => c.classList.toggle('on', c === chip)); }
    else if(box.classList.contains('seg')){ $$('#' + box.id + ' button').forEach(b => b.classList.toggle('on', b === chip)); }
    persistPrefs(); renderFeed(); return;
  }

  const btn = t.closest('[data-act]');
  const act = btn?.dataset.act;

  switch(act){
    case 'close': return closeSheet();
    case 'detail': return openDetail(btn.dataset.id);
    case 'like': {
      const id = btn.dataset.id;
      const on = likeActivity(id, true);
      if(on) burstHeart();
      $$('.note .like-wrapper[data-id="' + id + '"]').forEach(b => {
        b.classList.toggle('on', on);
        const u = b.querySelector('use'); if(u) u.setAttribute('href', on ? '#i-liked' : '#i-like');
        const cnt = b.querySelector('.count'); if(cnt) cnt.textContent = likeCount(id);
      });
      if(btn.dataset.big) btn.innerHTML =
        `<svg class="ri" width="16" height="16"${on ? ' style="color:var(--red)"' : ''}><use href="#${on ? 'i-liked' : 'i-like'}"></use></svg>${on ? '已赞' : '点赞'} ${likeCount(id)}`;
      renderMe(); return;
    }
    case 'likeg': {
      const g = store.guides.find(x => x.id === btn.dataset.id); if(!g) return;
      g.likedBy ||= []; const i = g.likedBy.indexOf(myNick());
      if(i >= 0) g.likedBy.splice(i, 1); else { g.likedBy.push(myNick()); buzz(14); }
      g.ts = Date.now();                       // 更新 ts，合并时本机版本才会胜出
      persistStore(); sync.schedule(); renderGuides(); return;
    }
    case 'quickteam': { pickNickLater(); openPublish('team'); const el = $('#tTitle'); if(el) el.value = findAct(btn.dataset.id)?.name || ''; return; }
    case 'quickcheckin': { openPublish('checkin'); const el = $('#cTitle'); if(el) el.value = findAct(btn.dataset.id)?.name || ''; return; }
    case 'quickguide': { openPublish('guide'); const el = $('#gTitle'); if(el) el.value = findAct(btn.dataset.id)?.name || ''; return; }
    case 'copyact': {
      const a = findAct(btn.dataset.id); if(!a) return;
      const txt = `${a.name}（${a.type}）\n${a.desc}\n价格：${a.price === 0 ? '免费' : '¥' + a.price + '/人'} · 时长：${a.hours}h · 距离：${a.dist}km\n建议出发：${planTime(a)}`;
      copyText(txt, '活动信息已复制');
      return;
    }
    case 'pub': return openPublish(btn.dataset.kind);
    case 'join': {
      if(!me.nick) return toast('先在「我的」里设置昵称');
      const tm = store.teams.find(x => x.id === btn.dataset.id); if(!tm) return;
      const i = tm.members.indexOf(me.nick);
      if(i >= 0) tm.members.splice(i, 1);
      else { if(tm.members.length >= tm.cap) return toast('队伍已经满员啦'); tm.members.push(me.nick); buzz(18); toast('已加入「' + tm.title + '」🎉'); }
      tm.ts = Date.now(); persistStore(); sync.schedule(); renderTeams(); return;
    }
    case 'share': {
      const tm = store.teams.find(x => x.id === btn.dataset.id); if(!tm) return;
      const txt = `【周末组队】${tm.title}\n时间：${tm.time || '待定'}\n人均：¥${tm.budget}\n已加入：${tm.members.join('、')}（${tm.members.length}/${tm.cap}）\n还差 ${Math.max(0, tm.cap - tm.members.length)} 人，一起来！`;
      copyText(txt, '邀请文案已复制');
      return;
    }
    case 'delt': store.tomb.push(btn.dataset.id); store.teams = store.teams.filter(x => x.id !== btn.dataset.id); persistStore(); sync.schedule(); renderTeams(); return toast('队伍已解散');
    case 'delc': store.tomb.push(btn.dataset.id); store.checkins = store.checkins.filter(x => x.id !== btn.dataset.id); persistStore(); sync.schedule(); renderCheckins(); renderMe(); return toast('已删除');
    case 'copyg': {
      const g = store.guides.find(x => x.id === btn.dataset.id); if(!g) return;
      copyText(`${g.title}\n\n${g.body}\n\n标签：${(g.tags || []).join(' ')}`, '攻略已复制');
      return;
    }
    case 'copyroom': copyText(me.room, '房间码已复制：' + me.room); return;
    case 'push': await sync.publish(true); return toast('已上传');
    case 'pull': await sync.pull(); renderTeams(); renderCheckins(); renderGuides(); renderMe(); renderFeed(); return toast('已拉取');
    case 'leave': return sync.leave();
    case 'create': {
      const v = ($('#sNick')?.value || '').trim(); if(v){ me.nick = v; persistMe(); }
      if(!me.nick) return toast('先填个昵称');
      await sync.join(genCode()); toast('房间已创建：' + me.room); openSync(); return;
    }
    case 'joinbox': $('#joinBox').hidden = false; return;
    case 'join': {
      const v = ($('#sNick')?.value || '').trim(); if(v){ me.nick = v; persistMe(); }
      if(!me.nick) return toast('先填个昵称');
      await sync.join($('#roomInput')?.value || '');
      if(me.room) toast('已加入房间 ' + me.room);
      openSync(); return;
    }
    case 'makelink': return makeShareLink();
    case 'copylink': copyText(btn.dataset.link, '链接已复制'); return;
    case 'importsheet': return openImport();
  }

  // 顶栏 / 侧栏按钮
  if(t.closest('#themeBtn') || t.closest('#railTheme')){ toggleTheme(); return; }
  if(t.closest('#syncBtn') || t.closest('#railSync')) return openSync();
  if(t.closest('#askBtn')){
    const list = visibleActivities();
    if(!list.length) return toast('先放宽一下筛选条件～');
    const best = list[0].a;
    openDetail(best.id);
    toast(`综合天气与预算，最推荐：${best.name}`);
    return;
  }
  // 收藏：滚到收藏区
  if(t.closest('[data-jump="fav"]')){
    const el = $('#meFavList');
    if(el) el.scrollIntoView({ behavior:'smooth', block:'center' });
    return toast('下面就是你的收藏');
  }
  if(t.closest('#filterBtn')) return openFilter();
  if(t.closest('#shuffleBtn')){ gradSeed = Math.floor(Math.random() * 97); renderFeed(); return toast('换一批'); }
  if(t.closest('#meSyncBtn')) return openSync();
  if(t.closest('#shareLinkBtn')) return makeShareLink();
  if(t.closest('#exportBtn')) return exportJSON();
  if(t.closest('#importBtn')) return openImport();
  // 清空改成「两步确认」而不是原生 confirm()：原生弹窗可能被浏览器/环境拦掉，
  // 而且确认后如果人在云端房间，同伴数据会被合并回来 —— 所以同时写墓碑并同步出去。
  if(t.closest('#clearBtn')){
    const btn2 = t.closest('#clearBtn');
    if(btn2.dataset.armed !== '1'){
      btn2.dataset.armed = '1';
      btn2.innerHTML = '<svg class="ri" width="16" height="16"><use href="#i-trash"></use></svg>再点一次确认清空';
      clearTimeout(btn2._t);
      btn2._t = setTimeout(() => { btn2.dataset.armed = '0'; btn2.innerHTML = '<svg class="ri" width="16" height="16"><use href="#i-trash"></use></svg>清空全部数据'; }, 4000);
      return toast('再点一次即清空（含云端房间）');
    }
    btn2.dataset.armed = '0';
    btn2.innerHTML = '<svg class="ri" width="16" height="16"><use href="#i-trash"></use></svg>清空全部数据';
    return clearAllData();
  }
  if(t.closest('#clearDemoBtn')) return clearDemo();
  // 日历页
  if(t.closest('#calPrev')){ calStep(-1); return; }
  if(t.closest('#calNext')){ calStep(1); return; }
  if(t.closest('#calToday')){ const d = new Date(); calYM = { y:d.getFullYear(), m:d.getMonth() }; renderCalendar(); return toast('已回到本月'); }
  if(t.closest('#editNickBtn')) return editNick();

  // 表单提交按钮
  if(t.closest('#tCreate')){ if(createTeam($('#tTitle').value.trim())) { pickNick(); openSheet(null); go('team'); toast('组队已发布 🚀'); } return; }
  if(t.closest('#cAdd')){ if(addCheckin($('#cTitle').value.trim())) { pickNick(); openSheet(null); go('checkin'); toast('打卡成功 📍'); } return; }
  if(t.closest('#gAdd')){
    const title = $('#gTitle').value.trim(), body = $('#gBody').value.trim();
    if(!title || !body) return toast('标题和正文都写一点吧～');
    pickNick();
    store.guides.unshift({ id:uid(), title, body, author:myNick(), date:ymd(new Date()), likedBy:[],
      tags:$('#gTags').value.split(/[,，]/).map(s => s.trim()).filter(Boolean), ts:Date.now() });
    persistStore(); sync.schedule(); renderGuides(); openSheet(null); go('guide'); toast('攻略已发布 🚀');
    return;
  }
  if(t.closest('#nAdd')){
    const name = $('#nName').value.trim(); if(!name) return toast('给活动起个名字～');
    store.activities.unshift({ id:'u' + uid(), name, type:$('#nType').value, price:+$('#nPrice').value || 0,
      hours:+$('#nHours').value || 2, dist:+$('#nDist').value || 1, min:+$('#nMin').value || 1, max:+$('#nMax').value || 6,
      indoor: !!$('#nIndoor .chip.on')?.dataset.indoor && $('#nIndoor .chip.on').dataset.indoor === '1',
      tags:['自建'], desc:$('#nDesc').value.trim() || '我自己加的活动。', ts:Date.now() });
    persistStore(); sync.schedule(); renderFeed(); openSheet(null); toast('已加入活动库');
    return;
  }
  if(t.closest('#resetPrefs')){ prefs = Object.assign({}, DEFAULT_PREFS); persistPrefs(); openFilter(); renderFeed(); return toast('已恢复默认'); }
});
function pickNickLater(){ /* 昵称在表单里填写 */ }

// 输入事件
document.addEventListener('input', e => {
  const t = e.target;
  if(t.id === 'q'){ keyword = t.value.trim(); renderFeed(); }
  if(t.id === 'fBudget'){ prefs.budget = +t.value; $('#budgetVal').textContent = prefs.budget; persistPrefs(); renderFeed(); }
  if(t.id === 'fPeople'){ prefs.people = +t.value; $('#peopleVal').textContent = prefs.people; persistPrefs(); renderFeed(); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if(t.id === 'fCity'){ prefs.city = t.value; persistPrefs(); renderWeatherBar(); refreshWeather(); }
  if(t.id === 'fDay'){ prefs.day = +t.value; persistPrefs(); renderWeatherBar(); refreshWeather(); }
});

// 双击封面点赞 —— 只在触屏上启用。
// 桌面端绝不能走这条逻辑：鼠标用户点一下没反应会再点一下，于是被判成「双击」而永远打不开详情。
let lastTap = 0, tapTimer = null;
document.addEventListener('pointerup', e => {
  if(!isTouch()) return;
  const wrap = e.target.closest('[data-note]');
  if(!wrap) return;
  const id = wrap.dataset.note, now = Date.now();
  if(now - lastTap < 300){
    clearTimeout(tapTimer); lastTap = 0;
    likeActivity(id); renderFeed(); return;   // 双击 = 点赞（不打开详情）
  }
  lastTap = now;
  clearTimeout(tapTimer);
  tapTimer = setTimeout(() => openNote(id), 240);
});

// 浏览器前进/后退 与 直接打开 #/note/xxx 链接
window.addEventListener('popstate', () => {
  const m = location.hash.match(/^#\/note\/(.+)$/);
  if(m && findAct(m[1])) openDetail(m[1]); else openSheet(null);
});
