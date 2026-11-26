import { STRINGS } from './i18n.js?v=3';
import { CONFIG } from './config.js?v=3';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const store = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }
};
const params = new URLSearchParams(location.search);

let lang = pickLang();
let apps = [];
const fromId = params.get('from');

function pickLang() {
  const q = params.get('lang');
  if (q && STRINGS[q]) return q;
  const saved = store.get('hd-lang');
  if (saved && STRINGS[saved]) return saved;
  return (navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en';
}
const t = (key, ...a) => {
  const v = STRINGS[lang][key] ?? STRINGS.es[key] ?? key;
  return typeof v === 'function' ? v(...a) : v;
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------------- Idioma ---------------- */
function applyI18n() {
  document.documentElement.lang = lang;
  $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  $('#langLabel').textContent = lang === 'es' ? 'EN' : 'ES';
  $('#langBtn').setAttribute('aria-label', lang === 'es' ? 'Switch to English' : 'Cambiar a español');
  setupPatreon();
  renderFrom();
}

/* ---------------- Apps ---------------- */
const appText = a => a.i18n[lang] || a.i18n.es;
const shotsFor = a => {
  const l = a.shots[lang] ? lang : 'es';
  return Array.from({ length: a.shots[l] || 0 }, (_, i) => `assets/img/apps/${a.id}/${l}-${i + 1}.webp`);
};
const featureFor = a => `assets/img/apps/${a.id}/feature-${lang === 'en' && a.id === 'mundo-chispa' ? 'en' : 'es'}.webp`;
const playIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#00D7FE" d="M3.6 2.2 13.4 12l-9.8 9.8c-.4-.2-.6-.7-.6-1.2V3.4c0-.5.2-1 .6-1.2z"/><path fill="#FFCE00" d="M16.7 15.3 13.4 12l3.3-3.3 3.9 2.2c1.1.6 1.1 1.6 0 2.2z"/><path fill="#FF3A44" d="M16.7 15.3 13.4 12l-9.8 9.8c.4.2.9.2 1.4-.1z"/><path fill="#00F076" d="M16.7 8.7 5 2.3c-.5-.3-1-.3-1.4-.1l9.8 9.8z"/></svg>`;

function orderedApps() {
  if (!fromId) return apps;
  // Quien llega desde una app ve primero las otras
  return [...apps.filter(a => a.id !== fromId), ...apps.filter(a => a.id === fromId)];
}

function renderApps() {
  const list = orderedApps();
  $('#cards').innerHTML = list.map(a => {
    const x = appText(a);
    return `<a class="card reveal" href="#app-${a.id}" data-cat="${a.category}" style="--accent:${a.accent}">
      <div class="card__banner"><img src="${featureFor(a)}" alt="" loading="lazy" width="1024" height="500"></div>
      <div class="card__body">
        <img class="card__icon" src="${a.icon}" alt="" width="56" height="56" loading="lazy">
        <span class="card__kicker">${esc(x.kicker)}</span>
        <h3>${esc(a.name)}</h3>
        <p class="card__tag">${esc(x.tagline)}</p>
        <span class="card__more">${t('card.more')}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg></span>
      </div></a>`;
  }).join('');

  $('#spotlights').innerHTML = list.map(a => {
    const x = appText(a);
    const shots = shotsFor(a);
    const playUrl = `https://play.google.com/store/apps/details?id=${a.playId}`;
    const cta = a.status === 'live'
      ? `<a class="btn btn--store" href="${playUrl}" target="_blank" rel="noopener">${playIcon}<span><small>${t('app.getOn')}</small><b>Google Play</b></span></a>`
      : `<span class="btn btn--soon"><span class="pulse"></span>${t('app.soon')}</span>`;
    return `<article class="spot" id="app-${a.id}" data-cat="${a.category}" style="--accent:${a.accent};--accent2:${a.accent2}">
      <div class="spot__glow" aria-hidden="true"></div>
      <div class="spot__copy reveal">
        <div class="spot__head">
          <img class="spot__icon" src="${a.icon}" alt="${esc(a.name)}" width="76" height="76" loading="lazy">
          <div><span class="spot__kicker">${esc(x.kicker)}</span><h3>${esc(a.name)}</h3></div>
        </div>
        <p class="spot__tagline">${esc(x.tagline)}</p>
        <p class="spot__desc">${esc(x.desc)}</p>
        <ul class="spot__chips">${x.chips.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
        <ul class="spot__features">${x.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
        <div class="spot__actions">
          ${cta}
          <button class="btn btn--ghost" type="button" data-share-app="${a.id}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/></svg>${t('app.share')}</button>
        </div>
        <div class="spot__meta">
          <span>💰 ${esc(x.price)}</span><span>🌐 ${t('app.langs', a.langs)}</span>
          ${a.privacy ? `<a href="${a.privacy}">🔒 ${t('app.privacy')}</a>` : ''}
        </div>
        ${x.note ? `<p class="spot__note">ℹ️ ${esc(x.note)}</p>` : ''}
      </div>
      <div class="spot__media reveal" style="--d:.12s">
        <div class="shots" tabindex="0" aria-label="${esc(a.name)}">
          ${shots.map((src, i) => `<button class="shot" type="button" data-app="${a.id}" data-i="${i}" aria-label="${t('app.shot', i + 1, shots.length)}"><img src="${src}" alt="${esc(a.name)} – ${t('app.shot', i + 1, shots.length)}" loading="lazy" width="540" height="960"></button>`).join('')}
        </div>
        <div class="shots-ui">
          <button class="icon-btn" type="button" data-step="-1" aria-label="${t('app.prev')}">‹</button>
          <div class="dots">${shots.map((_, i) => `<button type="button" aria-label="${t('app.shot', i + 1, shots.length)}" data-dot="${i}"></button>`).join('')}</div>
          <button class="icon-btn" type="button" data-step="1" aria-label="${t('app.next')}">›</button>
        </div>
      </div>
    </article>`;
  }).join('');

  applyFilter(currentFilter, false);
  setupCarousels();
  setupTilt();
  observeReveals();
}

/* ---------------- Filtros ---------------- */
let currentFilter = 'all';
function applyFilter(f, animate = true) {
  currentFilter = f;
  $$('.chip').forEach(c => { const on = c.dataset.filter === f; c.classList.toggle('is-active', on); c.setAttribute('aria-pressed', on); });
  const run = () => $$('.card, .spot').forEach(el => el.classList.toggle('is-hidden', f !== 'all' && el.dataset.cat !== f));
  if (animate && document.startViewTransition && !reduced) document.startViewTransition(run); else run();
}
$$('.chip').forEach(c => c.addEventListener('click', () => applyFilter(c.dataset.filter)));

/* ---------------- Carruseles ---------------- */
function setupCarousels() {
  $$('.spot').forEach(spot => {
    const track = $('.shots', spot), dots = $$('[data-dot]', spot);
    const items = $$('.shot', track);
    const current = () => {
      const mid = track.scrollLeft + track.clientWidth / 2;
      let best = 0, bd = Infinity;
      items.forEach((it, i) => { const d = Math.abs(it.offsetLeft + it.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } });
      return best;
    };
    const go = i => { const it = items[Math.max(0, Math.min(items.length - 1, i))]; track.scrollTo({ left: it.offsetLeft - (track.clientWidth - it.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' }); };
    const sync = () => { const c = current(); dots.forEach((d, i) => d.classList.toggle('is-active', i === c)); };
    track.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
    dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
    $$('[data-step]', spot).forEach(b => b.addEventListener('click', () => go(current() + Number(b.dataset.step))));
    track.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); go(current() + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(current() - 1); } });
    sync();
  });
}

/* ---------------- Visor de capturas ---------------- */
const lb = $('#lightbox'), lbImg = $('#lightboxImg');
let lbList = [], lbIdx = 0, lbName = '';
function showLb(i) {
  lbIdx = (i + lbList.length) % lbList.length;
  lbImg.src = lbList[lbIdx];
  lbImg.alt = `${lbName} – ${t('app.shot', lbIdx + 1, lbList.length)}`;
  $('#lightboxCount').textContent = `${lbIdx + 1} / ${lbList.length}`;
  lbImg.style.animation = 'none'; void lbImg.offsetWidth; lbImg.style.animation = '';
}
document.addEventListener('click', e => {
  const shot = e.target.closest('.shot');
  if (shot) {
    const a = apps.find(x => x.id === shot.dataset.app);
    lbList = shotsFor(a); lbName = a.name;
    showLb(Number(shot.dataset.i));
    lb.showModal();
  }
});
$('.lightbox__nav.prev').addEventListener('click', () => showLb(lbIdx - 1));
$('.lightbox__nav.next').addEventListener('click', () => showLb(lbIdx + 1));
$('[data-close]').addEventListener('click', () => lb.close());
lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
lb.addEventListener('keydown', e => { if (e.key === 'ArrowRight') showLb(lbIdx + 1); if (e.key === 'ArrowLeft') showLb(lbIdx - 1); });
let tx = 0;
lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) showLb(lbIdx + (dx < 0 ? 1 : -1)); }, { passive: true });

