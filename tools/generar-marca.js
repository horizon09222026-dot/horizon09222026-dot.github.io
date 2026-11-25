// Genera assets/img/icon-192.png, icon-512.png y og-image.png (1200x630, vista previa al compartir en redes).
// Uso (desde la carpeta del sitio):  node tools/generar-marca.js
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ROOT = path.resolve(__dirname, '..');
const IMG = path.join(ROOT, 'assets', 'img');
const PORT = 9342;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const b64 = f => fs.readFileSync(path.join(ROOT, f)).toString('base64');
const logo = fs.readFileSync(path.join(IMG, 'favicon.svg'), 'utf8');

const iconPage = size => `<html><body style="margin:0;background:transparent">
  <div style="width:${size}px;height:${size}px">${logo.replace('<svg ', `<svg width="${size}" height="${size}" `)}</div></body></html>`;

const ogPage = () => `<html><head><style>
  body{margin:0;width:1200px;height:630px;overflow:hidden;font-family:'Segoe UI',system-ui,sans-serif;background:#0B0B1E;color:#fff;position:relative}
  .b{position:absolute;border-radius:50%;filter:blur(80px);opacity:.8}
  h1{font-size:78px;line-height:1;margin:0 0 18px;letter-spacing:-2px;font-weight:800}
  .g{background:linear-gradient(120deg,#FFB547,#FF5E7E 50%,#8B5CF6);-webkit-background-clip:text;color:transparent}
  p{font-size:30px;margin:0;color:#C9C6EA}
  .icons{position:absolute;right:70px;top:120px;display:grid;gap:26px}
  .icons img{width:118px;height:118px;border-radius:30px;box-shadow:0 20px 40px rgba(0,0,0,.5)}
  .brand{display:flex;align-items:center;gap:16px;font-size:34px;margin-bottom:48px}
</style></head><body>
  <div class="b" style="width:520px;height:520px;left:-120px;top:-160px;background:#8B5CF6"></div>
  <div class="b" style="width:460px;height:460px;right:80px;bottom:-220px;background:#FF5E7E"></div>
  <div class="b" style="width:360px;height:360px;left:380px;bottom:-200px;background:#FFB547"></div>
  <div style="position:absolute;left:80px;top:90px;width:820px">
    <div class="brand">${logo.replace('<svg ', '<svg width="64" height="64" ')}<span><b>horizon</b>Development</span></div>
    <h1>Apps para <span class="g">jugar</span>,<br><span class="g">aprender</span> y <span class="g">cuidarte</span>.</h1>
    <p>Gloopy Blocks · Mundo Chispa · GlucoDiario</p>
  </div>
  <div class="icons">
    <img src="data:image/webp;base64,${b64('assets/img/apps/gloopy/icon.webp')}">
    <img style="margin-left:-90px" src="data:image/webp;base64,${b64('assets/img/apps/mundo-chispa/icon.webp')}">
    <img src="data:image/webp;base64,${b64('assets/img/apps/glucodiario/icon.webp')}">
  </div>
</body></html>`;

async function main() {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'hd-brand-'));
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`, '--hide-scrollbars', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  let wsUrl;
  for (let i = 0; i < 60 && !wsUrl; i++) {
    try { const j = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = j.find(t => t.type === 'page'); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (e) {}
    if (!wsUrl) await sleep(300);
  }
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result)); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable');
  const render = async (html, w, h, file, transparent) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setDefaultBackgroundColorOverride', transparent ? { color: { r: 0, g: 0, b: 0, a: 0 } } : {});
    const frameId = (await send('Page.getFrameTree')).frameTree.frame.id;
    await send('Page.setDocumentContent', { frameId, html });
    await sleep(700);
    const r = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
    fs.writeFileSync(path.join(IMG, file), Buffer.from(r.data, 'base64'));
    console.log('ok', file);
  };
  await render(iconPage(192), 192, 192, 'icon-192.png', true);
  await render(iconPage(512), 512, 512, 'icon-512.png', true);
  await render(ogPage(), 1200, 630, 'og-image.png', false);
  ws.close(); proc.kill();
}
main().catch(e => { console.error(e); process.exit(1); });
