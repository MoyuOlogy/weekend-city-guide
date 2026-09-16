/* 周末探索 · feed.js —— 信息流 / 点赞 / 天气条
 *
 * 由 index.html 拆分而来（index.html 的 <script>）。每个文件对应原文件里的一个注释模块，
 * 内容是搬运而非重写。要改某个功能，改对应文件即可，不用翻整个 index.html。
 */

/* ---------------- 5. 信息流 ---------------- */
let cat = '全部', keyword = '';
function visibleActivities(){
  const w = targetWeather();
  return activityLib().map(a => ({ a, ...scoreActivity(a, w) }))
    .filter(x => (cat === '全部' || x.a.type === cat))
    .filter(x => {
      if(!keyword) return true;
      const k = keyword.toLowerCase();
      return (x.a.name + x.a.desc + x.a.type + x.a.tags.join(' ')).toLowerCase().includes(k);
    })
    .sort((x, y) => y.score - x.score);
}
/* 点赞：store.likes[活动id][昵称] = 时间戳（正=已赞，负=取消赞），
   合并时同一昵称取时间戳绝对值更大的一条 —— 每人最后一次操作生效，无需墓碑 */
const likeMap = id => store.likes[id] || {};
const likeList = id => Object.entries(likeMap(id)).filter(([, v]) => v > 0).map(([n]) => n);
const likeCount = id => likeList(id).length;
const iLiked = id => (likeMap(id)[myNick()] || 0) > 0;

function renderFeed(){
  const feed = $('#feed');
  if(!weather){ feed.innerHTML = skeleton(); return; }
  const list = visibleActivities();
  const shown = list.slice(0, 24);
  $('#feedCount').textContent = `${prefs.city} · ${prefs.day === 1 ? '周六' : '周日'} · ${shown.length} 个推荐`;
  if(!shown.length){
    feed.innerHTML = `<div class="empty" style="flex:1">
      <svg class="big"><use href="#i-search"></use></svg>没有匹配的活动<br>换个关键词或放宽筛选条件试试</div>`;
    return;
  }
  const cols = colCount();
  const buckets = Array.from({ length: cols }, () => []);
  shown.forEach((x, i) => buckets[i % cols].push(cardHTML(x, i)));
  feed.innerHTML = buckets.map(b => `<div class="mcol">${b.join('')}</div>`).join('');
  observeIn();

  /* 卡片结构：cover / title / author-wrapper / like-wrapper
     封面与标题是真正的 <a href="#/note/id"> 链接：可分享、可中键新开标签页、支持浏览器前进后退 */
  function cardHTML(x, i){
    const a = x.a, liked = iLiked(a.id), h = coverHeights[hash(a.id) % coverHeights.length];
    const href = `#/note/${a.id}`, link = `href="${href}" data-note="${a.id}"`;
    return `<article class="note" data-id="${a.id}">
      <a class="cover" ${link} style="height:${h}px;background:linear-gradient(135deg,${coverGrad(a).join(',')})">
        ${coverDecor(a)}
        <span class="emo">${TYPE_EMOJI[a.type] || '🎈'}</span>
        <span class="badge bl ${a.price === 0 ? 'free' : ''}">${a.price === 0 ? '免费' : '¥' + a.price}</span>
        <span class="badge tr">${x.score}% 匹配</span>
      </a>
      <div class="footer">
        <a class="title" ${link}>${esc(a.name)}</a>
        <div class="author-wrapper">
          <a class="author" ${link}>
            <span class="avatar-container">${me.emoji}</span>
            <span class="name">${esc(a.type)} · ${esc(prefs.people)}人 · ${a.dist}km</span>
          </a>
          <span class="like-wrapper ${liked ? 'on' : ''}" data-act="like" data-id="${a.id}">
            <svg class="ri" width="16" height="16"><use href="#${liked ? 'i-liked' : 'i-like'}"></use></svg>
            <span class="count">${likeCount(a.id)}</span>
          </span>
        </div>
      </div>
    </article>`;
  }
  function skeleton(){
    const sk = `<div class="sk"><div class="a"></div><div class="b"></div><div class="c"></div><div class="d"></div></div>`;
    return `<div class="mcol">${sk}${sk}</div><div class="mcol">${sk}${sk}</div>`;
  }
}
function observeIn(){
  // 纯增强：默认已可见，IO 只负责在元素进入视口时补一个入场动画。
  // 即使 IO 不回调 / 不支持，页面内容也照样完整可见。
  if(!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((es, o) => {
    es.forEach(e => { if(e.isIntersecting){ e.target.classList.add('anim'); o.unobserve(e.target); } });
  }, { rootMargin:'80px' });
  $$('.note:not(.anim), .row-card:not(.anim)').forEach(el => io.observe(el));
}
function renderWeatherBar(){
  const bar = $('#weatherBar');
  if(!weather){ bar.textContent = '正在获取天气…'; return; }
  const sat = weather.days[weekendOffset(1)], sun = weather.days[weekendOffset(2)];
  // 每天一个胶囊：天气图标 + 周六/周日 + 日期 + 温度 + 降水。完整描述和降水放 title。
  const dayChip = (w, label) => {
    if(!w) return '';
    const shift = isWorkShift(w.date), hol = holidayOf(w.date);
    const tip = `${w.label} · 降水概率 ${w.pop}%` + (shift ? ' · 这天调休上班' : '');
    // title 给桌面悬停，data-tip 给触屏点按 —— 手机上没有悬停，只有 title 等于没这个信息
    return `<span class="wchip wday${shift ? ' shift' : ''}" title="${esc(tip)}" data-tip="${esc(tip)}">
      <span class="we">${w.emoji}</span>
      <span>${hol ? hol.name : label}</span>
      <span class="wd">${md(w.date)}</span>
      <span class="wt">${w.tmin}~${w.tmax}°</span>
      <span class="wn">降水 ${w.pop}%</span>
    </span>`;
  };
  const today = ymd(new Date());
  const next = HOLIDAYS.find(h => h.end >= today);
  const satOff = weekendOffset(1);
  const weekTxt = satOff === 0 ? '就是今天' : (satOff === 1 ? '明天' : `${satOff} 天`);
  let holTxt = '今年假期已过完';
  if(next){
    const dd = dayDiff(today, next.start);
    holTxt = dd <= 0 ? `${next.name}假期进行中` : `距「${next.name}」<b>${dd}</b> 天`;
  }
  const shiftSoon = WORK_SHIFT.filter(w => { const dd = dayDiff(today, w); return dd >= 0 && dd <= 7; });
  const wetWeekend = isWet(sat) || isWet(sun);
  bar.innerHTML = `
    <span class="wchip city" title="天气按这个城市取" data-tip="天气按这个城市取，可在「筛选」里改"><svg class="ri" width="14" height="14"><use href="#i-pin"></use></svg>${esc(prefs.city)}</span>
    ${dayChip(sat, '周六')}${dayChip(sun, '周日')}
    <span class="wchip meta">距周末 <b>${weekTxt}</b> · ${holTxt}</span>
    <span class="wchip meta">${wetWeekend ? '☔ 优先室内' : '☀️ 适合户外'}</span>
    ${shiftSoon.length ? `<span class="wchip shift"><svg class="ri" width="14" height="14"><use href="#i-bell"></use></svg>${md(shiftSoon[0])} ${WEEK_CN[toDate(shiftSoon[0]).getDay()]} 调休上班</span>` : ''}`;
}