/* ---------------- Apariciones y contadores ---------------- */
const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('is-in');
    const num = en.target.querySelector('[data-count]');
    if (num) countUp(num);
    io.unobserve(en.target);
  });
}, { threshold: .12, rootMargin: '0px 0px -40px 0px' }) : null;

function observeReveals() {
  $$('.reveal:not(.is-in)').forEach((el, i) => {
    if (!io) { el.classList.add('is-in'); return; }
    if (el.closest('.stats')) el.style.setProperty('--d', `${(i % 4) * .08}s`);
    io.observe(el);
  });
}
function countUp(el) {
  const end = Number(el.dataset.count), suf = el.dataset.suffix || '';
  if (reduced || end === 0) { el.textContent = end + suf; return; }
  const t0 = performance.now(), dur = 1400;
  const step = now => {
    const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(end * e) + suf;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------------- Navegación ---------------- */
const nav = $('.nav'), bar = $('.progress');
function onScroll() {
  const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
  nav.classList.toggle('is-scrolled', y > 10);
  bar.style.setProperty('--p', h > 0 ? (y / h).toFixed(4) : 0);
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const sectionIO = 'IntersectionObserver' in window && new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) $$('.nav__links a').forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === '#' + en.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
['apps', 'why', 'support', 'contact'].forEach(id => sectionIO && sectionIO.observe(document.getElementById(id)));

const menuBtn = $('#menuBtn'), menu = $('#mobileMenu');
const setMenu = open => { menu.classList.toggle('is-open', open); menuBtn.setAttribute('aria-expanded', open); nav.classList.toggle('is-scrolled', open || scrollY > 10); };
menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
$$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

/* ---------------- Tema e idioma ---------------- */
$('#themeBtn').addEventListener('click', e => {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  const apply = () => { document.documentElement.dataset.theme = next; store.set('hd-theme', next); };
  if (!document.startViewTransition || reduced) return apply();
  const x = e.clientX || innerWidth - 60, y = e.clientY || 30;
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.startViewTransition(apply).ready.then(() => {
    document.documentElement.animate({ clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 600, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)' });
  });
});
$('#langBtn').addEventListener('click', () => {
  lang = lang === 'es' ? 'en' : 'es';
  store.set('hd-lang', lang);
  const run = () => { applyI18n(); renderApps(); $$('.reveal').forEach(el => el.classList.add('is-in')); };
  if (document.startViewTransition && !reduced) document.startViewTransition(run); else run();
});

/* ---------------- Llegada desde una app (?from=gloopy) ---------------- */
function renderFrom() {
  const box = $('#fromBanner');
  const a = apps.find(x => x.id === fromId);
  if (!a) { box.hidden = true; return; }
  box.innerHTML = `<img src="${a.icon}" alt=""><span>${t('from.thanks', esc(a.name))}</span>`;
  box.hidden = false;
}

/* ---------------- Apoyo, compartir, contacto ---------------- */
let toastTimer;
function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('is-on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('is-on'), 2600);
}
function setupPatreon() {
  const b = $('#patreonBtn'), label = $('#patreonLabel');
  if (CONFIG.PATREON_URL) {
    b.href = CONFIG.PATREON_URL; b.target = '_blank'; b.rel = 'noopener'; b.removeAttribute('aria-disabled');
    label.dataset.i18n = 'support.patreon'; label.textContent = t('support.patreon');
  }
}
$('#patreonBtn').addEventListener('click', e => { if (!CONFIG.PATREON_URL) { e.preventDefault(); toast(t('support.patreonToast')); } });

async function share(url, title, text) {
  if (navigator.share) { try { await navigator.share({ url, title, text }); } catch {} return; }
  try { await navigator.clipboard.writeText(url); toast(t('share.copied')); } catch { prompt('', url); }
}
$('#shareBtn').addEventListener('click', () => share(CONFIG.SITE_URL, t('share.title'), t('share.text')));
document.addEventListener('click', e => {
  const b = e.target.closest('[data-share-app]'); if (!b) return;
  const a = apps.find(x => x.id === b.dataset.shareApp);
  share(`${CONFIG.SITE_URL}#app-${a.id}`, a.name, `${a.name}: ${appText(a).tagline}`);
});
$('#copyMail').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(CONFIG.EMAIL); toast(t('contact.copied')); } catch { prompt('', CONFIG.EMAIL); }
});

