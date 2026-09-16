/* 周末探索 · io.js —— 导入 / 导出
 *
 * 由 index.html 拆分而来（index.html 的 <script>）。每个文件对应原文件里的一个注释模块，
 * 内容是搬运而非重写。要改某个功能，改对应文件即可，不用翻整个 index.html。
 */

/* ---------------- 17. 导入 / 导出 ---------------- */
function exportJSON(){
  const blob = new Blob([JSON.stringify(sync.snapshot(), null, 2)], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `周末探索-${ymd(new Date())}.json`;
  a.click(); URL.revokeObjectURL(a.href);
  toast('已导出 JSON');
}
function openImport(){
  openSheet('form', `
    <div class="sheet-head"><h3>导入数据</h3><p>选择之前导出的 JSON 文件，或直接粘贴内容</p><button class="x" data-act="close"><svg class="ri" width="16" height="16"><use href="#i-close"></use></svg></button></div>
    <div class="sheet-body">
      <div class="field"><label>选择文件（.json）</label>
        <input type="file" id="impFile" accept=".json,application/json" />
      </div>
      <div class="field"><label>或粘贴 JSON</label><textarea id="impText" placeholder='{"teams":[...],"guides":[...]}' style="min-height:120px;font-size:12px"></textarea></div>
      <div class="form-actions"><button class="btn pri block" id="doImport">导入并合并</button></div>
    </div>`);
  const doImport = raw => {
    try{
      const data = JSON.parse(raw);
      sync.receive({ ...data, room:me.room || data.room }, Date.now());
      renderAll(); openSheet(null); toast('导入成功');
    }catch{ toast('JSON 格式不对'); }
  };
  $('#doImport')?.addEventListener('click', () => doImport($('#impText').value));
  $('#impFile')?.addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; if(!f) return;
    const rd = new FileReader();
    rd.onload = () => { $('#impText').value = String(rd.result || ''); doImport(String(rd.result || '')); };
    rd.onerror = () => toast('文件读取失败');
    rd.readAsText(f);
  });
}
function editNick(){
  openSheet('form', `
    <div class="sheet-head"><h3>编辑资料</h3><p>昵称会显示在组队和攻略上</p><button class="x" data-act="close"><svg class="ri" width="16" height="16"><use href="#i-close"></use></svg></button></div>
    <div class="sheet-body">
      <div class="field"><label>昵称</label><input type="text" id="nickEdit" value="${esc(me.nick)}" maxlength="12" placeholder="例如：小新" /></div>
      <div class="field"><label>头像</label><div class="chips" id="emojiPick">
        ${LOGIN_EMOJI.map(m => `<div class="chip ${m === me.emoji ? 'on' : ''}" data-emoji="${m}">${m}</div>`).join('')}
      </div></div>
      <div class="form-actions"><button class="btn pri block" id="saveNick">保存</button></div>
    </div>`);
  $('#emojiPick').addEventListener('click', e => {
    const c = e.target.closest('[data-emoji]'); if(!c) return;
    me.emoji = c.dataset.emoji; $$('#emojiPick .chip').forEach(x => x.classList.toggle('on', x === c)); persistMe();
  });
  $('#saveNick').addEventListener('click', () => {
    const v = $('#nickEdit').value.trim();
    if(!v) return toast('昵称不能为空');
    me.nick = v; persistMe(); renderMe(); renderFeed(); openSheet(null); toast('已保存');
  });
}
