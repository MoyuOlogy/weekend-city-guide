/* 周末探索 · store.js —— 数据层 + 示例数据 + 清空
 *
 * 由 index.html 拆分而来（index.html 的 <script>）。每个文件对应原文件里的一个注释模块，
 * 内容是搬运而非重写。要改某个功能，改对应文件即可，不用翻整个 index.html。
 */

/* ---------------- 1. 数据层 ---------------- */
const LS = { store:'wcg.store.v2', prefs:'wcg.prefs.v2', me:'wcg.me.v2', theme:'wcg.theme.v2', guided:'wcg.guided.v2' };
let store = load(LS.store, { teams:[], checkins:[], guides:[], activities:[], likes:{}, tomb:[] });
store.teams ||= []; store.checkins ||= []; store.guides ||= [];
store.activities ||= []; store.likes ||= {}; store.tomb ||= [];
let me = load(LS.me, { nick:'', emoji:'🙂', room:'', joined:0 });
const persistStore = () => save(LS.store, store);

// 兼容 v1 数据
(function migrate(){
  if(localStorage.getItem(LS.store)) return;
  const t = load('wcg.teams.v1', []), c = load('wcg.checkins.v1', []), g = load('wcg.guides.v1', []);
  if(!t.length && !c.length && !g.length) return;
  store.teams = t; store.checkins = c;
  store.guides = g.map(x => ({ ...x, likedBy: Array(Math.max(0, x.likes|0)).fill('旧数据') }));
  persistStore();
})();

const DEFAULT_PREFS = { city:'上海', day:1, budget:150, people:3, hours:4, types:[], extras:[], plat:'展板' };
let prefs = Object.assign({}, DEFAULT_PREFS, load(LS.prefs, {}));
if(!localStorage.getItem(LS.prefs)) prefs.day = new Date().getDay() === 0 ? 2 : 1;
const persistPrefs = () => save(LS.prefs, prefs);
const persistMe = () => save(LS.me, me);
const myNick = () => me.nick || '我';

/* ---------------- 1b. 首次访问的示例数据 ----------------
   目的：组队 / 打卡 / 攻略 / 我的 四个页面不要一进来就是空白。
   每条都带 demo:true，列表里有「示例」角标，我的页可一键清除。 */