/* ---------------- Efectos de puntero (solo mouse) ---------------- */
function setupTilt() {
  if (!finePointer || reduced) return;
  $$('.card').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', `${px * 100}%`); card.style.setProperty('--my', `${py * 100}%`);
      card.style.transform = `perspective(900px) rotateX(${(.5 - py) * 6}deg) rotateY(${(px - .5) * 8}deg) translateY(-4px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}
if (finePointer && !reduced) {
  const orbit = $('.orbit');
  $('.hero').addEventListener('pointermove', e => {
    const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
    orbit.style.setProperty('--rx', `${x * 14}deg`); orbit.style.setProperty('--ry', `${-y * 14}deg`);
  });
}

/* ---------------- Muro de Supporters (data/supporters.json) ---------------- */
fetch('data/supporters.json', { cache: 'no-cache' })
  .then(r => r.ok ? r.json() : { supporters: [] })
  .then(d => {
    const names = (d.supporters || []).filter(Boolean);
    $('#wallList').innerHTML = names.map(n => `<li>${esc(n)}</li>`).join('');
    $('#wallEmpty').hidden = names.length > 0;
  })
  .catch(() => {});

/* ---------------- Inicio ---------------- */
$('#year').textContent = new Date().getFullYear();
applyI18n();
observeReveals();

fetch('data/apps.json', { cache: 'no-cache' })
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(data => {
    apps = data.apps;
    renderApps();
    renderFrom();
    // Enlace directo a una app (#app-gloopy) una vez dibujada
    if (location.hash.startsWith('#app-')) requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
  })
  .catch(() => { $('#spotlights').innerHTML = `<p class="spot__note">${t('error.load')}</p>`; });
