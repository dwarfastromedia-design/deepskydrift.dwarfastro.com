const APP_VERSION = 'v0.9.3';
const FPS = 30;
const MAX_IMAGE_DIM = 1920;
const $ = id => document.getElementById(id);

let S = {
  src: null,
  starless: null,
  starsOnly: null,
  mask: null,
  stars: [],
  statics: [],
  movers: [],
  suppressedStars: [],
  motionBg: null,
  motionMask: null,
  has: 0,
  map: 0,
  cx: 0.5,
  cy: 0.5,
  frameCx: 0.5,
  frameCy: 0.5,
  motionCx: 0.5,
  motionCy: 0.5,
  anchorPreview: 0,
  framing: 0,
  strict: 0.7,
  max: 2200,
  move: 260,
  rad: 2.5,
  bias: 'balanced',
  fly: 0.65,
  travel: 1,
  accel: 1.55,
  starBright: 1,
  grow: 0.12,
  zoom: 0.05,
  dur: 10,
  preview: 'final',
  viewMode: 'original',
  play: 0,
  raf: 0,
  start: 0,
  last: 0,
  loadCount: 0,
  lastExportBlob: null,
  lastExportName: null,
  lastPreset: 'Cinematic Drift',
  lastIntensity: 'cinematic'
};

let Pan = null;

const PRESETS = {
  cinematic: { name: 'Cinematic Drift', strict: 70, max: 2200, move: 260, rad: 250, bias: 'balanced', fly: 65, travel: 100, accel: 155, starBright: 100, grow: 12, zoom: 5, dur: 10, preset: 'portrait' },
  meditation: { name: 'Gentle Meditation', strict: 74, max: 1800, move: 180, rad: 245, bias: 'isolated', fly: 38, travel: 45, accel: 125, starBright: 90, grow: 6, zoom: 3, dur: 60, preset: 'landscape' },
  social: { name: 'Social Reel', strict: 68, max: 2600, move: 420, rad: 250, bias: 'bright', fly: 90, travel: 145, accel: 175, starBright: 112, grow: 14, zoom: 6, dur: 15, preset: 'portrait' }
};

const INTENSITY = {
  subtle: { fly: 42, travel: 60, accel: 125, grow: 5, move: 180 },
  cinematic: { fly: 75, travel: 115, accel: 155, grow: 10, move: 300 },
  intense: { fly: 125, travel: 210, accel: 195, grow: 16, move: 560 }
};

function cl(x, a, b) { return Math.max(a, Math.min(b, x)); }
function frameX() { return S.frameCx ?? S.cx ?? 0.5; }
function frameY() { return S.frameCy ?? S.cy ?? 0.5; }
function motionX() { return S.motionCx ?? S.cx ?? 0.5; }
function motionY() { return S.motionCy ?? S.cy ?? 0.5; }
function setVal(id, v) { const e = $(id); if (e) e.value = String(v); }
function wait(ms = 20) { return new Promise(r => setTimeout(r, ms)); }

function st(v) {
  const e = $('status');
  if (e) e.textContent = String(v).replace(/v0\.9\.2/g, APP_VERSION).replace(/0\.9\.2/g, '0.9.3').replace(/v0\.9\.1/g, APP_VERSION).replace(/0\.9\.1/g, '0.9.3').replace(/v0\.8\.\d/g, APP_VERSION).replace(/0\.8\.\d/g, '0.9.3');
}

function ga(name, params = {}) {
  try { if (window.trackGA4) window.trackGA4(name, Object.assign({ app_version: APP_VERSION }, params || {})); } catch (e) {}
}

function prog(t, p, l) {
  const o = $('ol');
  if (o) o.style.display = 'grid';
  const a = $('olt'), f = $('fill'), b = $('oll');
  if (a) a.textContent = t;
  if (f) f.style.width = cl(p, 0, 100) + '%';
  if (b) b.textContent = l || '';
  st(l || t);
}

function hide() {
  const o = $('ol');
  if (o) o.style.display = 'none';
}

function dims() {
  if (S.viewMode === 'reel916') return { w: 1080, h: 1920, l: '9x16' };
  const p = $('preset')?.value || 'portrait';
  if (p === 'landscape') return { w: 1920, h: 1080, l: '16x9' };
  if (p === 'square') return { w: 1080, h: 1080, l: '1x1' };
  return { w: 1080, h: 1920, l: '9x16' };
}

