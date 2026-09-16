/* 周末探索 · calendar.js —— 日历（假期 / 调休 / 天气提醒）
 *
 * 由 index.html 拆分而来（index.html 的 <script>）。每个文件对应原文件里的一个注释模块，
 * 内容是搬运而非重写。要改某个功能，改对应文件即可，不用翻整个 index.html。
 */

/* ---------------- 13b. 日历（假期 / 调休 / 天气提醒） ---------------- */
let calYM = null;                       // {y, m}
function renderCalendar(){
  const grid = $('#calGrid'); if(!grid) return;
  const today = ymd(new Date());
  if(!calYM){ const d = new Date(); calYM = { y:d.getFullYear(), m:d.getMonth() }; }
  const { y, m } = calYM;
  $('#calTitle').textContent = `${y} 年 ${m + 1} 月`;

  const lead = (new Date(y, m, 1).getDay() + 6) % 7;      // 周一为第一列
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for(let i = lead; i > 0; i--) cells.push({ date: ymd(new Date(y, m, 1 - i)), out: true });
  for(let i = 1; i <= days; i++) cells.push({ date: ymd(new Date(y, m, i)), out: false });
  while(cells.length % 7){
    const last = toDate(cells[cells.length - 1].date); last.setDate(last.getDate() + 1);
    cells.push({ date: ymd(last), out: true });
  }
  const wxMap = {};
  (weather ? weather.days : []).forEach(w => { wxMap[w.date] = w; });

  grid.innerHTML = cells.map(c => {
    const dt = toDate(c.date), dow = dt.getDay();
    const hol = holidayOf(c.date), shift = isWorkShift(c.date);
    const wk = !shift && (dow === 0 || dow === 6);
    const cls = ['cal-day'];
    if(c.out) cls.push('out');
    if(hol) cls.push('hol'); else if(shift) cls.push('work'); else if(wk) cls.push('wk');
    if(c.date === today) cls.push('today');
    const wx = wxMap[c.date];
    return `<div class="${cls.join(' ')}">
      <span class="num">${dt.getDate()}</span>
      ${wx ? `<span class="wx">${wx.emoji}${wx.tmax}°</span>` : ''}
      ${hol ? `<span class="tag">${hol.name}</span>` : (shift ? `<span class="hint">上班</span>` : '')}
    </div>`;
  }).join('');

  // 页头摘要
  const satOff = weekendOffset(1);
  $('#calHint').textContent = satOff === 0 ? '本周六就是今天' : `距离周末还有 ${satOff} 天`;

  // 提醒：原来是一条条整行的大色块，太占地方。现在压成一行内联胶囊，
  // 长尾信息（具体天气描述、降水概率、假期起止）放 title，鼠标悬停仍能看到。
  const alerts = [];
  WORK_SHIFT.forEach(w => {
    const dd = dayDiff(today, w);
    if(dd >= 0 && dd <= 14)
      alerts.push({ cls:'warn', icon:'i-bell', title:'这天调休上班，别忘了定闹钟',
        text:`${md(w)}（${WEEK_CN[toDate(w).getDay()]}）调休上班` });
  });
  const next = HOLIDAYS.find(h => h.end >= today);
  if(next){
    const dd = dayDiff(today, next.start), len = dayDiff(next.start, next.end) + 1;
    alerts.push({ cls:'hot', icon:'i-calendar', title:`${next.name}：${next.start} 至 ${next.end}，共 ${len} 天`,
      text: dd <= 0 ? `${next.name}假期进行中` : `距「${next.name}」还有 ${dd} 天` });
  }
  [['周六', weekendOffset(1)], ['周日', weekendOffset(2)]].forEach(([label, off]) => {
    const w = weather && weather.days[off];
    if(!w) return;
    const shift = isWorkShift(w.date), wet = isWet(w);
    alerts.push({ cls: shift ? 'warn' : (wet ? 'warn' : ''), icon:'i-info',
      title:`${w.label}，降水概率 ${w.pop}%`,
      text:`${md(w.date)} ${label} ${w.tmin}~${w.tmax}° · ${shift ? '调休上班' : (wet ? '建议室内' : '适合出门')}` });
  });
  $('#calAlerts').innerHTML = alerts.map(a =>
    `<div class="cal-alert ${a.cls}"${a.title ? ` title="${esc(a.title)}" data-tip="${esc(a.title)}"` : ''}>`
    + `<svg class="ri" width="14" height="14"><use href="#${a.icon}"></use></svg><span>${esc(a.text)}</span></div>`).join('');

  // 假期清单：7 张卡片改成两列紧凑列表，一屏放得下
  $('#holidayList').innerHTML = HOLIDAYS.map(h => {
    const len = dayDiff(h.start, h.end) + 1;
    const wk = h.work.length ? `调休 ${h.work.map(md).join('、')} 上班` : '无调休';
    const cls = h.end < today ? ' past' : (today >= h.start ? ' now' : '');
    return `<div class="cal-hol${cls}">
      <b>${h.name}</b><span class="d">${md(h.start)} – ${md(h.end)}</span>
      <span class="m">${len} 天 · ${wk}</span>
    </div>`;
  }).join('');
}
function calStep(delta){
  calYM.m += delta;
  if(calYM.m < 0){ calYM.m = 11; calYM.y--; }
  if(calYM.m > 11){ calYM.m = 0; calYM.y++; }
  renderCalendar();
}
