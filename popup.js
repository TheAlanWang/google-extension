// popup.js — MV3 CSP clean
const availEl = document.getElementById('avail');
const statusEl = document.getElementById('status');
const out = document.getElementById('out');
const txt = document.getElementById('txt');
const q   = document.getElementById('q');   // 新增：问题输入框

// 尝试用 en→es→ja 挑一个可用的输出语言（只传 outputLanguage，避免其它语言字段触发不支持）
const CANDIDATES = ['en', 'es', 'ja'];
async function pickOutputLanguage() {
  for (const lang of CANDIDATES) {
    try {
      const a = await Summarizer.availability({ outputLanguage: lang });
      if (a !== 'unavailable') return lang;
    } catch (_) {}
  }
  return null;
}

let OUT_LANG = 'en';  // 默认值，后面会用 pickOutputLanguage 更新

// ---------- Availability ----------
(async () => {
  if (!('Summarizer' in self)) {
    availEl.textContent = 'Summarizer: not present';
    return;
  }
  OUT_LANG = (await pickOutputLanguage()) || 'en';
  try {
    const a = await Summarizer.availability({ outputLanguage: OUT_LANG });
    availEl.textContent = `Summarizer: ${a} (output=${OUT_LANG})`;
  } catch (e) {
    availEl.textContent = 'Summarizer: error ' + e.name;
  }

  // Writer 的可用性（可选）
  let wAvail = 'not present';
  if ('Writer' in self) {
    try { wAvail = await Writer.availability({ length: 'short', tone: 'neutral', outputLanguage: OUT_LANG }); }
    catch (e) { wAvail = 'error: ' + e.name; }
  } else {
    wAvail = 'not present (need OT token?)';
  }
  availEl.textContent += ` | Writer: ${wAvail}`;
})();

// ---------- 抓取当前页选中文本 ----------
document.getElementById('grab').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    const [res] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString()
           || (document.title + "\n\n" + document.body.innerText.slice(0, 2000))
    });
    txt.value = res?.result || '';
  } catch (e) {
    statusEl.textContent = 'grab error: ' + e.message;
  }
});

// ---------- Summarize ----------
document.getElementById('sum').addEventListener('click', async () => {
  out.textContent = '';
  statusEl.textContent = 'Summarizing…';
  try {
    const s = await Summarizer.create({
      outputLanguage: OUT_LANG,
      type: 'key-points',
      monitor(m) {
        m.addEventListener('downloadprogress', e => {
          statusEl.textContent = 'Downloading… ' + Math.round(e.loaded * 100) + '%';
        });
      }
    });

    let result = await s.summarize(txt.value, { context: 'extension demo' });
    s.destroy();

    out.textContent = result;
    statusEl.textContent = 'Done.';
  } catch (e) {
    out.textContent = e.stack || e.message || e.name;
    statusEl.textContent = 'Error: ' + e.name;
  }
});

// ---------- Q&A：根据网页内容回答你的问题 ----------
document.getElementById('ask').addEventListener('click', async () => {
  const question = (q?.value || '').trim();
  const context  = (txt?.value || '').trim();
  if (!question) { statusEl.textContent = '请输入问题'; return; }
  if (!context)  { statusEl.textContent = '请先“抓取当前页选中文本”或粘贴网页内容'; return; }

  out.textContent = '';
  statusEl.textContent = 'Answering…';

  try {
    if ('Writer' in self) {
      // 优先用 Writer：更像问答
      const w = await Writer.create({
        tone: 'neutral',
        length: 'short',
        outputLanguage: OUT_LANG,
        monitor(m){ m.addEventListener('downloadprogress', e =>
          statusEl.textContent = 'Writer downloading… ' + Math.round(e.loaded*100) + '%'); }
      });

      const prompt = [
        'You are a helpful assistant.',
        'Answer the user question using ONLY the provided context.',
        'If the answer is not found in the context, reply exactly: "Not mentioned".',
        'Keep it concise (1–3 sentences).',
        `Question: ${question}`
      ].join(' ');

      const answer = await w.write(prompt, { context });
      w.destroy();
      out.textContent = answer;
      statusEl.textContent = 'Done.';
    } else {
      // 回退：用 Summarizer 近似回答（准确度不如 Writer）
      const s = await Summarizer.create({
        outputLanguage: OUT_LANG,
        type: 'key-points',
        monitor(m){ m.addEventListener('downloadprogress', e =>
          statusEl.textContent = 'Downloading… ' + Math.round(e.loaded*100) + '%'); }
      });
      const combined = `Question: ${question}\n\nContext:\n${context}`;
      const ans = await s.summarize(combined);
      s.destroy();
      out.textContent = ans;
      statusEl.textContent = 'Done.';
    }
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      out.textContent = '内容太长了，先少抓一点再问试试。';
    } else {
      out.textContent = e.stack || e.message || e.name;
    }
    statusEl.textContent = 'Error: ' + e.name;
  }
});

// ---------- Writer（原按钮保留，用于写作/摘要扩写） ----------
document.getElementById('writer').addEventListener('click', async () => {
  out.textContent = '';
  statusEl.textContent = 'Writer…';
  if (!('Writer' in self)) {
    statusEl.textContent = 'Writer API 未暴露（检查 OT token/Chrome 版本/是否在 popup 页面）';
    return;
  }
  try {
    const w = await Writer.create({
      tone: 'neutral',
      length: 'short',
      outputLanguage: OUT_LANG,
      monitor(m) {
        m.addEventListener('downloadprogress', e => {
          statusEl.textContent = 'Writer downloading… ' + Math.round(e.loaded * 100) + '%';
        });
      }
    });

    const prompt = 'Write a 3-bullet executive summary of the following text.';
    const result = await w.write(prompt, { context: txt.value });
    w.destroy();

    out.textContent = result;
    statusEl.textContent = 'Done.';
  } catch (e) {
    statusEl.textContent = e.name;
    out.textContent = e.stack || e.message;
  }
});