const DEMO_NICK = '周末探索者';
const dayFrom = n => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };
function seedDemo(){
  if(localStorage.getItem(LS.store)) return;        // 已有本地数据（含从 v1 迁移的）就不再塞
  if(!me.nick){ me.nick = DEMO_NICK; me.emoji = '🙂'; persistMe(); }
  const nick = me.nick, T = Date.now(), D = 86400000;
  store.teams = [
    { id:'demo-t1', demo:true, owner:'阿哲', title:'周六下午桌游 + 咖啡局', time:'周六 14:00 · 大学城地铁站 B 口',
      cap:6, budget:60, members:['阿哲','小满','Kiki'], ts:T - 3*D },
    { id:'demo-t2', demo:true, owner:'Luna', title:'周日爬云顶步道看日出', time:'周日 05:30 · 南门集合（拼车）',
      cap:8, budget:45, members:['Luna','大熊','阿哲','小满','Nemo'], ts:T - 2*D },
    { id:'demo-t3', demo:true, owner:nick, title:'老城区市集 + 街头摄影 Citywalk', time:'周六 10:00 · 老城区牌坊下',
      cap:5, budget:30, members:[nick,'Kiki'], ts:T - D }
  ];
  store.checkins = [
    { id:'demo-c1', demo:true, owner:nick, title:'老城区周末创意市集', date:dayFrom(-6), cost:25, hours:2, mood:'🤩',
      note:'糖油粑粑比想象中好吃，二楼有家旧唱片摊能淘到好东西。', ts:T - 6*D },
    { id:'demo-c2', demo:true, owner:nick, title:'市立美术馆 · 当代艺术特展', date:dayFrom(-9), cost:30, hours:2.5, mood:'😌',
      note:'学生证半价；工作日下午人少，露台咖啡能看到整片老城。', ts:T - 9*D },
    { id:'demo-c3', demo:true, owner:nick, title:'江畔日落夜骑', date:dayFrom(-13), cost:0, hours:1.5, mood:'🥵',
      note:'全程平路 12km，日落那一小时最美，记得带头灯。', ts:T - 13*D },
    { id:'demo-c4', demo:true, owner:nick, title:'大学城天台看日落', date:dayFrom(-20), cost:0, hours:1, mood:'😐',
      note:'入口有点难找，保安会赶人，建议 6 点前上去。', ts:T - 20*D }
  ];
  store.guides = [
    { id:'demo-g1', demo:true, author:nick, date:dayFrom(-5), title:'0 元逛完老城区的 5 个点',
      body:'路线：老城牌坊 → 骑楼老街 → 免费展览馆 → 江边栈道 → 天台看日落，全程步行约 6km，中途有两处免费饮水点。\n避坑：周末 11 点后市集人挤人，想拍照建议 9 点前到；展览馆周一闭馆。',
      tags:['免费','步行','拍照'], likedBy:['阿哲','Luna','Kiki'], ts:T - 5*D },
    { id:'demo-g2', demo:true, author:'Luna', date:dayFrom(-8), title:'云顶步道避坑：千万别中午上山',
      body:'爬升 400m，全程 3 小时左右。\n一定 8 点前出发——10 点后山顶没有任何遮挡，晒到怀疑人生。\n带 1.5L 水 + 盐丸，山上小卖部一瓶水 8 块。\n下撤走西线台阶，比原路返回省 40 分钟。',
      tags:['徒步','避坑','周末'], likedBy:['大熊','阿哲'], ts:T - 8*D },
    { id:'demo-g3', demo:true, author:'小满', date:dayFrom(-11), title:'学生党约会 3 个不踩雷方案（人均 100 内）',
      body:'① 下午美术馆（学生票 30）+ 旁边手冲咖啡（40）：安静、好聊、能出片。\n② 傍晚江边夜骑 + 夜市小吃：不到 50，也不会太累。\n③ 雨天方案：桌游咖啡馆 45/人含饮品，有 DM 带玩不冷场。\n提醒：别选要长时间排队的网红店，第一次约会排队很尴尬。',
      tags:['约会','预算100','新手友好'], likedBy:['阿哲','Nemo','Kiki','Luna'], ts:T - 11*D }
  ];
  // 示例收藏（记住时间戳，清除示例数据时能精确识别、不误删用户真实点赞）
  store.demoLikes = { a2:{ [nick]: T - 7*D }, a6:{ [nick]: T - 6*D }, a9:{ [nick]: T - 4*D } };
  Object.assign(store.likes, store.demoLikes);
  persistStore();
}
const hasDemo = () => ['teams','checkins','guides'].some(k => (store[k] || []).some(x => x.demo));
function renderAll(){
  renderTeams(); renderCheckins(); renderGuides(); renderMe(); renderFeed();
  if(!$('#page-calendar').hidden) renderCalendar();
}
// 删除时写墓碑：下次同步会把删除也同步出去，
// 否则人在云端房间时，同伴/自己之前发布的数据会在 6 秒后被合并回来（"清了又回来了"）。
const bury = ids => { store.tomb = [...new Set([...(store.tomb || []), ...ids])].slice(-300); };
function clearDemo(){
  ['teams','checkins','guides'].forEach(k => {
    store[k] = (store[k] || []).filter(x => { if(x.demo){ bury([x.id]); return false; } return true; });
  });
  Object.entries(store.demoLikes || {}).forEach(([id, m]) => {
    Object.entries(m).forEach(([n, ts]) => { if(store.likes[id] && store.likes[id][n] === ts) delete store.likes[id][n]; });
  });
  delete store.demoLikes;
  persistStore(); sync.schedule(true); renderAll();
  toast('示例数据已清除（不会影响你自己发的内容）');
}
function clearAllData(){
  ['teams','checkins','guides','activities'].forEach(k => { bury((store[k] || []).map(x => x.id)); store[k] = []; });
  store.likes = {}; delete store.demoLikes;
  persistStore(); sync.schedule(true); renderAll();
  toast('已清空本机数据' + (me.room ? '，并已同步到房间' : ''));
}
