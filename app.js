const APP_VERSION = 'v0.8.1';
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
  has: 0,
  map: 0,
  cx: 0.5,
  cy: 0.5,
  strict: 0.7,
  max: 2200,
  move: 260,
  rad: 2.5,
  bias: 'balanced',
  fly: 0.65,
  grow: 0.12,
  zoom: 0.05,
  dur: 10,
  preview: 'final',
  play: 0,
  raf: 0,
  start: 0,
  last: 0
};

function cl(x, a, b) { return Math.max(a, Math.min(b, x)); }
function st(text) { const el = $('status'); if (el) el.textContent = text; }
function wait(ms = 20) { return new Promise(resolve => setTimeout(resolve, ms)); }

function prog(title, pct, label) {
  const ol = $('ol');
  if (ol) ol.style.display = 'grid';
  const t = $('olt');
  const f = $('fill');
  const l = $('oll');
  if (t) t.textContent = title;
  if (f) f.style.width = cl(pct, 0, 100) + '%';
  if (l) l.textContent = label || '';
  st(label || title);
}

function hide() {
  const ol = $('ol');
  if (ol) ol.style.display = 'none';
}

function dims() {
  const preset = $('preset') ? $('preset').value : 'portrait';
  if (preset === 'landscape') return { w: 1920, h: 1080, l: '16x9' };
  if (preset === 'square') return { w: 1080, h: 1080, l: '1x1' };
  return { w: 1080, h: 1920, l: '9x16' };
}

function updExportInfo() {
  const d = dims();
  const el = $('exinfo');
  if (el) el.textContent = `Export target: ${d.w}×${d.h} at ${FPS} fps · browser may downscale`;
}

function setVersionUI() {
  const ver = document.querySelector('.ver');
  if (ver) ver.textContent = APP_VERSION;
  const warn = document.querySelector('.warn');
  if (warn) warn.textContent = `${APP_VERSION} · Detail-safe star extraction and parallax.`;
  const badge = $('badge');
  if (badge && (!S.map || !S.stars.length)) badge.textContent = `${APP_VERSION} · star extraction ready`;
}

function readControls() {
  const strict = $('strict'); if (strict) S.strict = Number(strict.value) / 100;
  const max = $('max'); if (max) S.max = Number(max.value);
  const move = $('move'); if (move) S.move = Number(move.value);
  const rad = $('rad'); if (rad) S.rad = Number(rad.value) / 100;
  const bias = $('bias'); if (bias) S.bias = bias.value;
  const preview = $('preview'); if (preview) S.preview = preview.value;
  const fly = $('fly'); if (fly) S.fly = Number(fly.value) / 100;
  const grow = $('grow'); if (grow) S.grow = Number(grow.value) / 100;
  const zoom = $('zoom'); if (zoom) S.zoom = Number(zoom.value) / 100;
  const dur = $('dur'); if (dur) S.dur = Number(dur.value);
}

function syncControlLabels() {
  const strict = $('strict'); if (strict) $('sv') && ($('sv').textContent = strict.value + '%');
  const max = $('max'); if (max) $('xv') && ($('xv').textContent = max.value);
  const move = $('move'); if (move) $('mv') && ($('mv').textContent = move.value);
  const rad = $('rad'); if (rad) $('rv') && ($('rv').textContent = (Number(rad.value) / 100).toFixed(1) + '×');
  const fly = $('fly'); if (fly) $('fv') && ($('fv').textContent = (Number(fly.value) / 100).toFixed(2) + '×');
  const grow = $('grow'); if (grow) $('gv') && ($('gv').textContent = (Number(grow.value) / 100).toFixed(2) + '×');
  const zoom = $('zoom'); if (zoom) $('zv') && ($('zv').textContent = zoom.value + '%');
  const dur = $('dur'); if (dur) $('tv') && ($('tv').textContent = dur.value + 's');
  updExportInfo();
}

function size(w, h) {
  const view = document.querySelector('.view');
  const canvas = $('main');
  if (!view || !canvas) return;
  const vw = Math.max(1, view.clientWidth - 2);
  const vh = Math.max(1, view.clientHeight - 2);
  const aspect = w / h;
  let cw, ch;
  if (vw / vh > aspect) { ch = vh; cw = ch * aspect; }
  else { cw = vw; ch = cw / aspect; }
  canvas.width = Math.max(1, Math.round(cw));
  canvas.height = Math.max(1, Math.round(ch));
  canvas.style.display = 'block';
}

