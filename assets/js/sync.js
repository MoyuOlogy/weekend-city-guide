/* 周末探索 · sync.js —— 云同步（textdb.dev + 分享链接）
 *
 * 由 index.html 拆分而来（index.html 的 <script>）。每个文件对应原文件里的一个注释模块，
 * 内容是搬运而非重写。要改某个功能，改对应文件即可，不用翻整个 index.html。
 */

/* ---------------- 15. 云同步（textdb.dev 公共存储 + 分享链接） ---------------- */
const DB = 'https://textdb.dev/api/data';
// 房间码 → 存储 key。textdb 的语义：拿到 key 的人都能读写，正好等价于「房间码即钥匙」
const topicOf = code => 'wcg-' + String(code).toUpperCase();
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const genCode = () => Array.from({ length:6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
const POLL_MS = 6000;          // 轮询间隔：够实时，又不至于把公共服务的请求打爆

const sync = {
  poll:null, status:'off', lastPub:0, peers:{}, pubTimer:null, inflight:false,
  statusText(){
    return { off:'未开启同步', live:'🟢 已连接，自动同步', syncing:'🟡 同步中…', err:'🔴 同步失败（数据仍在本机）' }[this.status] || this.status;
  },
  async join(code){
    code = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if(code.length < 4) return toast('房间码至少 4 位');
    me.room = code; me.joined = Date.now(); persistMe();
    this.status = 'syncing'; renderMe(); renderSyncSheet();
    await this.pull();            // 先拉：如果是已有房间，先把同伴的数据合并进来
    await this.publish(true);     // 再把本机数据并回去
    this.listen();
  },
  leave(){
    this.stopPoll();
    me.room = ''; persistMe(); this.status = 'off'; this.peers = {};
    renderMe(); renderSyncSheet(); toast('已离开房间');
  },
  listen(){
    this.stopPoll(); this.status = 'live';
    this.poll = setInterval(() => { if(!document.hidden) this.pull(); }, POLL_MS);
    renderMe(); renderSyncSheet();
  },
  stopPoll(){ if(this.poll){ clearInterval(this.poll); this.poll = null; } },
  schedule(){ if(!me.room) return; clearTimeout(this.pubTimer); this.pubTimer = setTimeout(() => this.publish(), 600); },
  async publish(force){
    if(!me.room || this.inflight) return;
    this.inflight = true;
    try{
      // 关键：先拉取云端并合并，再做「读-改-写」。
      // 否则后写的客户端会用自己较少的数据整份覆盖，抹掉别人的贡献。
      try{ const remote = await this.fetchRemote(); if(remote) this.receive(remote, true); }catch{}
      const snap = this.snapshot();
      let payload = JSON.stringify(snap);
      if(payload.length > 60000){      // 礼貌上限，超出就丢掉最旧的条目（本机数据不受影响）
        snap.checkins = snap.checkins.slice(0, 8);
        snap.guides = snap.guides.slice(0, 8);
        payload = JSON.stringify(snap);
      }
      const r = await fetch(`${DB}/${topicOf(me.room)}`, {
        method:'POST', body: payload, headers:{ 'Content-Type':'application/json' }
      });
      if(!r.ok) throw new Error('http ' + r.status);
      this.lastPub = Date.now(); this.status = 'live';
      this.peers[me.nick || '我'] = Date.now();
    }catch{ this.status = 'err'; }
    this.inflight = false;
    renderMe(); renderSyncSheet();
  },
  snapshot(){
    return { v:2, room:me.room, nick:me.nick, ts:Date.now(),
      teams:store.teams.slice(0, 20), checkins:store.checkins.slice(0, 20),
      guides:store.guides.map(g => ({ ...g, body:(g.body || '').slice(0, 500) })).slice(0, 20),
      activities:store.activities.slice(0, 12), likes:store.likes, tomb:store.tomb.slice(-150) };
  },
  async fetchRemote(){
    if(!me.room) return null;
    // 注意：这里刻意不发 Accept: application/json —— textdb 的 JSON 模式会把值再包一层
    // JSON 字符串（响应形如 "{\"a\":1}"），导致解析出字符串、合并静默失效。
    const r = await fetch(`${DB}/${topicOf(me.room)}?_=${Date.now()}`);
    if(!r.ok) throw new Error('http ' + r.status);
    const txt = (await r.text()).trim();
    if(!txt) return null;                      // 空 = 房间还没人写过
    let data = JSON.parse(txt);
    if(typeof data === 'string') data = JSON.parse(data);   // 万一被包了一层，再解一次
    return (data && typeof data === 'object') ? data : null;
  },
  async pull(){
    if(!me.room) return;
    try{
      const remote = await this.fetchRemote();
      if(remote) this.receive(remote);
      if(this.status === 'err' || this.status === 'syncing') this.status = 'live';
    }catch{ this.status = 'err'; }
    renderMe(); renderSyncSheet();
  },
  receive(remote, quiet){
    if(!remote || typeof remote !== 'object') return;
    if(remote.room && me.room && remote.room !== me.room) return;   // 房号不符才丢弃
    // 只有对方最近 90 秒内发布过，才算「在线」
    if(remote.nick && (Date.now() - (remote.ts || 0)) < 90000) this.peers[remote.nick] = Date.now();
    // 合并：按 id 并集，同 id 取 ts 较新者；墓碑（删除）优先
    const tomb = new Set([...(store.tomb || []), ...(remote.tomb || [])]);
    ['teams','checkins','guides','activities'].forEach(key => {
      const map = new Map((store[key] || []).map(x => [x.id, x]));
      (remote[key] || []).forEach(r => { const m = map.get(r.id); if(!m || (r.ts || 0) > (m.ts || 0)) map.set(r.id, r); });
      store[key] = [...map.values()].filter(x => !tomb.has(x.id));
    });
    Object.entries(remote.likes || {}).forEach(([id, obj]) => {
      const mine = { ...(store.likes[id] || {}) };
      Object.entries(obj || {}).forEach(([nick, v]) => {
        if(typeof v !== 'number') return;                       // 忽略 v1 的旧数组格式
        if(!mine[nick] || Math.abs(v) > Math.abs(mine[nick])) mine[nick] = v;
      });
      store.likes[id] = mine;
    });
    store.tomb = [...tomb].slice(-150);
    persistStore();
    renderTeams(); renderCheckins(); renderGuides(); renderMe(); if(!quiet) renderFeed();
  },
  online(){ const now = Date.now(); return Object.entries(this.peers).filter(([, t]) => now - t < 180000).map(([n]) => n); }
};
document.addEventListener('visibilitychange', () => { if(!document.hidden && me.room) sync.pull(); });

function renderSyncSheet(){
  const el = $('#sheetSync'); if(!el.classList.contains('on')) return;
  openSync();
}
function openSync(){
  const online = sync.online();
  openSheet('sync', `
    <div class="sheet-head"><h3>跨设备同步</h3><p>免注册，房间里的所有人共享组队、攻略与活动库</p><button class="x" data-act="close"><svg class="ri" width="16" height="16"><use href="#i-close"></use></svg></button></div>
    <div class="sheet-body">
      ${me.room ? `
        <div class="syncbox">
          <div class="syncrow"><span class="led ${sync.status === 'live' ? 'on' : 'wait'}"></span><b>${sync.statusText()}</b></div>
          <div class="roomcode">${esc(me.room)}</div>
          <div class="kv"><span>在线同伴</span><b>${online.length ? online.map(esc).join('、') : '暂无'}</b></div>
          <div class="kv"><span>本机数据</span><b>${store.teams.length} 队 · ${store.checkins.length} 打卡 · ${store.guides.length} 攻略</b></div>
        </div>
        <div class="btnrow">
          <button class="btn pri" data-act="copyroom"><svg class="ri" width="16" height="16"><use href="#i-copy"></use></svg>复制房间码</button>
          <button class="btn line" data-act="push"><svg class="ri" width="16" height="16"><use href="#i-export"></use></svg>立即上传</button>
          <button class="btn line" data-act="pull"><svg class="ri" width="16" height="16"><use href="#i-import"></use></svg>拉取最新</button>
          <button class="btn warn" data-act="leave">离开房间</button>
        </div>
        <p class="hintline" style="margin-top:12px">把房间码发给同伴，他们在自己手机上「加入房间」就能看到同一个队伍。页面每隔几秒自动同步一次，改动即上传。想长期保存建议再生成一条分享链接。</p>
      ` : `
        <div class="field"><label>你的昵称</label><input type="text" id="sNick" value="${esc(me.nick)}" placeholder="同伴看到的名字" maxlength="12" /></div>
        <div class="btnrow" style="margin-bottom:6px">
          <button class="btn pri" data-act="create">创建新房间</button>
          <button class="btn line" data-act="joinbox">🔑 用房间码加入</button>
        </div>
        <div id="joinBox" hidden>
          <div class="field"><label>房间码（6 位）</label><input type="text" id="roomInput" placeholder="例如 K7M2QX" maxlength="6" style="text-transform:uppercase" /></div>
          <button class="btn pri block" data-act="join">加入房间</button>
        </div>
        <p class="hintline" style="margin-top:14px">房间基于公共服务 textdb.dev：房间码即钥匙，任何拿到它的人都能读写，请勿放敏感信息。国内网络可直连，无需注册。</p>
      `}
      <div class="dsec"><h4>📎 不想用房间？用分享链接</h4>
        <p class="hintline">分享链接把当前数据打包进网址，任何设备打开即导入，永久有效。适合一次性把方案发给同学。</p>
        <div class="btnrow"><button class="btn line" data-act="makelink"><svg class="ri" width="16" height="16"><use href="#i-link"></use></svg>生成分享链接</button></div>
      </div>
    </div>`);
}

/* 分享链接 */
function encodeState(){
  const snap = { ...sync.snapshot(), room:'' };
  const json = JSON.stringify(snap);
  return btoa(unescape(encodeURIComponent(json))).replace(/=+$/, '');
}
function decodeState(str){
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);   // 补回被去掉的 base64 padding
  return JSON.parse(decodeURIComponent(escape(atob(padded))));
}
async function makeShareLink(){
  const url = location.origin + location.pathname + '#r=' + encodeState();
  // 先把面板渲染出来，再尝试写剪贴板。
  // 反过来的话，剪贴板被权限/无焦点阻塞时 await 不返回，用户会看到「点了没反应」。
  openSheet('form', `
    <div class="sheet-head"><h3>分享链接</h3><p>任何设备打开即导入，永久有效</p><button class="x" data-act="close"><svg class="ri" width="16" height="16"><use href="#i-close"></use></svg></button></div>
    <div class="sheet-body">
      <div class="field"><label>复制发给同学</label><textarea readonly style="min-height:110px;font-size:12px">${esc(url)}</textarea></div>
      <p class="hintline">链接较长是因为把组队 / 打卡 / 攻略都打包进去了。</p>
      <div class="btnrow"><button class="btn pri" data-act="copylink" data-link="${esc(url)}"><svg class="ri" width="16" height="16"><use href="#i-copy"></use></svg>复制链接</button></div>
    </div>`);
  try{
    await navigator.clipboard.writeText(url);
    toast(url.length > 8000 ? '链接较长，已复制（建议用云端房间发送）' : '分享链接已复制');
  }catch{ toast('链接已生成，点下方按钮复制'); }
}
