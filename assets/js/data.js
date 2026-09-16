/* 周末探索 · data.js —— 城市 / 活动库 / 分类 / 节假日
 *
 * 由 index.html 拆分而来（index.html 的 <script>）。每个文件对应原文件里的一个注释模块，
 * 内容是搬运而非重写。要改某个功能，改对应文件即可，不用翻整个 index.html。
 */

/* ---------------- 2. 城市 / 活动 / 天气 ---------------- */
const CITIES = {
  '北京':{lat:39.9042,lon:116.4074}, '上海':{lat:31.2304,lon:121.4737},
  '广州':{lat:23.1291,lon:113.2644}, '深圳':{lat:22.5431,lon:114.0579},
  '成都':{lat:30.5728,lon:104.0668}, '杭州':{lat:30.2741,lon:120.1551},
  '武汉':{lat:30.5928,lon:114.3055}, '西安':{lat:34.3416,lon:108.9398}
};
const BUILTIN = [
  { id:'a1',  name:'市立美术馆 · 当代艺术特展', type:'展览', price:60,  hours:2.5, dist:4.2, min:1, max:6,  indoor:true,  tags:['出片','冷气','文艺'], desc:'两层展厅 + 露台咖啡，凭学生证半价，周末需提前预约。' },
  { id:'a2',  name:'老城区周末创意市集',       type:'市集', price:0,   hours:2,   dist:3.1, min:1, max:8,  indoor:false, tags:['免费','小吃','淘货'], desc:'手作摊、独立唱片、二手书，边逛边吃，人多但不挤。' },
  { id:'a3',  name:'Livehouse 独立乐队现场',   type:'演出', price:120, hours:3,   dist:5.6, min:1, max:6,  indoor:true,  tags:['夜生活','乐队','出片'], desc:'小场地近距离，站票为主，记得带耳塞和现金。' },
  { id:'a4',  name:'城郊云顶步道短途徒步',     type:'徒步', price:20,  hours:5,   dist:18,  min:2, max:8,  indoor:false, tags:['爬山','体能','出片'], desc:'海拔爬升 400m，山顶视野开阔，建议 9 点前上山。' },
  { id:'a5',  name:'桌游主题咖啡馆',           type:'桌游', price:45,  hours:3,   dist:1.8, min:3, max:8,  indoor:true,  tags:['破冰','新手友好','雨天友好'], desc:'店内有主持 DM，人均 45 含一杯饮品，4 人以上最好提前订位。' },
  { id:'a6',  name:'江畔日落夜骑',             type:'夜骑', price:0,   hours:1.5, dist:2.4, min:1, max:6,  indoor:false, tags:['免费','运动','出片'], desc:'共享单车即可，全程平路 12km，日落前后最美。' },
  { id:'a7',  name:'陶艺手作体验课',           type:'手作', price:150, hours:2,   dist:3.6, min:1, max:4,  indoor:true,  tags:['手作','纪念品','安静'], desc:'拉坯 + 上釉，作品两周后自取或邮寄，很适合留纪念。' },
  { id:'a8',  name:'城市公园野餐 + 飞盘局',     type:'露营', price:0,   hours:3,   dist:6.5, min:4, max:12, indoor:false, tags:['免费','团建','晒太阳'], desc:'大草坪 + 树荫，4 人以上就能玩起来，自带垫子和水。' },
  { id:'a9',  name:'老书店 + 独立咖啡漫游',     type:'咖啡', price:40,  hours:2,   dist:2.2, min:1, max:3,  indoor:true,  tags:['安静','自习','慢生活'], desc:'两家老书店 + 一家手冲，适合一个人放空或两三人聊天。' },
  { id:'a10', name:'街头摄影 Citywalk',        type:'摄影', price:0,   hours:3,   dist:4.8, min:1, max:6,  indoor:false, tags:['免费','出片','走路'], desc:'老巷 → 骑楼 → 天桥 → 江边，黄金时段 16:30 出发。' },
  { id:'a11', name:'沉浸式小剧场演出',         type:'演出', price:180, hours:2.5, dist:7.2, min:2, max:4,  indoor:true,  tags:['文艺','约会','出片'], desc:'观众跟随演员移动，建议提前 20 分钟到场存包。' },
  { id:'a12', name:'露天音乐喷泉夜场',         type:'演出', price:0,   hours:1.5, dist:5.1, min:1, max:10, indoor:false, tags:['免费','夜景','亲子'], desc:'每晚 19:30 一场，提前 15 分钟占前排位置。' },
  { id:'a13', name:'近郊观星 + 天幕露营',      type:'露营', price:90,  hours:4,   dist:22,  min:2, max:8,  indoor:false, tags:['夜间','星空','近郊'], desc:'需自驾或拼车，带上防潮垫与红光手电筒。' },
  { id:'a14', name:'复古胶片冲洗工作坊',       type:'手作', price:80,  hours:2,   dist:3.3, min:1, max:4,  indoor:true,  tags:['小众','手作','安静'], desc:'自带一卷未冲洗胶卷，现场学会显影和扫描。' },
  { id:'a15', name:'VR / 电竞体验馆开黑',      type:'桌游', price:70,  hours:2,   dist:2.9, min:2, max:6,  indoor:true,  tags:['雨天友好','开黑','新手友好'], desc:'按小时计费，4 人联机最划算，周末晚场需排队。' },
  { id:'a16', name:'早市 + 城市早餐地图',      type:'市集', price:25,  hours:1.5, dist:1.5, min:1, max:4,  indoor:false, tags:['早起','美食','免费'], desc:'8 点前最热闹，一条街吃四样，人均不超过 30。' }
];
const TYPES = ['展览','市集','演出','徒步','桌游','咖啡','夜骑','手作','露营','摄影'];
const TYPE_EMOJI = { '展览':'🖼️','市集':'🧺','演出':'🎤','徒步':'⛰️','桌游':'🎲','咖啡':'☕','夜骑':'🚲','手作':'🏺','露营':'⛺','摄影':'📷' };

