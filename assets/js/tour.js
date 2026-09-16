/* 周末探索 · tour.js —— 新手引导（「关于」页的两块内容 + 全屏逐步引导）
 *
 * 由 index.html 拆分而来（原文件里的注释模块），内容为搬运 / 新增。
 *
 * 两条产品约定（v2.9 起）：
 *   1. 「关于」页有两块内容：**新手指引**（默认给第一次来的人看）与**项目说明**（原来的 README 内容）
 *   2. 第一次访问网站会**强制**走一遍逐步引导（全屏遮罩 + 高亮）；看完/跳过之后
 *      「关于」页默认显示项目说明；引导随时可以在「关于 → 新手指引」回放
 *
 * TOUR 是引导步骤的唯一数据源：关于页里的步骤预览列表就是它渲染出来的，
 * 加一步只要在这里加一条，两边自动一致。
 */

/* ---------------- 17. 新手引导 ---------------- */

/* 每一步：page = 先切到哪个页面；targets = 高亮的元素（从上到下取第一个可见的，
   都不可见就退化成居中卡片）；title / short / text = 文案，short 只用在步骤预览列表里。 */
const TOUR = [
  { page: 'feed', targets: [], title: '欢迎来到周末探索', short: '先看一眼整体',
    text: '这是一个帮你决定「这个周末去哪儿」的小工具：按天气、预算、同行人数推荐活动，还能组队、打卡、写攻略。花 1 分钟跟着高亮走一遍，你就都会了。' },
  { page: 'feed', targets: ['#weatherBar'], title: '这周末的天气和假期', short: '天气 + 假期倒计时',
    text: '顶部这条是本周六、周日的真实天气预报，旁边还会告诉你距离周末、距离下一个法定假期还有几天，以及有没有调休要上班。' },
  { page: 'feed', targets: ['#catbar'], title: '先挑一个喜欢的类型', short: '按类型筛选',
    text: '想安静看展，还是想出门暴走？点这里先按类型筛一遍。右边的搜索框可以直接搜活动名，也可以搜攻略标签。' },
  { page: 'feed', targets: ['.toolrow'], title: '挑不动就让工具帮你', short: '换一批 / 筛选',
    text: '「换一批」换一组推荐；「筛选」能改城市、预算、同行人数、可支配时长 —— 改完匹配度和推荐理由会立刻重算。' },
  { page: 'feed', targets: ['#feed .note'], title: '卡片随便点哪都能打开', short: '看详情 / 收藏',
    text: '卡片上的百分比是它和你的偏好有多搭。点开能看到推荐理由和风险提示；点心形是收藏，收藏过的活动都收在「我的」页。' },
  { page: 'team', targets: ['#teamList .row-card', '#teamList'], title: '一个人不想去？发个队', short: '组队出发',
    text: '看中哪个活动就发一条队伍，写上时间和人均预算；把邀请文案复制到群里，同学点进来就能加入。' },
  { page: 'checkin', targets: ['#ckStats'], title: '去过了就打个卡', short: '打卡记录',
    text: '记下地点、花费、时长和心情。去过几个地方、一共花了多少，这里会自动帮你统计。' },
  { page: 'guide', targets: ['#guideList .row-card', '#guideList'], title: '攻略广场：别人踩过的坑', short: '看攻略 / 写攻略',
    text: '路线、避坑、人均预算都能在这儿找。玩得不错也可以自己写一篇；标签点一下就会跳回首页按这个标签筛。' },
  { page: 'calendar', targets: ['#calGrid'], title: '假期页：哪几天放假', short: '放假与调休',
    text: '按周一开始的月历，把周末、法定假期、调休上班的日子都标出来了，格子里还带着那几天的天气 —— 安排出行先看这一页。' },
  { page: 'me', targets: ['#meStats', '#meMore'], title: '你的数据都在这里', short: '我的',
    text: '统计、收藏、发布入口都收在这一页。想让手机和电脑看到同一份数据，就点「跨设备同步」建个房间，把 6 位房间码发给同学。' },
  { page: 'about', targets: ['#aboutTabs'], title: '随时可以回来看', short: '回放引导',
    text: '这份引导就在「关于」页里，以后想再看一遍，点这里就行。旁边的「项目说明」里有技术栈、数据来源和已知限制。' }
];

