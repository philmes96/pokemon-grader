const { spawn } = require('child_process');
const http = require('http'); const fs = require('fs');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9337; const sleep = ms => new Promise(r => setTimeout(r, ms));
const getJson = p => new Promise((res, rej) => http.get({ host: '127.0.0.1', port: PORT, path: p }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d))); }).on('error', rej));
(async () => {
  const edge = spawn(EDGE, ['--headless', '--disable-gpu', `--remote-debugging-port=${PORT}`,
    '--user-data-dir=C:/Users/phill/AppData/Local/Temp/edge-dbg', 'about:blank'], { stdio: 'ignore' });
  await sleep(2500);
  const page = (await getJson('/json/list')).find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = {};
  const send = (m, p = {}) => new Promise(r => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  ws.onmessage = ev => { const m = JSON.parse(ev.data);
    if (m.method === 'Page.javascriptDialogOpening') { send('Page.handleJavaScriptDialog', { accept: true }); return; }
    if (m.id && pending[m.id]) { pending[m.id](m.result); delete pending[m.id]; } };
  await new Promise(r => ws.onopen = r);
  const evaluate = async e => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) console.log('[page error]', r.exceptionDetails.exception?.description); return r.result?.value; };
  await send('Page.enable');
  await send('Page.navigate', { url: 'http://localhost:8766/index.html' });
  await sleep(3000);
  const res = await evaluate(`(async () => {
    const img = await new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = 'http://localhost:8766/test-card.png'; });
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    c.getContext('2d').drawImage(img, 0, 0);
    const strip = grayCanvas(c, 0, Math.round(c.height*0.86), Math.round(c.width*0.55), Math.round(c.height*0.14), 1);
    return { W: strip.width, H: strip.height, imgW: c.width, imgH: c.height, stripURL: strip.toDataURL() };
  })()`);
  fs.writeFileSync('C:/Users/phill/AppData/Local/Temp/strip.png', Buffer.from(res.stripURL.split(',')[1], 'base64'));
  console.log(JSON.stringify({ imgW: res.imgW, imgH: res.imgH, W: res.W, H: res.H }));
  ws.close(); edge.kill();
})().catch(e => { console.error(e.message); process.exit(1); });