function viewDims() {
  if (S.viewMode === 'reel916') return { w: 1080, h: 1920, l: '9x16 Reel' };
  return S.src ? { w: S.src.width, h: S.src.height, l: 'Original' } : { w: 1080, h: 1920, l: 'Original' };
}

function labels() {
  const pairs = [
    ['strict', 'sv', v => v + '%'], ['max', 'xv', v => v], ['move', 'mv', v => v],
    ['rad', 'rv', v => (v / 100).toFixed(1) + '×'], ['fly', 'fv', v => (v / 100).toFixed(2) + '×'],
    ['travel', 'yv', v => (v / 100).toFixed(2) + '×'], ['accel', 'av', v => (v / 100).toFixed(2) + '×'],
    ['starBright', 'bv', v => (v / 100).toFixed(2) + '×'], ['grow', 'gv', v => (v / 100).toFixed(2) + '×'],
    ['zoom', 'zv', v => v + '%'], ['dur', 'tv', v => v + 's']
  ];
  for (const [id, out, fn] of pairs) {
    const e = $(id), o = $(out);
    if (e && o) o.textContent = fn(Number(e.value));
  }
  const d = dims(), x = $('exinfo');
  if (x) x.textContent = `Export target: ${d.w}×${d.h} at ${FPS} fps · browser may downscale`;
  const appv = $('appVersion');
  if (appv) appv.textContent = APP_VERSION;
  markViewMode(S.viewMode || 'original');
}

function read() {
  S.strict = Number($('strict')?.value || 70) / 100;
  S.max = Number($('max')?.value || 2200);
  S.move = Number($('move')?.value || 260);
  S.rad = Number($('rad')?.value || 250) / 100;
  S.bias = $('bias')?.value || 'balanced';
  S.preview = $('preview')?.value || 'final';
  S.fly = Number($('fly')?.value || 65) / 100;
  S.travel = Number($('travel')?.value || 100) / 100;
  S.accel = Number($('accel')?.value || 155) / 100;
  S.starBright = Number($('starBright')?.value || 100) / 100;
  S.grow = Number($('grow')?.value || 12) / 100;
  S.zoom = Number($('zoom')?.value || 5) / 100;
  S.dur = Number($('dur')?.value || 10);
  labels();
}

function size(w, h) {
  const v = document.querySelector('.view'), c = $('main');
  if (!v || !c) return;
  const vw = Math.max(1, v.clientWidth - 2), vh = Math.max(1, v.clientHeight - 2), a = w / h;
  let cw, ch;
  if (vw / vh > a) { ch = vh; cw = ch * a; } else { cw = vw; ch = cw / a; }
  c.width = Math.max(1, Math.round(cw));
  c.height = Math.max(1, Math.round(ch));
  c.style.display = 'block';
  updateTarget();
}

function srcRect(img, W, H, t = 0) {
  const z = 1 + (S.zoom || 0) * ((t / Math.max(1, S.dur || 10)) % 1);
  const ia = img.width / img.height, oa = W / H;
  let bw, bh;
  if (ia > oa) { bh = img.height; bw = bh * oa; } else { bw = img.width; bh = bw / oa; }
  const sw = bw / z, sh = bh / z, cx = frameX() * img.width, cy = frameY() * img.height;
  return { sx: cl(cx - sw / 2, 0, Math.max(0, img.width - sw)), sy: cl(cy - sh / 2, 0, Math.max(0, img.height - sh)), sw, sh };
}

function motionRect(img, W, H) {
  const ia = img.width / img.height, oa = W / H;
  let bw, bh;
  if (ia > oa) { bh = img.height; bw = bh * oa; } else { bw = img.width; bh = bw / oa; }
  const cx = frameX() * img.width, cy = frameY() * img.height;
  return { sx: cl(cx - bw / 2, 0, Math.max(0, img.width - bw)), sy: cl(cy - bh / 2, 0, Math.max(0, img.height - bh)), sw: bw, sh: bh };
}

function mapxy(x, y, r, w, h) { return { x: (x - r.sx) / r.sw * w, y: (y - r.sy) / r.sh * h }; }

function hash(id) {
  let h = 2166136261, s = String(id || 's');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}

