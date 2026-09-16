/* 周末探索 · sheet.js —— 弹层框架 + 详情弹层
 *
 * 由 index.html 拆分而来（index.html 的 <script>）。每个文件对应原文件里的一个注释模块，
 * 内容是搬运而非重写。要改某个功能，改对应文件即可，不用翻整个 index.html。
 */

/* ---------------- 6. 弹层框架 ---------------- */
const sheets = { detail:'#sheetDetail', form:'#sheetForm', sync:'#sheetSync' };
let openSheetName = null;
function openSheet(name, html){
  Object.entries(sheets).forEach(([k, sel]) => $(sel).classList.toggle('on', k === name));
  if(name){ $(sheets[name]).innerHTML = html; $('#mask').classList.add('on'); openSheetName = name; }
  else { $('#mask').classList.remove('on'); openSheetName = null; }
}
const closeSheet = () => {
  const wasNote = /^#\/note\//.test(location.hash);
  openSheet(null);
  if(wasNote) try{ history.replaceState(null, '', location.pathname); }catch{}   // 关掉详情时清掉 hash
};
$('#mask').addEventListener('click', () => closeSheet());
document.addEventListener('keydown', e => { if(e.key === 'Escape') openSheet(null); });

/* ---------------- 7. 详情弹层 ---------------- */
function openDetail(id){
  const a = findAct(id); if(!a) return;
  const w = targetWeather(), r = scoreActivity(a, w);
  const liked = iLiked(a.id);
  const why = r.reasons.map(t => `<b>✓ ${esc(t)}</b>`).join('') + r.warns.map(t => `<b class="w">! ${esc(t)}</b>`).join('');
  openSheet('detail', `
    <div class="sheet-head">
      <h3>活动详情</h3>
      <button class="x" data-act="close"><svg class="ri" width="16" height="16"><use href="#i-close"></use></svg></button>
    </div>
    <div class="sheet-body">
      <div class="dwrap">
        <div class="dcover" style="background:linear-gradient(135deg,${coverGrad(a).join(',')})">
          ${coverDecor(a)}
          <span class="emo">${TYPE_EMOJI[a.type] || '🎈'}</span>
          <span class="badge bl ${a.price === 0 ? 'free' : ''}">${a.price === 0 ? '免费' : '¥' + a.price + '/人'}</span>
          <span class="badge tr">${r.score}% 匹配</span>
        </div>
        <div class="dinfo">
          <h2 class="dtitle">${esc(a.name)}</h2>
          <div class="dmeta">
            <span>${esc(a.type)}</span>
            <span>${a.indoor ? '室内' : '户外'}</span>
            <span>约 ${a.hours}h</span>
            <span>${a.min}-${a.max} 人</span>
            <span>${a.dist}km</span>
          </div>
          <p class="dbody">${esc(a.desc)}</p>
          <div class="dsec"><h4>为什么推荐给你</h4><div class="why">${why}</div></div>
          <div class="dsec"><h4>建议时间</h4><div class="planbox">出发：<b>${esc(planTime(a))}</b><br>集合建议：提前 15 分钟到，人多的话先在群里定好地铁口。</div></div>
          <div class="dsec"><h4>标签</h4><div class="chips">${a.tags.map(t => `<span class="chip">#${esc(t)}</span>`).join('')}</div></div>
        </div>
      </div>
      <div class="actionbar">
        <button class="btn line" data-act="like" data-big="1" data-id="${a.id}">
          <svg class="ri" width="16" height="16" style="color:${liked ? 'var(--red)' : 'currentColor'}"><use href="#${liked ? 'i-liked' : 'i-like'}"></use></svg>
          ${liked ? '已赞' : '点赞'} ${likeCount(a.id)}</button>
        <button class="btn pri" data-act="quickteam" data-id="${a.id}">组队出发</button>
      </div>
      <div class="btnrow">
        <button class="btn line" data-act="quickcheckin" data-id="${a.id}"><svg class="ri" width="16" height="16"><use href="#i-pin"></use></svg>我去打卡</button>
        <button class="btn line" data-act="quickguide" data-id="${a.id}"><svg class="ri" width="16" height="16"><use href="#i-doc"></use></svg>写攻略</button>
        <button class="btn line" data-act="copyact" data-id="${a.id}"><svg class="ri" width="16" height="16"><use href="#i-copy"></use></svg>复制活动信息</button>
      </div>
    </div>`);
}
const likeActivity = (id, silent) => {
  const cur = likeMap(id), nick = myNick();
  const liked = (cur[nick] || 0) > 0;
  store.likes[id] = { ...cur, [nick]: liked ? -Date.now() : Date.now() };
  persistStore(); sync.schedule();
  if(!liked){ buzz(14); if(!silent) burstHeart(); }
  return !liked;
};
function burstHeart(){
  const b = $('#burst'); b.classList.remove('go'); void b.offsetWidth; b.classList.add('go');
}
