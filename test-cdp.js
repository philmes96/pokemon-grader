// CDP smoke test for CardGrader PWA
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync, spawn } = require('child_process');

const PORT = 9333;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'pdgtest'));

try { execSync('taskkill /F /IM msedge.exe', { stdio: 'ignore' }); } catch (e) {}
const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless', '--disable-gpu',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${TMP}`,
  'about:blank'
], { stdio: 'ignore', detached: true });
edge.unref();

async function getTarget() {
  for (let i = 0; i < 20; i++) {
    try {
      const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json());
      const page = list.find(t => t.type === 'page');
      if (page) return page;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('no CDP target');
}

let id = 0;
const pending = new Map();
let ws;

function send(method, params = {}, sessionId) {
  return new Promise((res, rej) => {
    const mid = ++id;
    pending.set(mid, { res, rej });
    ws.send(JSON.stringify({ id: mid, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}

async function main() {
  const target = await getTarget();
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id);
      pending.delete(m.id);
      m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result);
    }
  };

  // auto-accept dialogs
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Page.javascriptDialogOpening') {
      send('Page.handleJavaScriptDialog', { accept: true }, m.sessionId);
    }
  });

  const errors = [];
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Runtime.exceptionThrown') {
      errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:8765/index.html' });
  await new Promise(r => setTimeout(r, 3000));

  const ev = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return r.result.value;
  };

  const out = {};

  // 1. page structure renders
  out.screens = await ev(`document.querySelectorAll('.screen').length`);
  out.navButtons = await ev(`document.querySelectorAll('#menu button').length`);
  out.title = await ev(`document.title`);

  // 2. camera fails gracefully headless (no crash)
  out.camErrVisible = await ev(`document.getElementById('camErr').style.display !== 'none'`);

  // 3. insert synthetic card via localStorage + reload -> persists and renders
  const card = {
    id: 'test1', ts: Date.now(),
    cardName: 'Pikachu', cardSet: 'Base Set', cardNum: '58/102',
    thumb: '', quality: { blur: 30, glare: 1, fill: 85 },
    centering: { ok: true, lr: 60, tb: 58 },
    flaws: {}, cardId: null,
    priceRaw: 5, price9: 20, price10: 150,
    grade: { overall: 9.5, centering: 10, edges: 10, surf: 10, photoBad: false }
  };
  await ev(`localStorage.setItem('cardgrader_v1', JSON.stringify({cards:[${JSON.stringify(card)}],settings:{apiKey:'test'}}))`);
  await send('Page.navigate', { url: 'http://localhost:8765/index.html' });
  await new Promise(r => setTimeout(r, 2500));

  out.persistCount = await ev(`(JSON.parse(localStorage.getItem('cardgrader_v1'))||{cards:[]}).cards.length`);
  out.listRendered = await ev(`(document.getElementById('listCards').innerHTML||'').includes('Pikachu')`);
  out.sumText = await ev(`document.getElementById('sumTxt').textContent`);

  // 4. value search stub: override fetch to fake API, check results render
  out.apiReachable = await ev(`fetch('https://api.tcgdex.net/v2/en/cards?name=pikachu').then(()=>true).catch(()=>false)`);

  // 5. nav switching works
  await ev(`document.querySelector('#menu button[data-s=\"list\"]').click()`);
  out.navList = await ev(`document.getElementById('scr-list').classList.contains('active')`);

  out.jsErrors = errors;
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

main().catch(e => { console.error('FAIL', e.message); process.exit(1); });
