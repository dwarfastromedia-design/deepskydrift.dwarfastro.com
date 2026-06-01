(function(){
  const VERSION = 'v0.6.2';
  const HARD_MOVE_CAP = 500;
  const $ = (id) => document.getElementById(id);

  function hasAppState(){
    try { return typeof S !== 'undefined' && S && typeof S === 'object'; } catch(e) { return false; }
  }

  function isIOSLikeSafari(){
    const ua = navigator.userAgent || '';
    const iPad = /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const iPhone = /iPhone|iPod/.test(ua);
    return (iPad || iPhone) && /WebKit/.test(ua) && !/CriOS|FxiOS/.test(ua);
  }

  function getRawDims(){
    const preset = $('preset') && $('preset').value;
    if (preset === 'portrait') return { w: 1080, h: 1920, l: '9x16' };
    if (preset === 'landscape') return { w: 1920, h: 1080, l: '16x9' };
    return { w: 1080, h: 1080, l: '1x1' };
  }

  function getPerformanceDims(d){
    if (!isIOSLikeSafari()) return d;
    if (d.w === 1920 && d.h === 1080) return { w: 1280, h: 720, l: d.l };
    if (d.w === 1080 && d.h === 1920) return { w: 720, h: 1280, l: d.l };
    return { w: 900, h: 900, l: d.l };
  }

  function patchDims(){
    try {
      if (typeof dims !== 'function' || window.__deepSkyDriftDimsTuned) return;
      window.__deepSkyDriftDimsTuned = true;
      const originalDims = dims;
      dims = function(){ return getPerformanceDims(originalDims()); };
    } catch(e) {}
  }

  function updateExportNote(){
    const exinfo = $('exinfo');
    if (!exinfo) return;
    const raw = getRawDims();
    const perf = getPerformanceDims(raw);
    const note = raw.w !== perf.w || raw.h !== perf.h
      ? ` · performance export ${perf.w}×${perf.h} on iPad/Safari`
      : '';
    exinfo.textContent = `Export target: ${raw.w}×${raw.h} at 30 fps${note}`;
  }

  function clamp(x,a,b){ return Math.max(a, Math.min(b, x)); }
  function ease(t){ return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; }

  function previewCanvas(){ return $('main'); }
  function sourceImage(){ return hasAppState() ? (S.starless || S.src) : null; }

  function sourceRectFor(img, outW, outH, t, fit){
    const zoom = (fit === 'cover' || fit === 'contain') ? 1 + (S.zoom || 0) * ease(t || 0) : 1;
    const imageAspect = img.width / img.height;
    const outAspect = outW / outH;
    let baseW, baseH;

    if (imageAspect > outAspect) {
      baseH = img.height;
      baseW = baseH * outAspect;
    } else {
      baseW = img.width;
      baseH = baseW / outAspect;
    }

    const sw = baseW / zoom;
    const sh = baseH / zoom;
    const ax = clamp((S.cx == null ? 0.5 : S.cx) * img.width, 0, img.width);
    const ay = clamp((S.cy == null ? 0.5 : S.cy) * img.height, 0, img.height);
    const sx = clamp(ax - sw / 2, 0, Math.max(0, img.width - sw));
    const sy = clamp(ay - sh / 2, 0, Math.max(0, img.height - sh));
    return { sx, sy, sw, sh, zoom, ax, ay };
  }

  function mapSourceToCanvas(x, y, rect, outW, outH){
    return {
      x: ((x - rect.sx) / rect.sw) * outW,
      y: ((y - rect.sy) / rect.sh) * outH
    };
  }

  function scoreStar(s){
    return (s.score || 0) + (s.peak || 0) * 2 + (s.iso || 0) * 0.1 + (s.r || 0) * 0.1 + (s.mscore || 0) * 0.5;
  }

  function optimizeMotionLayer(){
    if (!hasAppState()) return false;
    const pool = Array.isArray(S.stars) ? S.stars.slice() : [];
    if (!pool.length) return false;
    let desired = Number(($('move') && $('move').value) || S.move || 260);
    desired = Math.min(desired, HARD_MOVE_CAP, pool.length);
    const source = Array.isArray(S.movers) && S.movers.length ? S.movers.slice() : pool;
    S.movers = source.sort((a,b) => scoreStar(b) - scoreStar(a)).slice(0, desired);
    S.statics = [];
    S.move = desired;
    if ($('mv')) $('mv').textContent = String(desired);
    if ($('stats')) {
      $('stats').style.display = 'block';
      $('stats').textContent = `${pool.length} stars detected · ${S.movers.length} animated · 0 static`;
    }
    if ($('badge')) $('badge').textContent = `${VERSION} · source-anchored render`;
    return true;
  }

  function drawMotionStars(ctx, outW, outH, rect, t){
    if (!hasAppState() || !Array.isArray(S.movers) || !S.movers.length || !S.src) return;
    const e = ease(t || 0);
    const ax = (S.cx == null ? 0.5 : S.cx) * S.src.width;
    const ay = (S.cy == null ? 0.5 : S.cy) * S.src.height;

    for (const s of S.movers) {
      if (!s || !s.sp) continue;
      const depth = Math.max(0.25, Math.min(1.85, s.mscore || scoreStar(s) || 1));
      const push = 1 + (S.fly || 0) * 0.34 * depth * e;
      const sx = ax + (s.x - ax) * push;
      const sy = ay + (s.y - ay) * push;
      const p = mapSourceToCanvas(sx, sy, rect, outW, outH);
      if (p.x < -120 || p.y < -120 || p.x > outW + 120 || p.y > outH + 120) continue;
      const baseScale = outW / rect.sw;
      const growth = 1 + (S.grow || 0) * 0.55 * depth * e;
      const scale = baseScale * growth;
      ctx.drawImage(s.sp, p.x - s.ax * scale, p.y - s.ay * scale, s.w * scale, s.h * scale);
    }
  }

  function tunedDraw(canvas, t, fit){
    if (!hasAppState() || !S.src || !canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,w,h);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const mode = S.preview || 'final';
    let img;
    if (mode === 'mask') img = S.mask && S.mask.canvas ? S.mask.canvas : S.src;
    else if (mode === 'stars') img = S.starsOnly || S.src;
    else if (mode === 'starless') img = S.starless || S.src;
    else img = sourceImage();
    if (!img) return;

    const rect = sourceRectFor(img, w, h, mode === 'final' ? t : 0, fit || 'contain');
    ctx.drawImage(img, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, w, h);

    if (mode === 'moving') {
      ctx.clearRect(0,0,w,h);
      drawMotionStars(ctx, w, h, sourceRectFor(S.src, w, h, 0, fit || 'contain'), 0);
    } else if (mode === 'final') {
      if (Array.isArray(S.statics)) S.statics = [];
      drawMotionStars(ctx, w, h, rect, t || 0);
    }
  }

  function updateTargetReticle(){
    if (!hasAppState() || !S.src) return;
    const target = document.querySelector('.target');
    const c = previewCanvas();
    const view = document.querySelector('.view');
    if (!target || !c || !view) return;
    if ((S.preview || 'final') !== 'final') { target.style.display = 'none'; return; }
    const img = sourceImage();
    if (!img) return;
    const rect = sourceRectFor(img, c.width, c.height, S.last || 0, 'contain');
    const mapped = mapSourceToCanvas((S.cx || 0.5) * img.width, (S.cy || 0.5) * img.height, rect, c.width, c.height);
    const cr = c.getBoundingClientRect();
    const vr = view.getBoundingClientRect();
    target.style.left = `${cr.left - vr.left + mapped.x}px`;
    target.style.top = `${cr.top - vr.top + mapped.y}px`;
    target.style.display = 'block';
  }

  function tunedRender(t){
    if (!hasAppState() || !S.src) return;
    try { if (typeof size === 'function') size(S.src.width, S.src.height); } catch(e) {}
    const c = previewCanvas();
    tunedDraw(c, t || 0, 'contain');
    S.last = t || 0;
    updateTargetReticle();
  }

  function setAnchorFromPointer(ev){
    if (!hasAppState() || !S.src) return;
    const c = previewCanvas();
    if (!c) return;
    const img = sourceImage();
    if (!img) return;
    const cr = c.getBoundingClientRect();
    const x = (ev.clientX - cr.left) / cr.width;
    const y = (ev.clientY - cr.top) / cr.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    const rect = sourceRectFor(img, c.width, c.height, S.last || 0, 'contain');
    S.cx = clamp((rect.sx + x * rect.sw) / img.width, 0.02, 0.98);
    S.cy = clamp((rect.sy + y * rect.sh) / img.height, 0.02, 0.98);
    if (typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
    if (typeof ev.preventDefault === 'function') ev.preventDefault();
    tunedRender(S.last || 0);
    const status = $('status');
    if (status) status.textContent = 'Zoom center locked to source target';
  }

  async function waitForExtraction(timeoutMs){
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (hasAppState() && S.starless && S.starsOnly && Array.isArray(S.stars) && S.stars.length) return true;
      await new Promise(r => setTimeout(r, 120));
    }
    return false;
  }

  function hookBuild(){
    const btn = $('build');
    if (!btn || btn.dataset.motionTunedV062) return;
    btn.dataset.motionTunedV062 = '1';
    btn.addEventListener('click', function(){
      setTimeout(async function(){
        if (await waitForExtraction(20000)) {
          optimizeMotionLayer();
          tunedRender(0);
        }
      }, 80);
    });
  }

  function hookPointer(){
    const view = document.querySelector('.view');
    if (!view || view.dataset.sourceAnchorHook) return;
    view.dataset.sourceAnchorHook = '1';
    view.addEventListener('pointerdown', setAnchorFromPointer, true);
  }

  function installRenderOverride(){
    try { draw = tunedDraw; } catch(e) {}
    try { render = tunedRender; } catch(e) {}
    try { target = updateTargetReticle; } catch(e) {}
    patchDims();
    updateExportNote();
    const ver = document.querySelector('.ver');
    if (ver) ver.textContent = VERSION;
    if ($('badge')) $('badge').textContent = `${VERSION} · stable zoom`;
  }

  function hookControls(){
    const play = $('play');
    const exportBtn = $('export');
    const preset = $('preset');
    if (play && !play.dataset.motionTunedV062) {
      play.dataset.motionTunedV062 = '1';
      play.addEventListener('click', function(){ if (hasAppState()) S.statics = []; }, true);
    }
    if (exportBtn && !exportBtn.dataset.motionTunedV062) {
      exportBtn.dataset.motionTunedV062 = '1';
      exportBtn.addEventListener('click', function(){ if (hasAppState()) S.statics = []; patchDims(); updateExportNote(); }, true);
    }
    if (preset && !preset.dataset.motionTunedV062) {
      preset.dataset.motionTunedV062 = '1';
      preset.addEventListener('change', updateExportNote);
    }
  }

  document.addEventListener('DOMContentLoaded', function(){
    installRenderOverride();
    hookBuild();
    hookPointer();
    hookControls();
  });
})();
