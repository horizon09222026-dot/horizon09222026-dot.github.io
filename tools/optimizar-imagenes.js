// Copia las imágenes de las 3 apps a assets/img/apps/<app>/ en WebP (más livianas) usando Chrome headless.
// Sin dependencias: Chrome DevTools Protocol, igual que los scripts de capturas de las apps.
// Uso (desde la carpeta del sitio):  node tools/optimizar-imagenes.js
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const DESK = path.resolve(__dirname, '..', '..');
const OUT = path.resolve(__dirname, '..', 'assets', 'img', 'apps');
const PORT = 9341;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const GL = path.join(DESK, 'Glucemia', 'version para tienda', 'ficha-play', 'graficos', 'para-subir');
const MC = path.join(DESK, 'MundoChispa', 'tienda', 'graficos', 'para-subir');
const GB = path.join(DESK, 'Juego', 'store', 'graficos', 'para-subir');

// [origen, destino relativo, ancho máximo, calidad]
const JOBS = [];
const add = (src, dst, w, q = 0.82) => { if (fs.existsSync(src)) JOBS.push([src, dst, w, q]); else console.warn('falta', src); };

add(path.join(DESK, 'Juego', 'store', 'icon-512.png'), 'gloopy/icon.webp', 256, 0.9);
add(path.join(DESK, 'MundoChispa', 'marca', 'icono-512.png'), 'mundo-chispa/icon.webp', 256, 0.9);
add(path.join(GL, 'play-icono-512x512.png'), 'glucodiario/icon.webp', 256, 0.9);

add(path.join(MC, 'es', 'play-es-destacada-1024x500.png'), 'mundo-chispa/feature-es.webp', 1024);
add(path.join(MC, 'en', 'play-en-destacada-1024x500.png'), 'mundo-chispa/feature-en.webp', 1024);
add(path.join(GL, 'es', 'play-es-destacada-1024x500.png'), 'glucodiario/feature-es.webp', 1024);
add(path.join(GB, 'es', 'play-es-destacada-1024x500.png'), 'gloopy/feature-es.webp', 1024);

const shots = (base, lang, names, slug) => names.forEach((n, i) =>
  add(path.join(base, lang, 'telefono', `play-${lang}-${i + 1}-${n}-tel.png`), `${slug}/${lang}-${i + 1}.webp`, 540));
const MC_N = ['inicio', 'colores', 'formas', 'numeros', 'letras', 'logica', 'padres'];
shots(MC, 'es', MC_N, 'mundo-chispa');
shots(MC, 'en', MC_N, 'mundo-chispa');
shots(GL, 'es', ['hoy', 'tendencias', 'medicamentos', 'signos', 'diario', 'reporte', 'citas'], 'glucodiario');
// Gloopy: nombres según capturar.js (se toman los que existan, en orden)
if (fs.existsSync(path.join(GB, 'es', 'telefono'))) {
  fs.readdirSync(path.join(GB, 'es', 'telefono')).filter(f => f.endsWith('.png')).sort()
    .forEach((f, i) => add(path.join(GB, 'es', 'telefono', f), `gloopy/es-${i + 1}.webp`, 540));
}

async function main() {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'hd-img-'));
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  let wsUrl;
  for (let i = 0; i < 60 && !wsUrl; i++) {
    try { const j = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = j.find(t => t.type === 'page'); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (e) {}
    if (!wsUrl) await sleep(300);
  }
  if (!wsUrl) throw new Error('Chrome no respondió');
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, m => m.error ? rej(new Error(m.error.message)) : res(m.result)); ws.send(JSON.stringify({ id: i, method, params })); });

  for (const [src, dst, maxW, q] of JOBS) {
    const b64 = fs.readFileSync(src).toString('base64');
    const expr = `(async()=>{const im=new Image();im.src='data:image/png;base64,${b64}';await im.decode();
      const s=Math.min(1,${maxW}/im.naturalWidth);const c=document.createElement('canvas');
      c.width=Math.round(im.naturalWidth*s);c.height=Math.round(im.naturalHeight*s);
      const x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(im,0,0,c.width,c.height);
      return c.toDataURL('image/webp',${q}).split(',')[1];})()`;
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    const file = path.join(OUT, dst);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(r.result.value, 'base64'));
    console.log('ok', dst, Math.round(fs.statSync(file).size / 1024) + ' KB');
  }
  ws.close(); proc.kill();
}
main().catch(e => { console.error(e); process.exit(1); });
