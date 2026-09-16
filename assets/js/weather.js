/* 周末探索 · weather.js —— 天气（Open-Meteo + 断网降级）
 *
 * 由 index.html 拆分而来（index.html 的 <script>）。每个文件对应原文件里的一个注释模块，
 * 内容是搬运而非重写。要改某个功能，改对应文件即可，不用翻整个 index.html。
 */

const WMO = {
  0:['晴','☀️',true],1:['大致晴朗','🌤️',true],2:['多云','⛅',true],3:['阴','☁️',true],
  45:['有雾','🌫️',false],48:['雾凇','🌫️',false],51:['小毛毛雨','🌦️',false],53:['毛毛雨','🌦️',false],55:['浓毛毛雨','🌧️',false],
  61:['小雨','🌧️',false],63:['中雨','🌧️',false],65:['大雨','⛈️',false],66:['冻雨','🌧️',false],67:['强冻雨','🌧️',false],
  71:['小雪','🌨️',false],73:['中雪','🌨️',false],75:['大雪','❄️',false],77:['米雪','🌨️',false],
  80:['阵雨','🌦️',false],81:['强阵雨','🌧️',false],82:['暴雨','⛈️',false],85:['阵雪','🌨️',false],86:['强阵雪','❄️',false],
  95:['雷阵雨','⛈️',false],96:['雷阵雨伴冰雹','⛈️',false],99:['强雷暴','⛈️',false]
};
let weather = null;
function weekendOffset(which){ const dow = new Date().getDay(); return ((which===1?6:0) - dow + 7) % 7; }
const targetIdx = () => Math.min(weekendOffset(prefs.day), (weather?.days.length ?? 1) - 1);
const targetWeather = () => weather ? weather.days[targetIdx()] : null;
const isWet = w => !!w && (w.pop >= 50 || (!w.ok && w.pop >= 25));
const MOCK_W = [[2,22,14,10],[0,25,16,0],[61,19,13,75],[1,24,15,5],[80,21,15,60],[3,20,14,30],[0,26,17,0]];
function mockWeather(){
  const t = new Date();
  return { live:false, days: MOCK_W.map((m,i)=>{
    const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() + i), w = WMO[m[0]] || WMO[2];
    return { date:ymd(d), code:m[0], label:w[0], emoji:w[1], ok:w[2], tmax:m[1], tmin:m[2], pop:m[3] };
  })};
}
async function fetchWeather(city){
  const c = CITIES[city]; if(!c) return mockWeather();
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}`
    + `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7`;
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 6000);
  try{
    const res = await fetch(url, { signal: ctrl.signal }); if(!res.ok) throw new Error('http ' + res.status);
    const d = (await res.json()).daily;
    return { live:true, days: d.time.map((t,i)=>{
      const code = d.weather_code[i], w = WMO[code] || WMO[2];
      return { date:t, code, label:w[0], emoji:w[1], ok:w[2], tmax:Math.round(d.temperature_2m_max[i]),
               tmin:Math.round(d.temperature_2m_min[i]), pop: d.precipitation_probability_max?.[i] ?? 0 };
    })};
  }catch{ return mockWeather(); } finally{ clearTimeout(timer); }
}
