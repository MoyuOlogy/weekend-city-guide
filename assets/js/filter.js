/* 周末探索 · filter.js —— 筛选面板
 *
 * 由 index.html 拆分而来（index.html 的 <script>）。每个文件对应原文件里的一个注释模块，
 * 内容是搬运而非重写。要改某个功能，改对应文件即可，不用翻整个 index.html。
 */

/* ---------------- 8. 筛选面板 ---------------- */
function openFilter(){
  openSheet('form', `
    <div class="sheet-head"><h3>筛选与偏好</h3><p>改任意一项，推荐立刻重排</p><button class="x" data-act="close"><svg class="ri" width="16" height="16"><use href="#i-close"></use></svg></button></div>
    <div class="sheet-body">
      <div class="two-col">
        <div class="field"><label>城市</label><select id="fCity">${Object.keys(CITIES).map(c => `<option ${c === prefs.city ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
        <div class="field"><label>哪天出发</label><select id="fDay">
          <option value="1" ${prefs.day === 1 ? 'selected' : ''}>本周六</option>
          <option value="2" ${prefs.day === 2 ? 'selected' : ''}>本周日</option></select></div>
      </div>
      <div class="field"><label>人均预算：<b id="budgetVal">${prefs.budget}</b> 元</label>
        <input type="range" id="fBudget" min="0" max="400" step="10" value="${prefs.budget}" /></div>
      <div class="field"><label>同行人数：<b id="peopleVal">${prefs.people}</b> 人</label>
        <input type="range" id="fPeople" min="1" max="12" step="1" value="${prefs.people}" /></div>
      <div class="field"><label>可支配时长</label><div class="chips" id="fHours">
        ${[[2,'2 小时'],[4,'半天'],[9,'一整天']].map(([v, t]) => `<div class="chip ${prefs.hours === v ? 'on' : ''}" data-hours="${v}">${t}</div>`).join('')}
      </div></div>
      <div class="field"><label>想玩什么（可多选）</label><div class="chips" id="fTypes">
        ${TYPES.map(t => `<div class="chip ${prefs.types.includes(t) ? 'on' : ''}" data-type="${t}">${TYPE_EMOJI[t]} ${t}</div>`).join('')}
      </div></div>
      <div class="field"><label>额外偏好</label><div class="chips" id="fExtra">
        ${[['near','离我近一点'],['cheap','越省越好'],['photo','适合出片'],['newbie','新手友好']]
          .map(([k, t]) => `<div class="chip ${prefs.extras.includes(k) ? 'on' : ''}" data-extra="${k}">${t}</div>`).join('')}
      </div></div>
      <div class="form-actions"><button class="btn block line" id="resetPrefs">恢复默认</button></div>
    </div>`);
}