const hasGuided  = () => !!load(LS.guided, 0);
const markGuided = () => save(LS.guided, 1);

let tourOn = false;       // 遮罩是否在跑
let tourManual = false;   // 是用户自己在「关于」页点开的回放，还是首次访问的强制引导
let tourIdx = 0;          // 当前第几步
let tourSeq = 0;          // 每次换步 +1：异步流程中途被打断时用它作废旧任务
let aboutTab = null;      // null = 还没选过，按「是否看过引导」决定默认标签

/* ---------------- 关于页：两块内容 ---------------- */
function setAboutTab(t){
  aboutTab = t;
  $$('#aboutTabs .atab').forEach(b => b.classList.toggle('on', b.dataset.atab === t));
  const g = $('#aboutGuide'), r = $('#aboutReadme');
  if(g) g.hidden = (t !== 'guide');
  if(r) r.hidden = (t !== 'readme');
}
// go('about') 时由 router 调用：没看过引导的人先落在「新手指引」，看过的落在「项目说明」
function renderAbout(){
  if(aboutTab === null) aboutTab = hasGuided() ? 'readme' : 'guide';
  setAboutTab(aboutTab);
}
function renderGuideSteps(){
  const box = $('#guideSteps');
  if(!box) return;
  box.innerHTML = TOUR.map((s, i) => `<button class="gstep" data-gi="${i}">
      <span class="gnum">${i + 1}</span>
      <span class="gtxt"><b>${esc(s.title)}</b><small>${esc(s.short)}</small></span>
      <svg class="ri ar" width="14" height="14"><use href="#i-arrow"></use></svg>
    </button>`).join('');
}

/* ---------------- 全屏逐步引导 ---------------- */
const sleep = ms => new Promise(r => setTimeout(r, ms));

