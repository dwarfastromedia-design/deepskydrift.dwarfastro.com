(function(){
  'use strict';

  const FIX_VERSION = 'v0.8.1';
  window.DSD_LIVE_VERSION = FIX_VERSION;

  const $ = id => document.getElementById(id);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const FPS = 30;

  function hasState(){
    try { return typeof S !== 'undefined' && S && S.src; }
    catch(e) { return false; }
  }

  function setText(id, text){ const el = $(id); if (el) el.textContent = text; }
  function status(text){ setText('status', text); }

  function showProgress(title, pct, label){
    const ol = $('ol'); if (ol) ol.style.display = 'grid';
    setText('olt', title);
    const fill = $('fill'); if (fill) fill.style.width = clamp(pct, 0, 100) + '%';
    setText('oll', label || '');
    status(label || title);
  }

  function hideProgress(){ const ol = $('ol'); if (ol) ol.style.display = 'none'; }

  function dims(){
    const preset = $('preset') ? $('preset').value : 'portrait';
    if (preset === 'landscape') return { w: 1920, h: 1080, l: '16x9' };
    if (preset === 'square') return { w: 1080, h: 1080, l: '1x1' };
    return { w: 1080, h: 1920, l: '9x16' };
  }

  function labelUI(){
    const ver = document.querySelector('.ver'); if (ver) ver.textContent = FIX_VERSION;
    const badge = $('badge'); if (badge) badge.textContent = FIX_VERSION + ' · detail-safe star parallax';
    const warn = document.querySelector('.warn'); if (warn) warn.textContent = FIX_VERSION + ' · Detail-safe final render. Starless layer is diagnostic only.';
    const build = $('build'); if (build) build.textContent = hasState() && S.map ? 'Re-extract Stars' : 'Extract Stars';
    const exp = $('export'); if (exp) exp.textContent = 'Export Video';
    const h2 = document.querySelector('.simpletop h2'); if (h2) h2.textContent = 'Extract stars';
    const p = document.querySelector('.simpletop p'); if (p) p.textContent = 'Load an image, extract stars, then preview or export the detail-safe motion render.';
    document.querySelectorAll('details.advanced').forEach(d => { d.open = true; });
    const summary = document.querySelector('details.advanced summary'); if (summary) summary.textContent = 'Star extraction and diagnostics';
  }

  function readControls(){
    if (!hasState()) return;
    const num = (id, fallback, scale = 1) => {
      const el = $(id); const v = el ? Number(el.value) : NaN;
      return Number.isFinite(v) ? v * scale : fallback;
    };
    S.move = Math.round(num('move', S.move || 260, 1));
    S.fly = num('fly', S.fly || 0.65, 0.01);
    S.grow = num('grow', S.grow || 0.12, 0.01);
    S.zoom = num('zoom', S.zoom || 0.06, 0.01);
    S.dur = num('dur', S.dur || 15, 1);
    const preview = $('preview'); if (preview) S.preview = preview.value;
    const bias = $('bias'); if (bias) S.bias = bias.value;
  }

  function sourceRect(img, w, h, t){
    const z = 1 + (S.zoom || 0) * ease(t || 0);
    const ia = img.width / img.height, oa = w / h;
    let bw, bh;
    if (ia > oa) { bh = img.height; bw = bh * oa; }
    else { bw = img.width; bh = bw / oa; }
    const sw = bw / z, sh = bh / z;
    const cx = (S.cx == null ? 0.5 : S.cx) * img.width;
    const cy = (S.cy == null ? 0.5 : S.cy) * img.height;
    return {
      sx: clamp(cx - sw / 2, 0, Math.max(0, img.width - sw)),
      sy: clamp(cy - sh / 2, 0, Math.max(0, img.height - sh)),
      sw,
      sh
    };
  }

  function mapxy(x, y, r, w, h){ return { x: (x - r.sx) / r.sw * w, y: (y - r.sy) / r.sh * h }; }

  function hash(str){
    let h = 2166136261;
    str = String(str || 'star');
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return ((h >>> 0) % 10000) / 10000;
  }

  function travelToEdge(star, ax, ay, W, H){
    let dx = star.x - ax, dy = star.y - ay;
    const len = Math.hypot(dx, dy);
    if (len < 1e-3) { const a = hash(star.id) * Math.PI * 2; dx = Math.cos(a); dy = Math.sin(a); }
    else { dx /= len; dy /= len; }
    const tx = dx > 0 ? (W - star.x + 100) / dx : dx < 0 ? (-star.x - 100) / dx : Infinity;
    const ty = dy > 0 ? (H - star.y + 100) / dy : dy < 0 ? (-star.y - 100) / dy : Infinity;
    return { dx, dy, dist: Math.max(20, Math.min(Math.abs(tx), Math.abs(ty))) };
  }

  function drawStar(ctx, s, r, w, h, t, moving, boost){
    const img = s.img || s.sp;
    if (!img) return;
    let x = s.x, y = s.y;
    let scale = w / r.sw;
    if (moving) {
      const ax = (S.cx == null ? 0.5 : S.cx) * S.src.width;
      const ay = (S.cy == null ? 0.5 : S.cy) * S.src.height;
      const path = travelToEdge(s, ax, ay, S.src.width, S.src.height);
      const phase = ease((t || 0) % 1);
      const motion = clamp(0.25 + (S.fly || 0.65) * 1.15, 0.1, 2.4) * (s.depth || 1);
      x = s.x + path.dx * path.dist * motion * phase;
      y = s.y + path.dy * path.dist * motion * phase;
      scale *= 1 + (S.grow || 0) * (s.depth || 1) * phase;
    }
    if (boost) scale *= 1.25;
    const p = mapxy(x, y, r, w, h);
    if (p.x < -220 || p.y < -220 || p.x > w + 220 || p.y > h + 220) return;
    ctx.drawImage(img, p.x - s.ax * scale, p.y - s.ay * scale, s.w * scale, s.h * scale);
  }

  function drawList(ctx, list, r, w, h, t, moving, boost){
    if (!list || !list.length) return;
    ctx.save();
    if (boost) { ctx.globalAlpha = 1; ctx.filter = 'brightness(2.3) contrast(1.2)'; }
    else { ctx.globalAlpha = 0.82; ctx.globalCompositeOperation = 'screen'; }
    for (const s of list) drawStar(ctx, s, r, w, h, t, moving, boost);
    ctx.restore();
  }

  function renderSafe(t){
    readControls();
    labelUI();
    if (!hasState()) return;
    const canvas = $('main'); if (!canvas) return;
    try { if (typeof size === 'function') size(S.src.width, S.src.height); } catch(e) {}
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const mode = S.preview || 'final';
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (mode === 'mask' && S.mask && S.mask.canvas) {
      const r = sourceRect(S.mask.canvas, w, h, 0);
      ctx.drawImage(S.mask.canvas, r.sx, r.sy, r.sw, r.sh, 0, 0, w, h);
      return;
    }
    if (mode === 'starless' && S.starless) {
      const r = sourceRect(S.starless, w, h, 0);
      ctx.drawImage(S.starless, r.sx, r.sy, r.sw, r.sh, 0, 0, w, h);
      return;
    }
    if (mode === 'stars') {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
      const r = sourceRect(S.src, w, h, 0);
      drawList(ctx, S.suppressedStars || S.statics || [], r, w, h, 0, false, true);
      return;
    }
    if (mode === 'moving') {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
      const r = sourceRect(S.src, w, h, 0);
      drawList(ctx, S.movers || [], r, w, h, 0, false, true);
      return;
    }

    const r = sourceRect(S.src, w, h, t || 0);
    ctx.drawImage(S.src, r.sx, r.sy, r.sw, r.sh, 0, 0, w, h);
    drawList(ctx, S.movers || [], r, w, h, t || 0, true, false);
    S.last = t || 0;
  }

  function scoreForBias(s, bias){
    if (bias === 'bright') return s.peak || 0;
    if (bias === 'size') return s.r || 0;
    if (bias === 'isolated') return s.isolation || s.iso || 0;
    return s.score || ((s.peak || 0) * 3 + Math.sqrt(s.flux || 0));
  }

  function reselectMovers(){
    if (!hasState() || !S.map || !S.stars || !S.stars.length) return;
    readControls();
    const want = Math.min(Math.max(0, S.move || 260), S.stars.length);
    const ranked = S.stars.slice().sort((a, b) => scoreForBias(b, S.bias) - scoreForBias(a, S.bias));
    const moving = [];
    const spacing = Math.max(2.5, Math.min(S.src.width, S.src.height) / 220);
    for (const s of ranked) {
      if (moving.length >= want) break;
      let ok = true;
      for (const t of moving) {
        if (Math.hypot(s.x - t.x, s.y - t.y) < Math.max(spacing, ((s.r || 1) + (t.r || 1)) * 0.32)) { ok = false; break; }
      }
      if (ok) moving.push(s);
    }
    for (const s of ranked) {
      if (moving.length >= want) break;
      if (!moving.includes(s)) moving.push(s);
    }
    const ids = new Set(moving.map(s => s.id));
    S.movers = moving;
    S.suppressedStars = S.stars.filter(s => !ids.has(s.id));
    const tiers = [1, 2, 3].map(t => moving.filter(s => s.tier === t).length);
    const stats = $('stats');
    if (stats) {
      stats.style.display = 'block';
      stats.textContent = `${S.stars.length} stars detected · ${moving.length} moving · tiers ${tiers[0]}/${tiers[1]}/${tiers[2]} · ${S.suppressedStars.length} suppressed`;
    }
    setText('mv', String(moving.length));
    renderSafe(S.last || 0);
  }

  function drawExportFrame(canvas, t){
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
    const r = sourceRect(S.src, w, h, t || 0);
    ctx.drawImage(S.src, r.sx, r.sy, r.sw, r.sh, 0, 0, w, h);
    drawList(ctx, S.movers || [], r, w, h, t || 0, true, false);
  }

  async function exportSafe(){
    if (!hasState() || !S.map || !window.MediaRecorder) return;
    readControls();
    if (S.play && typeof play === 'function') play();
    const mt = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t));
    if (!mt) { status('No supported recording format found.'); return; }
    const d = dims();
    const ext = mt.includes('mp4') ? 'mp4' : 'webm';
    const canvas = document.createElement('canvas');
    canvas.width = d.w; canvas.height = d.h;
    canvas.style.cssText = 'position:fixed;left:0;top:0;width:' + d.w + 'px;height:' + d.h + 'px;opacity:0.01;pointer-events:none;background:#000;z-index:9999';
    document.body.appendChild(canvas);
    const exportBtn = $('export'); if (exportBtn) exportBtn.disabled = true;
    const playBtn = $('play'); if (playBtn) playBtn.disabled = true;
    const oldPreview = S.preview;
    S.preview = 'final';
    drawExportFrame(canvas, 0);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const stream = canvas.captureStream(FPS);
    const track = stream.getVideoTracks()[0];
    const rec = new MediaRecorder(stream, { mimeType: mt, videoBitsPerSecond: 18000000 });
    const chunks = [];
    rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    const done = new Promise(resolve => { rec.onstop = resolve; });
    const totalFrames = Math.max(1, Math.round((S.dur || 15) * FPS));
    const frameMs = 1000 / FPS;
    const start = performance.now();
    showProgress('Exporting movie', 0, `${d.w}×${d.h} · ${S.dur}s · ${ext.toUpperCase()} · ${FIX_VERSION}`);
    rec.start(250);
    for (let frame = 0; frame < totalFrames; frame++) {
      const target = start + frame * frameMs;
      const now = performance.now();
      if (target > now) await sleep(Math.max(0, target - now));
      const t = frame / totalFrames;
      drawExportFrame(canvas, t);
      if (track && track.requestFrame) track.requestFrame();
      if (frame % 3 === 0 || frame === totalFrames - 1) {
        const pct = Math.round((frame + 1) / totalFrames * 100);
        showProgress('Exporting movie', pct, `${pct}% · detail-safe render · requested ${d.w}×${d.h}`);
      }
    }
    await sleep(120);
    rec.stop();
    await done;
    S.preview = oldPreview;
    document.body.removeChild(canvas);
    const blob = new Blob(chunks, { type: mt });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deepsky-drift-${FIX_VERSION}-${d.l}-${S.dur}s.${ext}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    hideProgress();
    if (exportBtn) exportBtn.disabled = false;
    if (playBtn) playBtn.disabled = false;
    renderSafe(S.last || 0);
    status(`Download ready · ${FIX_VERSION} · detail-safe render`);
  }

  function cloneActionButton(id, label, handler){
    const old = $(id);
    if (!old) return;
    const clone = old.cloneNode(true);
    clone.textContent = label;
    clone.onclick = null;
    clone.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); handler(); }, true);
    old.parentNode.replaceChild(clone, old);
  }

  function installFix(){
    labelUI();
    try { render = renderSafe; } catch(e) {}
    cloneActionButton('build', 'Extract Stars', async function(){
      if (typeof build === 'function') await build();
      labelUI();
      reselectMovers();
      renderSafe(0);
    });
    cloneActionButton('export', 'Export Video', exportSafe);
    const preview = $('preview'); if (preview) preview.addEventListener('change', () => renderSafe(S.last || 0), true);
    ['move', 'bias'].forEach(id => { const el = $(id); if (el) { el.addEventListener('input', reselectMovers, true); el.addEventListener('change', reselectMovers, true); } });
    ['fly', 'grow', 'zoom', 'preset'].forEach(id => { const el = $(id); if (el) { el.addEventListener('input', () => renderSafe(S.last || 0), true); el.addEventListener('change', () => renderSafe(S.last || 0), true); } });
    const dur = $('dur'); if (dur) dur.addEventListener('input', () => { setText('tv', dur.value + 's'); }, true);
    setTimeout(labelUI, 0);
    setTimeout(() => renderSafe(S.last || 0), 30);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installFix);
  else installFix();
})();