function smooth(a, b, x) { x = cl((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
function starPhase(s, t) { const rate = 0.20 * cl(S.travel || 1, 0.15, 5); return ((t || 0) * rate + (s.phase ?? hash(s.id))) % 1; }
function starVis(p) { return smooth(0, 0.01, p); }

function tierDistance(s) { return s.tier === 3 ? 1.35 : s.tier === 2 ? 1.0 : 0.65; }
function tierGamma(s) { return cl((S.accel || 1.55) + (s.tier === 3 ? 0.25 : s.tier === 2 ? 0 : -0.15), 1.05, 2.45); }
function tierBright(s) { return s.tier === 3 ? 1.15 : s.tier === 2 ? 1.0 : 0.85; }

function screenVectorFromCenter(p0, c, w, h) {
  let dx = p0.x - c.x, dy = p0.y - c.y, len = Math.hypot(dx, dy);
  if (len < 1e-4) { dx = 1; dy = 0; len = 1; } else { dx /= len; dy /= len; }
  const margin = Math.max(120, Math.min(w, h) * 0.10);
  const tx = dx > 0 ? (w - p0.x + margin) / dx : dx < 0 ? (-p0.x - margin) / dx : Infinity;
  const ty = dy > 0 ? (h - p0.y + margin) / dy : dy < 0 ? (-p0.y - margin) / dy : Infinity;
  const base = Math.min(Math.abs(tx), Math.abs(ty));
  return { dx, dy, dist: Math.max(60, base) * cl(1.02 + (S.fly || 0.65) * 0.12, 1.04, 1.28) };
}

function drawMoving(g, s, r, w, h, t, alphaScale = 1, phase = null) {
  const img = s.img || s.sp;
  if (!img) return;
  const anchored = !!S.anchorPreview;
  const rawP = anchored ? 0 : (phase === null ? starPhase(s, t) : phase);
  const p = anchored ? 0 : Math.pow(rawP, tierGamma(s));
  const vis = anchored ? 1 : starVis(rawP);
  if (vis <= 0.01) return;
  const p0 = mapxy(s.x, s.y, r, w, h);
  const center = mapxy(motionX() * S.src.width, motionY() * S.src.height, r, w, h);
  const v = screenVectorFromCenter(p0, center, w, h);
  const distance = v.dist * tierDistance(s);
  const spriteGrowth = 1 + (S.grow || 0) * p * (s.tier === 3 ? 1.25 : s.tier === 2 ? 1 : 0.7);
  const scale = w / r.sw * spriteGrowth;
  const x = p0.x + v.dx * distance * p, y = p0.y + v.dy * distance * p;
  if (x < -340 || y < -340 || x > w + 340 || y > h + 340) return;
  const userBright = cl(S.starBright || 1, 0.35, 2.25), tBright = tierBright(s);
  const alpha = cl(vis * alphaScale * userBright * tBright, 0, 1);
  const filterBright = cl(1.75 + 0.55 * userBright * tBright, 1.35, 3.35);
  g.save();
  g.globalAlpha *= alpha;
  g.globalCompositeOperation = 'lighter';
  g.filter = `brightness(${filterBright.toFixed(2)}) contrast(1.18) saturate(1.12)`;
  g.drawImage(img, x - s.ax * scale, y - s.ay * scale, s.w * scale, s.h * scale);
  g.restore();
}

function drawStatic(g, s, r, w, h, boost = false) {
  const img = s.img || s.sp;
  if (!img) return;
  const p = mapxy(s.x, s.y, r, w, h), scale = w / r.sw * (boost ? 1.25 : 1);
  if (p.x < -280 || p.y < -280 || p.x > w + 280 || p.y > h + 280) return;
  g.save();
  if (boost) g.filter = 'brightness(2.1) contrast(1.15)';
  g.drawImage(img, p.x - s.ax * scale, p.y - s.ay * scale, s.w * scale, s.h * scale);
  g.restore();
}

function drawStars(g, list, r, w, h, t, moving = false, boost = false) {
  if (!list || !list.length) return;
  for (const s of list) {
    if (!moving) { drawStatic(g, s, r, w, h, boost); continue; }
    if (S.anchorPreview) { drawMoving(g, s, r, w, h, 0, 1, 0); continue; }
    const p = starPhase(s, t);
    drawMoving(g, s, r, w, h, t, 1, p);
    if (p > 0.82) {
      const np = (p - 0.82) / 0.18 * 0.075;
      drawMoving(g, s, r, w, h, t, 0.55 * smooth(0.82, 0.91, p), np);
    }
  }
}

function drawFrame088(c, t = 0) {
  if (!S.src) return;
  const g = c.getContext('2d'), w = c.width, h = c.height;
  const bg = S.framing ? S.src : (S.motionBg || S.src);
  const r = srcRect(bg, w, h, S.framing ? 0 : t);
  const mr = motionRect(S.src, w, h);
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#000';
  g.fillRect(0, 0, w, h);
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(bg, r.sx, r.sy, r.sw, r.sh, 0, 0, w, h);
  if (!S.framing) drawStars(g, S.movers || [], mr, w, h, t, true, false);
}

function render088(t = 0) {
  if (!S.src) return;
  const c = $('main'), vd = viewDims();
  size(vd.w, vd.h);
  const g = c.getContext('2d'), mode = S.preview || 'final', mr = motionRect(S.src, c.width, c.height);
  g.clearRect(0, 0, c.width, c.height);
  if (mode === 'mask' && S.mask && S.mask.canvas) {
    const r = srcRect(S.mask.canvas, c.width, c.height, 0);
    g.drawImage(S.mask.canvas, r.sx, r.sy, r.sw, r.sh, 0, 0, c.width, c.height);
  } else if (mode === 'starless' && (S.motionBg || S.starless)) {
    const bg = S.motionBg || S.starless, r = srcRect(bg, c.width, c.height, 0);
    g.drawImage(bg, r.sx, r.sy, r.sw, r.sh, 0, 0, c.width, c.height);
  } else if (mode === 'stars') {
    g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height); drawStars(g, S.suppressedStars || [], mr, c.width, c.height, 0, false, true);
  } else if (mode === 'moving') {
    g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height); drawStars(g, S.movers || [], mr, c.width, c.height, t, true, true);
  } else {
    drawFrame088(c, t);
  }
  S.last = t || 0;
  labels();
  updateTarget();
}

function installRenderOverride() { if (window.DSD_DRAW_FRAME !== drawFrame088) window.DSD_DRAW_FRAME = drawFrame088; try { render = render088; } catch (e) {} }
function render(t = 0) { render088(t); }

function updateTarget() {
  const m = $('target'), h = document.querySelector('.targethint'), c = $('main'), v = document.querySelector('.view');
  if (!m || !c || !v || !S.src) { if (m) m.style.display = 'none'; if (h) h.style.display = 'none'; return; }
  const cr = c.getBoundingClientRect(), vr = v.getBoundingClientRect(), rr = srcRect(S.src, c.width, c.height, 0);
  const pt = mapxy(motionX() * S.src.width, motionY() * S.src.height, rr, c.width, c.height);
  m.style.left = (cr.left - vr.left + pt.x) + 'px';
  m.style.top = (cr.top - vr.top + pt.y) + 'px';
  m.style.display = 'block';
  if (h) h.style.display = 'block';
}

function autoCenter() {
  if (!S.src) return;
  try {
    const w = S.src.width, h = S.src.height, g = S.src.getContext('2d', { willReadFrequently: true }), data = g.getImageData(0, 0, w, h).data;
    let hist = new Array(64).fill(0);
    for (let i = 0; i < data.length; i += 16) {
      const L = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      hist[Math.min(63, L >> 2)]++;
    }
    let total = hist.reduce((a, b) => a + b, 0), acc = 0, bin = 50;
    for (let i = 63; i >= 0; i--) { acc += hist[i]; if (acc > total * 0.015) { bin = i; break; } }
    const thr = Math.max(35, bin * 4);
    let sx = 0, sy = 0, sw = 0;
    for (let y = 0, p = 0; y < h; y++) for (let x = 0; x < w; x++, p += 4) {
      const L = 0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2];
      if (L >= thr && L < 245) {
        const wt = (L - thr + 1) * (1 - Math.abs(x / w - 0.5) * 0.25) * (1 - Math.abs(y / h - 0.5) * 0.25);
        sx += x * wt; sy += y * wt; sw += wt;
      }
    }
    if (sw > 0) {
      const ax = cl(sx / sw / w, 0.08, 0.92), ay = cl(sy / sw / h, 0.08, 0.92);
      S.cx = S.frameCx = S.motionCx = ax;
      S.cy = S.frameCy = S.motionCy = ay;
      S.anchorPreview = 1;
      updateTarget();
      ga('auto_center_set', { cx: Number(ax.toFixed(3)), cy: Number(ay.toFixed(3)) });
    }
  } catch (e) {}
}