// 取第一个「真的可见」的元素：移动端侧栏是 display:none，桌面端「我的 → 更多」也是
function firstVisible(sels){
  for(const s of sels || []){
    const el = typeof s === 'string' ? $(s) : s;
    if(!el) continue;
    const r = el.getBoundingClientRect();
    if(r.width > 2 && r.height > 2) return el;
  }
  return null;
}
// 程序化滚动（不用 scrollIntoView：引导期间 html 是 overflow:hidden，自己算更可控）
function centerOn(el){
  const r = el.getBoundingClientRect(), vh = window.innerHeight;
  // 目标放得下就大致居中（最多往下推 90px，给顶部留点呼吸）；
  // 比视口还高的就贴顶 —— 用 max(56, …) 那种写法会把高元素的下半截顶出屏幕。
  const slack = Math.max(0, vh - r.height);
  const off = Math.min(Math.max(slack / 2, 16), 90);
  const want = r.top + window.scrollY - off;
  const max = Math.max(0, document.documentElement.scrollHeight - vh);
  window.scrollTo(0, Math.max(0, Math.min(max, want)));
}
function place(st){
  const wrap = $('#tour'), hole = $('#tourHole'), tip = $('#tourTip');
  if(!wrap || !hole || !tip) return;
  const vw = window.innerWidth, vh = window.innerHeight, PAD = 6, GAP = 10, M = 4;
  const el = firstVisible(st.targets);
  const r = el && el.getBoundingClientRect();
  // 目标必须在视口里才挖洞；否则退化成居中卡片
  const hit = !!r && r.bottom > 6 && r.top < vh - 6 && r.right > 6 && r.left < vw - 6;
  // 目标比视口还大时只圈住可见的那部分，否则整屏都被照亮、等于没高亮
  const box = hit ? {
    left: Math.max(r.left - PAD, M),
    top: Math.max(r.top - PAD, M),
    right: Math.min(r.right + PAD, vw - M),
    bottom: Math.min(r.bottom + PAD, vh - M),
  } : null;
  if(box){
    hole.hidden = false;
    hole.style.left   = Math.round(box.left) + 'px';
    hole.style.top    = Math.round(box.top) + 'px';
    hole.style.width  = Math.round(box.right - box.left) + 'px';
    hole.style.height = Math.round(box.bottom - box.top) + 'px';
  } else {
    hole.hidden = true;
  }
  // 挖不出洞的那几步，改用整层底色压暗
  wrap.classList.toggle('dim', !box);
  const tw = tip.offsetWidth, th = tip.offsetHeight;      // 文案要先写好，这里量出来才准
  const tall = !!box && (box.bottom - box.top) > vh * 0.5;  // 高亮区太高就贴底放，别盖在中间
  let top;
  if(tall) top = vh - th - 14;
  else if(box && box.bottom + GAP + th <= vh - 8) top = box.bottom + GAP;      // 高亮区下方
  else if(box && box.top - GAP - th >= 8) top = box.top - GAP - th;            // 高亮区上方
  else top = (vh - th) / 2;                                                    // 居中兜底
  const mid = box ? (box.left + box.right) / 2 : vw / 2;
  tip.style.left = Math.round(Math.max(8, Math.min(vw - tw - 8, mid - tw / 2))) + 'px';
  tip.style.top  = Math.round(Math.max(8, Math.min(vh - th - 8, top))) + 'px';
}
async function showStep(i){
  const seq = ++tourSeq;
  if(i < 0) i = 0;
  if(i >= TOUR.length) return endTour(true);
  tourIdx = i;
  const st = TOUR[i];
  if(st.page) go(st.page);
  const el = firstVisible(st.targets);
  if(el) centerOn(el);
  // 文案先写好，place() 才能量到正确的卡片高度
  $('#tourStepNo').textContent = `第 ${i + 1} / ${TOUR.length} 步`;
  $('#tourTitle').textContent = st.title;
  $('#tourText').textContent = st.text;
  $('#tourPrev').disabled = (i === 0);
  $('#tourNext').textContent = (i === TOUR.length - 1) ? '完成' : '下一步';
  if(seq !== tourSeq || !tourOn) return;
  place(st);
  await sleep(60);                        // 等这一帧的布局/滚动落定，再对一次位
  if(seq !== tourSeq || !tourOn) return;
  place(st);
}
function startTour(from = 0, manual = false){
  const wrap = $('#tour');
  if(!wrap || tourOn) return;
  tourOn = true;
  tourManual = manual;
  wrap.hidden = false;
  document.documentElement.classList.add('touring');
  showStep(from);
}
function endTour(markSeen = true){
  if(markSeen) markGuided();
  if(!tourOn) return;
  tourOn = false; tourSeq++;              // 让还在飞的那一步失效
  const manual = tourManual;
  tourManual = false;
  const wrap = $('#tour');
  if(wrap) wrap.hidden = true;
  document.documentElement.classList.remove('touring');
  // 首次访问的强制引导看完/跳过之后：不管当时停在哪个页面，「关于」页都该落到项目说明
  // （用户自己在引导面板里点开的重放不算 —— 他显然还想看引导，别把他的标签切走）
  if(!manual && aboutTab !== 'readme') setAboutTab('readme');
}
// 首次访问：强制走一遍。分享链接 / #/note 深链说明用户有明确目的，不打断他
function maybeStartTour(){
  renderGuideSteps();
  renderAbout();
  if(hasGuided() || location.hash) return;
  startTour(0);
}

/* ---------------- 静态绑定 ---------------- */
$$('#aboutTabs .atab').forEach(b => b.addEventListener('click', () => { buzz(); setAboutTab(b.dataset.atab); }));
const play = $('#guidePlay');
if(play) play.addEventListener('click', () => startTour(0, true));      // 手动重放
const steps = $('#guideSteps');
if(steps) steps.addEventListener('click', e => {
  const b = e.target.closest('.gstep');
  if(b) startTour(+b.dataset.gi, true);   // 想直接看某一步就点那一条（手动重放）
});
const bind = (sel, fn) => { const el = $(sel); if(el) el.addEventListener('click', fn); };
bind('#tourSkip', () => endTour(true));
bind('#tourPrev', () => showStep(tourIdx - 1));
bind('#tourNext', () => showStep(tourIdx + 1));
window.addEventListener('keydown', e => {
  if(!tourOn) return;
  if(e.key === 'Escape') endTour(true);
  else if(e.key === 'ArrowRight' || e.key === 'Enter'){ e.preventDefault(); showStep(tourIdx + 1); }
  else if(e.key === 'ArrowLeft') showStep(tourIdx - 1);
});
window.addEventListener('resize', () => { if(tourOn) place(TOUR[tourIdx]); });
window.addEventListener('scroll', () => { if(tourOn) place(TOUR[tourIdx]); }, { passive: true });
renderGuideSteps();