/* ---------------- 2b. 节假日（2026 年，国办发明电〔2025〕7号） ----------------
   官方安排：元旦 1/1-3（1/4 上班）· 春节 2/15-23（2/14、2/28 上班）· 清明 4/4-6
   劳动节 5/1-5（5/9 上班）· 端午 6/19-21 · 中秋 9/25-27 · 国庆 10/1-7（9/20、10/10 上班）
   跨年后需要更新这张表（界面上有标注来源）。 */
const HOLIDAYS = [
  { name:'元旦',   start:'2026-01-01', end:'2026-01-03', work:['2026-01-04'] },
  { name:'春节',   start:'2026-02-15', end:'2026-02-23', work:['2026-02-14','2026-02-28'] },
  { name:'清明节', start:'2026-04-04', end:'2026-04-06', work:[] },
  { name:'劳动节', start:'2026-05-01', end:'2026-05-05', work:['2026-05-09'] },
  { name:'端午节', start:'2026-06-19', end:'2026-06-21', work:[] },
  { name:'中秋节', start:'2026-09-25', end:'2026-09-27', work:[] },
  { name:'国庆节', start:'2026-10-01', end:'2026-10-07', work:['2026-09-20','2026-10-10'] }
];
const WORK_SHIFT = HOLIDAYS.reduce((a, h) => a.concat(h.work), []);
const WEEK_CN = ['周日','周一','周二','周三','周四','周五','周六'];
const holidayOf = d => HOLIDAYS.find(h => d >= h.start && d <= h.end) || null;
const isWorkShift = d => WORK_SHIFT.includes(d);
const toDate = d => new Date(d + 'T00:00:00');
const dayDiff = (a, b) => Math.round((toDate(b) - toDate(a)) / 86400000);
const md = d => { const t = toDate(d); return `${t.getMonth() + 1}/${t.getDate()}`; };
const activityLib = () => BUILTIN.concat(store.activities || []);
const findAct = id => activityLib().find(a => a.id === id);