function markPreset(key) { document.querySelectorAll('[data-preset-key]').forEach(b => { const on = b.dataset.presetKey === key; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); }); }
function markIntensity(key) { document.querySelectorAll('[data-intensity]').forEach(b => { const on = b.dataset.intensity === key; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); }); }
function markViewMode(key) { document.querySelectorAll('[data-view-mode]').forEach(b => { const on = b.dataset.viewMode === key; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); }); }

function applyViewMode(key) {
  S.viewMode = key === 'reel916' ? 'reel916' : 'original';
  if (S.viewMode === 'reel916') setVal('preset', 'portrait');
  S.anchorPreview = 1;
  S.last = 0;
  S.start = 0;
  markViewMode(S.viewMode);
  read();
  if (S.src) render088(0);
  ga('view_mode_selected', { view_mode: S.viewMode });
  st(S.viewMode === 'reel916' ? '9:16 Reel view active' : 'Original view active');
}

function applyPreset(key, source = 'user') {
  const p = PRESETS[key];
  if (!p) return;
  setVal('strict', p.strict); setVal('max', p.max); setVal('move', p.move); setVal('rad', p.rad); setVal('bias', p.bias);
  setVal('fly', p.fly); setVal('travel', p.travel); setVal('accel', p.accel); setVal('starBright', p.starBright); setVal('grow', p.grow); setVal('zoom', p.zoom); setVal('dur', p.dur); setVal('preset', p.preset);
  S.lastPreset = p.name;
  markPreset(key);
  read();
  if (S.map && window.DSD_RESELECT_MOVERS) window.DSD_RESELECT_MOVERS(); else if (S.src) render088(S.last || 0);
  st(`${p.name} preset applied`);
  ga('preset_selected', { preset: p.name, source });
}

