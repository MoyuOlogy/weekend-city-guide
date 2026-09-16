/* 周末探索 · publish.js —— 发布面板（组队/打卡/攻略/活动）
 *
 * 由 index.html 拆分而来（index.html 的 <script>）。每个文件对应原文件里的一个注释模块，
 * 内容是搬运而非重写。要改某个功能，改对应文件即可，不用翻整个 index.html。
 */

/* ---------------- 9. 发布面板 ---------------- */
function openPublish(kind){
  const body = { team: pubTeam, checkin: pubCheckin, guide: pubGuide, activity: pubActivity }[kind] || pubPicker;
  openSheet('form', `
    <div class="sheet-head"><h3>${kind ? { team:'发起组队', checkin:'记录打卡', guide:'写一篇攻略', activity:'添加活动' }[kind] : '发布'}</h3>
      <p>${kind ? '发布后会同步到你的云端房间' : '选择你想发布的内容'}</p>
      <button class="x" data-act="close"><svg class="ri" width="16" height="16"><use href="#i-close"></use></svg></button></div>
    <div class="sheet-body">${body()}</div>`);
}
const pubPicker = () => `<div class="pubgrid">
    <button data-act="pub" data-kind="team"><svg class="ri" width="26" height="26"><use href="#i-team"></use></svg><b>组队</b></button>
    <button data-act="pub" data-kind="checkin"><svg class="ri" width="26" height="26"><use href="#i-pin"></use></svg><b>打卡</b></button>
    <button data-act="pub" data-kind="guide"><svg class="ri" width="26" height="26"><use href="#i-doc"></use></svg><b>攻略</b></button>
    <button data-act="pub" data-kind="activity"><svg class="ri" width="26" height="26"><use href="#i-create"></use></svg><b>活动</b></button>
  </div>
  <p class="hintline" style="margin-top:14px">提示：组队和攻略会同步给房间里的同伴，打卡只有你自己能看到（也会同步到你的其他设备）。</p>`;
const pubTeam = () => `
  ${nickField()}
  <div class="field"><label>活动 / 目的地</label><input type="text" id="tTitle" placeholder="例如：周六下午桌游 + 咖啡" maxlength="40" /></div>
  <div class="field"><label>集合时间与地点</label><input type="text" id="tTime" placeholder="例如：周六 14:00 · 地铁 3 号线 B 口" maxlength="40" /></div>
  <div class="two-col">
    <div class="field"><label>招募人数（含自己）</label><input type="number" id="tCap" min="2" max="20" value="4" /></div>
    <div class="field"><label>人均预算（元）</label><input type="number" id="tBudget" min="0" max="2000" value="80" /></div>
  </div>
  <div class="form-actions"><button class="btn pri block" id="tCreate">发布组队</button></div>`;
const pubCheckin = () => `
  ${nickField()}
  <div class="field"><label>去了哪里</label><input type="text" id="cTitle" placeholder="例如：老城区创意市集" maxlength="40" /></div>
  <div class="three-col">
    <div class="field"><label>日期</label><input type="date" id="cDate" value="${ymd(new Date())}" /></div>
    <div class="field"><label>花费（元/人）</label><input type="number" id="cCost" min="0" max="5000" value="0" /></div>
    <div class="field"><label>时长（小时）</label><input type="number" id="cHours" min="0.5" max="24" step="0.5" value="2" /></div>
  </div>
  <div class="field"><label>心情</label><div class="chips" id="cMood">
    ${[['🤩','超值'],['😌','治愈'],['🥵','累但爽'],['😐','一般'],['😭','踩雷']]
      .map(([m, t], i) => `<div class="chip ${i === 0 ? 'on' : ''}" data-mood="${m}">${m} ${t}</div>`).join('')}
  </div></div>
  <div class="field"><label>一句话感想</label><textarea id="cNote" placeholder="有什么值得告诉后来人的？"></textarea></div>
  <div class="form-actions"><button class="btn pri block" id="cAdd">记录打卡</button></div>`;
const pubGuide = () => `
  ${nickField()}
  <div class="field"><label>标题</label><input type="text" id="gTitle" placeholder="例如：0 元逛完老城区的 5 个点" maxlength="50" /></div>
  <div class="field"><label>正文</label><textarea id="gBody" placeholder="路线、时间、避坑点、预算…" style="min-height:100px" maxlength="600"></textarea></div>
  <div class="field"><label>标签（逗号分隔）</label><input type="text" id="gTags" placeholder="免费, 拍照, 步行" maxlength="60" /></div>
  <div class="form-actions"><button class="btn pri block" id="gAdd">发布攻略</button></div>`;
const pubActivity = () => `
  <div class="field"><label>活动名称</label><input type="text" id="nName" placeholder="例如：大学城天台看日落" maxlength="40" /></div>
  <div class="two-col">
    <div class="field"><label>类型</label><select id="nType">${TYPES.map(t => `<option>${t}</option>`).join('')}</select></div>
    <div class="field"><label>人均价格（元）</label><input type="number" id="nPrice" min="0" value="0" /></div>
  </div>
  <div class="three-col">
    <div class="field"><label>时长（小时）</label><input type="number" id="nHours" min="0.5" step="0.5" value="2" /></div>
    <div class="field"><label>距离（km）</label><input type="number" id="nDist" min="0" step="0.5" value="3" /></div>
    <div class="field"><label>最少人数</label><input type="number" id="nMin" min="1" value="1" /></div>
    <div class="field"><label>最多人数</label><input type="number" id="nMax" min="1" value="6" /></div>
  </div>
  <div class="field"><label>场地</label><div class="chips" id="nIndoor">
    <div class="chip on" data-indoor="0">🌤 户外</div><div class="chip" data-indoor="1">🏠 室内</div></div></div>
  <div class="field"><label>一句话介绍</label><textarea id="nDesc" placeholder="怎么玩、有什么亮点" maxlength="200"></textarea></div>
  <div class="form-actions"><button class="btn pri block" id="nAdd">加入活动库</button></div>`;
function nickField(){
  return `<div class="field"><label>昵称（显示给同伴）</label>
    <input type="text" id="nickInput" value="${esc(me.nick)}" placeholder="例如：小新" maxlength="12" /></div>`;
}
function pickNick(){
  const v = ($('#nickInput')?.value || '').trim();
  if(v){ me.nick = v; persistMe(); renderMe(); }
}
