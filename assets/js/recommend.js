/* 周末探索 · recommend.js —— 推荐引擎（可解释加权评分）
 *
 * 由 index.html 拆分而来（index.html 的 <script>）。每个文件对应原文件里的一个注释模块，
 * 内容是搬运而非重写。要改某个功能，改对应文件即可，不用翻整个 index.html。
 */

/* ---------------- 3. 推荐引擎（可解释加权评分） ---------------- */
function scoreActivity(a, w){
  let s = 30; const reasons = [], warns = [];
  const rainy = isWet(w);
  if(prefs.types.length){
    if(prefs.types.includes(a.type)){ s += 26; reasons.push(`命中偏好 · ${a.type}`); } else { s -= 18; }
  }
  if(a.indoor){
    if(rainy){ s += 18; reasons.push('下雨天室内更稳'); }
  } else if(rainy){
    s -= 32; warns.push(w ? `${w.label} ${w.pop}% 降水，户外有风险` : '天气可能不佳');
  } else {
    s += 16;
    if(w && w.tmax >= 18 && w.tmax <= 28){ s += 6; reasons.push(`天气刚好 · ${w.tmax}°C`); } else { reasons.push('天气适合户外'); }
  }
  if(a.price <= prefs.budget){
    s += 18 - Math.min(10, Math.round(a.price / Math.max(1, prefs.budget) * 10));
    reasons.push(a.price === 0 ? '完全免费' : `¥${a.price} 在预算内`);
  } else {
    const over = a.price - prefs.budget;
    s -= Math.min(30, 12 + over / 5); warns.push(`超预算 ¥${over}`);
  }
  if(prefs.people >= a.min && prefs.people <= a.max){ s += 15; reasons.push(`${prefs.people} 人正合适`); }
  else if(prefs.people < a.min){ s -= 12; warns.push(`至少 ${a.min} 人`); }
  else { s -= 8; warns.push(`更适合 ${a.max} 人以内`); }
  const lim = prefs.hours === 9 ? 12 : prefs.hours;
  if(a.hours <= lim){ s += 12; if(lim - a.hours >= 0.5) reasons.push(`约 ${a.hours}h，来得及`); }
  else { s -= 16; warns.push(`约需 ${a.hours}h，时间偏紧`); }
  const near = prefs.extras.includes('near');
  if(a.dist <= 3){ s += near ? 16 : 8; reasons.push(`离家 ${a.dist}km`); }
  else if(a.dist >= 15){ s -= near ? 22 : 8; if(near) warns.push(`较远 ${a.dist}km`); }
  if(prefs.extras.includes('cheap')){ if(a.price <= 40){ s += 10; reasons.push('花费很低'); } else s -= 8; }
  if(prefs.extras.includes('photo') && a.tags.includes('出片')){ s += 10; reasons.push('很出片'); }
  if(prefs.extras.includes('newbie') && a.tags.includes('新手友好')){ s += 10; reasons.push('新手友好'); }
  return { score: Math.max(6, Math.min(99, Math.round(s))), reasons: reasons.slice(0,4), warns: warns.slice(0,2) };
}
function planTime(a){
  const start = prefs.day === 1 ? '周六' : '周日';
  let h = 14;
  if(a.type === '市集' && a.hours <= 2) h = 10;
  if(a.type === '徒步' || a.type === '露营') h = 9;
  if(a.type === '夜骑') h = 18;
  if(a.type === '演出') h = 19.5;
  const f = t => `${String(Math.floor(t)).padStart(2,'0')}:${t % 1 ? '30' : '00'}`;
  return `${start} ${f(h)}-${f(h + a.hours)}`;
}
