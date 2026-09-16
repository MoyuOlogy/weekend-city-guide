/* 周末探索 · guide.js —— 攻略
 *
 * 由 index.html 拆分而来（index.html 的 <script>）。每个文件对应原文件里的一个注释模块，
 * 内容是搬运而非重写。要改某个功能，改对应文件即可，不用翻整个 index.html。
 */

/* ---------------- 12. 攻略 ---------------- */
function renderGuides(){
  const box = $('#guideList'); if(!box) return;
  const list = [...store.guides].sort((a, b) => (b.ts || 0) - (a.ts || 0));
  $('#guideCount').textContent = list.length ? `${list.length} 篇` : '';
  if(!list.length){
    box.innerHTML = `<div class="empty"><svg class="big"><use href="#i-doc"></use></svg>还没有攻略<br>点「＋」写下第一篇，帮到后面的同学</div>`;
    return;
  }
  box.innerHTML = list.map(g => {
    const liked = (g.likedBy || []).includes(myNick());
    const g2 = coverGrad({ id:g.id, name:g.title });
    return `<article class="row-card" style="padding:0;overflow:hidden">
      <div style="height:80px;background:linear-gradient(135deg,${g2[0]},${g2[1]});display:grid;place-items:center">
        <svg class="ri" width="30" height="30" style="color:rgba(255,255,255,.9)"><use href="#i-doc"></use></svg>
      </div>
      <div style="padding:14px">
        <h3 style="margin:0;font-size:15px;font-weight:600">${esc(g.title)}${g.demo ? '<span class="tag-demo">示例</span>' : ''}</h3>
        <div class="meta">${esc(g.author)} · ${esc(g.date)}</div>
        <p style="font-size:13px;color:var(--text-2);line-height:1.7;margin:10px 0 0;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-wrap">${esc(g.body)}</p>
        <div class="chips" style="margin-top:10px">${(g.tags || []).map(t => `<span class="chip" data-tag="${esc(t)}" title="按这个标签筛选首页">#${esc(t)}</span>`).join('')}</div>
        <div class="btnrow">
          <button class="btn ${liked ? 'warn' : 'line'}" data-act="likeg" data-id="${g.id}">
            <svg class="ri" width="16" height="16"${liked ? ' style="color:var(--red)"' : ''}><use href="#${liked ? 'i-liked' : 'i-like'}"></use></svg>${(g.likedBy || []).length}</button>
          <button class="btn line" data-act="copyg" data-id="${g.id}"><svg class="ri" width="16" height="16"><use href="#i-copy"></use></svg>复制</button>
        </div>
      </div>
    </article>`;
  }).join('');
  observeIn();
}