function applyIntensity(key) {
  const p = INTENSITY[key];
  if (!p) return;
  setVal('fly', p.fly); setVal('travel', p.travel); setVal('accel', p.accel); setVal('grow', p.grow); setVal('move', p.move);
  S.lastIntensity = key;
  markIntensity(key);
  read();
  if (S.map && window.DSD_RESELECT_MOVERS) window.DSD_RESELECT_MOVERS(); else if (S.src) render088(S.last || 0);
  ga('intensity_selected', { intensity: key });
  st(`${key[0].toUpperCase() + key.slice(1)} motion applied`);
}

function showSuccess(name) {
  const s = $('success');
  if (!s) return;
  s.classList.add('show');
  const n = $('successName');
  if (n) n.textContent = String(name || S.lastExportName || 'movie').replace(/v0\.9\.2/g, APP_VERSION).replace(/v0\.9\.1/g, APP_VERSION).replace(/v0\.8\.\d/g, APP_VERSION);
  setTimeout(() => { try { s.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {} }, 60);
  ga('export_panel_shown');
}

function hideSuccess() { const s = $('success'); if (s) s.classList.remove('show'); }
function clearAnchor() { S.anchorPreview = 0; S.last = 0; S.start = 0; }

async function shareLast() {
  ga('share_clicked', { has_blob: !!S.lastExportBlob });
  try {
    if (S.lastExportBlob && navigator.share) {
      const file = new File([S.lastExportBlob], S.lastExportName || 'deepsky-drift.mp4', { type: S.lastExportBlob.type || 'video/mp4' });
      if (!navigator.canShare || navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'DeepSkyDrift', text: 'I made my astrophotography image move with DeepSkyDrift' }); return; }
    }
    if (navigator.share) { await navigator.share({ title: 'DeepSkyDrift', text: 'Create motion videos from astrophotography images', url: location.href }); return; }
    await navigator.clipboard.writeText(location.href);
    st('Link copied');
  } catch (e) { st('Share canceled or unavailable'); }
}

async function build() { st('Star engine is still loading. Try again in a moment.'); }
build._placeholder = true;

function autoExtract() {
  window.DSD_PENDING_AUTO_EXTRACT = true;
  let tries = 0;
  const go = () => {
    installRenderOverride();
    if (!S.src || S.map) return;
    if (typeof window.build === 'function' && !window.build._placeholder) { window.DSD_PENDING_AUTO_EXTRACT = false; window.build(); setTimeout(installRenderOverride, 300); return; }
    if (typeof build === 'function' && !build._placeholder) { window.DSD_PENDING_AUTO_EXTRACT = false; build(); setTimeout(installRenderOverride, 300); return; }
    if (tries++ < 60) setTimeout(go, 100);
  };
  setTimeout(go, 120);
}