function fitRect(img, W, H, cover = false, t = 0) {
  const zoom = 1 + (S.zoom || 0) * t;
  const ia = img.width / img.height;
  const oa = W / H;
  let dw, dh;
  if (cover ? oa > ia : oa < ia) { dw = W * zoom; dh = (W / ia) * zoom; }
  else { dh = H * zoom; dw = (H * ia) * zoom; }
  let x = (W - dw) / 2;
  let y = (H - dh) / 2;
  if (cover || zoom > 1) {
    x = cl(W / 2 - (S.cx == null ? 0.5 : S.cx) * dw, W - dw, 0);
    y = cl(H / 2 - (S.cy == null ? 0.5 : S.cy) * dh, H - dh, 0);
  }
  return { x, y, w: dw, h: dh };
}

function drawBase(canvas, t = 0, fit = 'contain') {
  if (!S.src || !canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const rect = fitRect(S.src, W, H, fit === 'cover', t);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(S.src, rect.x, rect.y, rect.w, rect.h);
}

function render(t = 0) {
  if (!S.src) return;
  const canvas = $('main');
  size(S.src.width, S.src.height);
  drawBase(canvas, t, 'contain');
  S.last = t || 0;
}

async function load(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    URL.revokeObjectURL(url);
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    const ow = w;
    const oh = h;
    if (Math.max(w, h) > MAX_IMAGE_DIM) {
      const scale = MAX_IMAGE_DIM / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    Object.assign(S, {
      src: canvas,
      starless: null,
      starsOnly: null,
      mask: null,
      stars: [],
      statics: [],
      movers: [],
      suppressedStars: [],
      has: 1,
      map: 0,
      cx: 0.5,
      cy: 0.5,
      play: 0,
      start: 0,
      last: 0
    });
    const drop = $('drop'); if (drop) drop.style.display = 'none';
    const buildBtn = $('build'); if (buildBtn) { buildBtn.disabled = false; buildBtn.textContent = 'Extract Stars'; }
    const playBtn = $('play'); if (playBtn) playBtn.disabled = true;
    const exportBtn = $('export'); if (exportBtn) exportBtn.disabled = true;
    const stats = $('stats'); if (stats) { stats.style.display = 'none'; stats.textContent = ''; }
    const dim = $('dim'); if (dim) dim.textContent = ow === w && oh === h ? `${w}×${h}` : `${ow}×${oh}→${w}×${h}`;
    size(w, h);
    render(0);
    st('Image loaded · click Extract Stars');
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    st('Could not load image.');
  };
  img.src = url;
}

async function build() {
  st('Star engine is still loading. Try again in a moment.');
}

function play() {
  if (!S.map) return;
  S.play = !S.play;
  const btn = $('play');
  if (S.play) {
    if (btn) btn.textContent = '⏸ Pause';
    S.start = 0;
    loop(performance.now());
  } else {
    if (btn) btn.textContent = '▶ Play';
    cancelAnimationFrame(S.raf);
  }
}

function loop(ts) {
  if (!S.play) return;
  if (!S.start) S.start = ts - (S.last || 0) * (S.dur || 10) * 1000;
  render(((ts - S.start) / ((S.dur || 10) * 1000)) % 1);
  S.raf = requestAnimationFrame(loop);
}

async function exp() {
  if (!S.map || !window.MediaRecorder) return;
  readControls();
  if (S.play) play();
  const mimeType = [
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm'
  ].find(type => MediaRecorder.isTypeSupported(type));
  if (!mimeType) {
    st('No supported recording format found.');
    return;
  }

  const d = dims();
  const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
  const canvas = document.createElement('canvas');
  canvas.width = d.w;
  canvas.height = d.h;
  canvas.style.cssText = `position:fixed;left:0;top:0;width:${d.w}px;height:${d.h}px;opacity:0.01;pointer-events:none;background:#000;z-index:9999`;
  document.body.appendChild(canvas);

  const oldPreview = S.preview;
  S.preview = 'final';
  const drawFrame = window.DSD_DRAW_FRAME || ((c, t) => drawBase(c, t, 'cover'));
  const exportBtn = $('export');
  const playBtn = $('play');
  if (exportBtn) exportBtn.disabled = true;
  if (playBtn) playBtn.disabled = true;

  drawFrame(canvas, 0, 'cover');
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const stream = canvas.captureStream(FPS);
  const track = stream.getVideoTracks()[0];
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 18000000 });
  const chunks = [];
  recorder.ondataavailable = event => { if (event.data && event.data.size) chunks.push(event.data); };
  const done = new Promise(resolve => { recorder.onstop = resolve; });

  const totalFrames = Math.max(1, Math.round((S.dur || 10) * FPS));
  const frameMs = 1000 / FPS;
  const start = performance.now();

  prog('Exporting movie', 0, `${d.w}×${d.h} · ${S.dur}s · ${APP_VERSION}`);
  recorder.start(250);
  for (let frame = 0; frame < totalFrames; frame++) {
    const target = start + frame * frameMs;
    const now = performance.now();
    if (target > now) await wait(Math.max(0, target - now));
    const t = frame / totalFrames;
    drawFrame(canvas, t, 'cover');
    if (track && track.requestFrame) track.requestFrame();
    if (frame % 3 === 0 || frame === totalFrames - 1) {
      const pct = Math.round((frame + 1) / totalFrames * 100);
      prog('Exporting movie', pct, `${pct}% · ${FPS} fps · requested ${d.w}×${d.h}`);
    }
  }

  await wait(120);
  recorder.stop();
  await done;

  S.preview = oldPreview;
  document.body.removeChild(canvas);
  const blob = new Blob(chunks, { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `deepsky-drift-${APP_VERSION}-${d.l}-${S.dur}s.${ext}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);

  hide();
  if (exportBtn) exportBtn.disabled = false;
  if (playBtn) playBtn.disabled = false;
  render(S.last || 0);
  st(`Download ready · ${APP_VERSION}`);
}

function setZoomCenter(e) {
  if (!S.src) return;
  const canvas = $('main');
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  if (x < 0 || x > 1 || y < 0 || y > 1) return;
  S.cx = cl(x, 0.04, 0.96);
  S.cy = cl(y, 0.04, 0.96);
  render(S.last || 0);
  st('Zoom center set');
}

function wire() {
  setVersionUI();
  syncControlLabels();

  const browse = $('browse'); if (browse) browse.onclick = () => $('file') && $('file').click();
  const file = $('file'); if (file) file.onchange = e => load(e.target.files[0]);
  const drop = $('drop');
  if (drop) {
    drop.ondragover = e => e.preventDefault();
    drop.ondrop = e => { e.preventDefault(); load(e.dataTransfer.files[0]); };
  }
  const buildBtn = $('build'); if (buildBtn) buildBtn.onclick = () => build();
  const playBtn = $('play'); if (playBtn) playBtn.onclick = () => play();
  const exportBtn = $('export'); if (exportBtn) exportBtn.onclick = () => exp();
  const reset = $('reset'); if (reset) reset.onclick = () => location.reload();

  const strict = $('strict'); if (strict) strict.oninput = e => { S.strict = Number(e.target.value) / 100; syncControlLabels(); };
  const max = $('max'); if (max) max.oninput = e => { S.max = Number(e.target.value); syncControlLabels(); };
  const move = $('move'); if (move) move.oninput = e => { S.move = Number(e.target.value); syncControlLabels(); if (window.DSD_RESELECT_MOVERS) window.DSD_RESELECT_MOVERS(); };
  const rad = $('rad'); if (rad) rad.oninput = e => { S.rad = Number(e.target.value) / 100; syncControlLabels(); };
  const bias = $('bias'); if (bias) bias.oninput = e => { S.bias = e.target.value; if (window.DSD_RESELECT_MOVERS) window.DSD_RESELECT_MOVERS(); };
  const preview = $('preview'); if (preview) preview.oninput = e => { S.preview = e.target.value; render(S.last || 0); };
  const fly = $('fly'); if (fly) fly.oninput = e => { S.fly = Number(e.target.value) / 100; syncControlLabels(); render(S.last || 0); };
  const grow = $('grow'); if (grow) grow.oninput = e => { S.grow = Number(e.target.value) / 100; syncControlLabels(); render(S.last || 0); };
  const zoom = $('zoom'); if (zoom) zoom.oninput = e => { S.zoom = Number(e.target.value) / 100; syncControlLabels(); render(S.last || 0); };
  const dur = $('dur'); if (dur) dur.oninput = e => { S.dur = Number(e.target.value); syncControlLabels(); };
  const preset = $('preset'); if (preset) preset.oninput = updExportInfo;

  const view = document.querySelector('.view');
  if (view) view.addEventListener('pointerdown', setZoomCenter, { passive: true });
  window.onresize = () => S.src && render(S.last || 0);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
else wire();