async function load(file) {
  if (!file) return;
  const url = URL.createObjectURL(file), im = new Image();
  im.onload = () => {
    URL.revokeObjectURL(url);
    let w = im.naturalWidth, h = im.naturalHeight, ow = w, oh = h;
    if (Math.max(w, h) > MAX_IMAGE_DIM) { const s = MAX_IMAGE_DIM / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
    const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h);
    S.loadCount = (S.loadCount || 0) + 1;
    Object.assign(S, { src: c, starless: null, starsOnly: null, mask: null, stars: [], statics: [], movers: [], suppressedStars: [], motionBg: null, motionMask: null, has: 1, map: 0, cx: 0.5, cy: 0.5, frameCx: 0.5, frameCy: 0.5, motionCx: 0.5, motionCy: 0.5, anchorPreview: 1, framing: 0, play: 0, start: 0, last: 0 });
    hideSuccess();
    autoCenter();
    const d = $('drop'); if (d) d.style.display = 'none';
    const b = $('build'); if (b) { b.disabled = false; b.textContent = 'Extracting Stars…'; }
    const p = $('play'), mp = $('mobilePlay'), e = $('export'), mx = $('mobileExport');
    if (p) p.disabled = true; if (mp) mp.disabled = true; if (e) e.disabled = true; if (mx) mx.disabled = true;
    const s = $('stats'); if (s) { s.style.display = 'none'; s.textContent = ''; }
    const dim = $('dim'); if (dim) dim.textContent = ow === w && oh === h ? `${w}×${h}` : `${ow}×${oh}→${w}×${h}`;
    render088(0);
    st('Image loaded · extracting stars…');
    ga('image_loaded', { load_number: S.loadCount });
    if (S.loadCount > 1) ga('second_image_loaded', { load_number: S.loadCount });
    autoExtract();
  };
  im.onerror = () => { URL.revokeObjectURL(url); st('Could not load image'); };
  im.src = url;
}

function syncMobileActions() {
  const p = $('play'), mp = $('mobilePlay'), x = $('export'), mx = $('mobileExport');
  if (mp && p) { mp.disabled = p.disabled; mp.textContent = p.textContent || '▶ Play'; }
  if (mx && x) mx.disabled = x.disabled;
}

function play() {
  installRenderOverride();
  if (!S.map) return;
  S.play = !S.play;
  const b = $('play');
  if (S.play) {
    clearAnchor();
    read();
    if (b) b.textContent = '⏸ Pause';
    S.start = 0;
    loop(performance.now());
    ga('preview_play');
  } else {
    if (b) b.textContent = '▶ Play';
    cancelAnimationFrame(S.raf);
  }
  syncMobileActions();
}

function loop(ts) {
  if (!S.play) return;
  if (!S.start) S.start = ts - (S.last || 0) * 1000;
  render088((ts - S.start) / 1000);
  S.raf = requestAnimationFrame(loop);
}

async function exp() {
  if (!S.map || !window.MediaRecorder) return;
  installRenderOverride();
  clearAnchor();
  read();
  if (S.play) play();
  ga('export_started', { duration: S.dur, aspect: dims().l, preset: S.lastPreset || '', view_mode: S.viewMode });
  const mt = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t));
  if (!mt) { st('No supported recording format found.'); return; }
  const d = dims(), ext = mt.includes('mp4') ? 'mp4' : 'webm', c = document.createElement('canvas');
  c.width = d.w; c.height = d.h;
  c.style.cssText = `position:fixed;left:0;top:0;width:${d.w}px;height:${d.h}px;opacity:0.01;pointer-events:none;background:#000;z-index:9999`;
  document.body.appendChild(c);
  const old = S.preview; S.preview = 'final';
  const eb = $('export'), pb = $('play'), mb = $('mobilePlay'), me = $('mobileExport');
  if (eb) eb.disabled = true; if (pb) pb.disabled = true; if (mb) mb.disabled = true; if (me) me.disabled = true;
  drawFrame088(c, 0);
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  let stream;
  try { stream = c.captureStream(0); } catch (e) { stream = c.captureStream(FPS); }
  const trackObj = stream.getVideoTracks()[0], rec = new MediaRecorder(stream, { mimeType: mt, videoBitsPerSecond: 18000000 }), chunks = [];
  rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  const done = new Promise(r => rec.onstop = r), frames = Math.max(1, Math.round((S.dur || 10) * FPS)), ms = 1000 / FPS, start = performance.now();
  prog('Exporting movie', 0, `${d.w}×${d.h} · ${S.dur}s · ${APP_VERSION}`);
  rec.start(250);
  for (let f = 0; f < frames; f++) {
    const target = start + f * ms, now = performance.now();
    if (target > now) await wait(Math.max(0, target - now));
    const seconds = f / FPS;
    drawFrame088(c, seconds);
    if (trackObj && trackObj.requestFrame) trackObj.requestFrame();
    if (f % 15 === 0 || f === frames - 1) { const pct = Math.round((f + 1) / frames * 100); prog('Exporting movie', pct, `${pct}% · deterministic ${FPS} fps draw`); }
  }
  await wait(140);
  rec.stop();
  await done;
  S.preview = old;
  document.body.removeChild(c);
  const blob = new Blob(chunks, { type: mt }), u = URL.createObjectURL(blob), a = document.createElement('a'), fname = `deepsky-drift-${APP_VERSION}-${d.l}-${S.dur}s.${ext}`;
  S.lastExportBlob = blob; S.lastExportName = fname;
  hide();
  if (eb) eb.disabled = false; if (pb) pb.disabled = false; if (mb) mb.disabled = false; if (me) me.disabled = false;
  render088(S.last || 0);
  showSuccess(fname);
  st(`Download ready · ${APP_VERSION}`);
  a.href = u; a.download = fname;
  setTimeout(() => { try { a.click(); } catch (e) {} }, 180);
  setTimeout(() => URL.revokeObjectURL(u), 5000);
  ga('export_completed', { duration: S.dur, aspect: d.l, bytes: blob.size, view_mode: S.viewMode });
}

function canvasSourcePoint(e) {
  if (!S.src) return null;
  const c = $('main'); if (!c) return null;
  const b = c.getBoundingClientRect(); if (!b.width || !b.height) return null;
  const nx = (e.clientX - b.left) / b.width, ny = (e.clientY - b.top) / b.height;
  if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return null;
  const r = srcRect(S.src, c.width, c.height, 0);
  return { x: r.sx + nx * r.sw, y: r.sy + ny * r.sh, nx, ny, rect: r, box: b };
}

function center(e) {
  const p = canvasSourcePoint(e);
  if (!p) return;
  S.motionCx = S.cx = cl(p.x / S.src.width, 0.04, 0.96);
  S.motionCy = S.cy = cl(p.y / S.src.height, 0.04, 0.96);
  S.anchorPreview = 1;
  S.last = 0;
  S.start = 0;
  render088(0);
  ga('center_set', { cx: Number(S.motionCx.toFixed(3)), cy: Number(S.motionCy.toFixed(3)), view_mode: S.viewMode });
  st('Motion center set');
}

function panStart(e) {
  if (!S.src) return;
  const p = canvasSourcePoint(e);
  if (!p) return;
  const c = $('main');
  if (S.viewMode === 'reel916') { e.preventDefault(); S.framing = 1; }
  Pan = { id: e.pointerId, x: e.clientX, y: e.clientY, frameCx: frameX(), frameCy: frameY(), rect: p.rect, w: c.width, h: c.height, moved: false };
  try { c.setPointerCapture(e.pointerId); } catch (err) {}
  if (S.viewMode === 'reel916') render088(0);
}

function panMove(e) {
  if (!Pan || e.pointerId !== Pan.id || !S.src) return;
  const dx = e.clientX - Pan.x, dy = e.clientY - Pan.y;
  if (Math.abs(dx) + Math.abs(dy) < 8 && !Pan.moved) return;
  Pan.moved = true;
  if (S.viewMode === 'reel916') {
    e.preventDefault();
    S.frameCx = cl(Pan.frameCx - dx / Pan.w * Pan.rect.sw / S.src.width, 0.04, 0.96);
    S.frameCy = cl(Pan.frameCy - dy / Pan.h * Pan.rect.sh / S.src.height, 0.04, 0.96);
    render088(0);
    st('9:16 frame repositioned');
  }
}

function panEnd(e) {
  if (!Pan || e.pointerId !== Pan.id) return;
  const moved = Pan.moved;
  Pan = null;
  S.framing = 0;
  if (!moved) center(e); else render088(S.last || 0);
}

function openMenu() { const m = $('appMenu'), b = $('menuBtn'); if (m) { m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); } if (b) b.setAttribute('aria-expanded', 'true'); }
function closeMenu() { const m = $('appMenu'), b = $('menuBtn'); if (m) { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); } if (b) b.setAttribute('aria-expanded', 'false'); }
function openAbout() { closeMenu(); const a = $('aboutPanel'); if (a) { a.classList.add('open'); a.setAttribute('aria-hidden', 'false'); } }
function closeAbout() { const a = $('aboutPanel'); if (a) { a.classList.remove('open'); a.setAttribute('aria-hidden', 'true'); } }
function chooseFile() { const f = $('file'); if (f) f.click(); }
function toggleOptions() { document.body.classList.toggle('controls-open'); }
function closeOptions() { document.body.classList.remove('controls-open'); }

function wire() {
  labels();
  updateTarget();
  markViewMode(S.viewMode);
  applyPreset('cinematic', 'default');
  markIntensity('cinematic');

  $('menuBtn')?.addEventListener('click', openMenu);
  $('menuClose')?.addEventListener('click', closeMenu);
  $('menuScrim')?.addEventListener('click', closeMenu);
  $('drawerTab')?.addEventListener('click', toggleOptions);
  $('browse')?.addEventListener('click', chooseFile);
  $('loadTop')?.addEventListener('click', chooseFile);
  $('mobileLoad')?.addEventListener('click', chooseFile);
  $('aboutLoad')?.addEventListener('click', () => { closeAbout(); chooseFile(); });
  $('aboutClose')?.addEventListener('click', closeAbout);
  $('aboutScrim')?.addEventListener('click', closeAbout);

  const file = $('file');
  if (file) file.onchange = e => load(e.target.files[0]);
  const drop = $('drop');
  if (drop) { drop.ondragover = e => e.preventDefault(); drop.ondrop = e => { e.preventDefault(); load(e.dataTransfer.files[0]); }; }

  $('build')?.addEventListener('click', () => build());
  $('play')?.addEventListener('click', () => play());
  $('mobilePlay')?.addEventListener('click', () => { const p = $('play'); if (p && !p.disabled) p.click(); });
  $('export')?.addEventListener('click', () => exp());
  $('mobileExport')?.addEventListener('click', () => { const x = $('export'); if (x && !x.disabled) x.click(); });

  document.querySelectorAll('[data-menu-action]').forEach(x => x.addEventListener('click', () => { const a = x.getAttribute('data-menu-action'); if (a === 'load') { closeMenu(); chooseFile(); } else if (a === 'about') openAbout(); }));
  document.querySelectorAll('[data-preset-key]').forEach(btn => btn.addEventListener('click', () => applyPreset(btn.dataset.presetKey)));
  document.querySelectorAll('[data-intensity]').forEach(btn => btn.addEventListener('click', () => applyIntensity(btn.dataset.intensity)));
  document.querySelectorAll('[data-view-mode]').forEach(btn => btn.addEventListener('click', () => applyViewMode(btn.dataset.viewMode)));

  $('again')?.addEventListener('click', () => { chooseFile(); ga('create_another_clicked'); });
  $('share')?.addEventListener('click', () => shareLast());
  $('makeVertical')?.addEventListener('click', () => { applyViewMode('reel916'); ga('export_variant_clicked', { variant: 'portrait' }); exp(); });
  $('makeSlow')?.addEventListener('click', () => { applyPreset('meditation', 'success_panel'); ga('export_variant_clicked', { variant: 'meditation' }); exp(); });

  for (const id of ['strict', 'max', 'rad', 'fly', 'travel', 'accel', 'starBright', 'grow', 'zoom', 'dur']) {
    const e = $(id); if (e) e.oninput = () => { read(); render088(S.last || 0); };
  }
  const mv = $('move'); if (mv) mv.oninput = () => { read(); if (window.DSD_RESELECT_MOVERS) window.DSD_RESELECT_MOVERS(); };
  const bias = $('bias'); if (bias) bias.oninput = () => { read(); if (window.DSD_RESELECT_MOVERS) window.DSD_RESELECT_MOVERS(); };
  const prev = $('preview'); if (prev) prev.oninput = () => { read(); render088(S.last || 0); };
  const preset = $('preset'); if (preset) preset.oninput = () => { read(); render088(S.last || 0); };

  const ct = $('centerToggle');
  if (ct) {
    document.body.classList.toggle('show-center-marker', ct.checked);
    ct.addEventListener('change', () => { document.body.classList.toggle('show-center-marker', ct.checked); updateTarget(); });
  }

  const view = document.querySelector('.view');
  if (view) {
    view.addEventListener('pointerdown', panStart, { passive: false });
    view.addEventListener('pointermove', panMove, { passive: false });
    view.addEventListener('pointerup', panEnd, { passive: false });
    view.addEventListener('pointercancel', () => { Pan = null; S.framing = 0; }, { passive: true });
  }

  const app = $('app');
  if (app) app.addEventListener('click', ev => { if (document.body.classList.contains('controls-open') && ev.target.closest('main')) closeOptions(); });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') { closeMenu(); closeAbout(); closeOptions(); } });
  window.onresize = () => S.src && render088(S.last || 0);
  setInterval(() => { labels(); syncMobileActions(); installRenderOverride(); }, 500);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
