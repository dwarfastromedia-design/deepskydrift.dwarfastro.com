(function(){
  const $ = id => document.getElementById(id);
  const clamp = (x,a,b) => Math.max(a, Math.min(b, x));
  const rawVersion = (window.DSD_VERSION || '0.7.5-20260609a').toString().trim();
  const VERSION = 'v' + rawVersion.split('-')[0];

  function hasState(){ try { return typeof S !== 'undefined' && S && S.src; } catch(e){ return false; } }
  function ease(t){ return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; }
  function desiredMovingCount(){ return Math.max(0, Number(($('move') && $('move').value) || S.move || 260)); }

  function setUI(){
    const versionNode = document.querySelector('.ver');
    if (versionNode) versionNode.textContent = VERSION;
    const badge = $('badge');
    if (badge) badge.textContent = VERSION + ' · mask-driven parallax engine';
    const warn = document.querySelector('.warn');
    if (warn) warn.textContent = VERSION + ' · Mask-driven parallax engine.';
    const preview = $('preview');
    if (!preview) return;
    for (const option of Array.from(preview.options)) {
      if (option.value === 'final') option.text = 'Final Preview';
      if (option.value === 'starless') option.text = 'Clean Background';
      if (option.value === 'stars') option.text = 'Static Stars';
      if (option.value === 'moving') option.text = 'Stars That Move';
      if (option.value === 'mask') option.text = 'Star Mask';
    }
  }

  function asCanvas(obj){
    if (!obj) return null;
    if (obj instanceof HTMLCanvasElement) return obj;
    if (obj.canvas instanceof HTMLCanvasElement) return obj.canvas;
    return null;
  }

  function getData(canvas){ return canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height); }

  function buildCatalogFromMask(){
    const maskCanvas = asCanvas(S.mask);
    const starCanvas = asCanvas(S.starsOnly);
    if (!maskCanvas || !starCanvas) return null;
    const width = maskCanvas.width;
    const height = maskCanvas.height;
    const maskData = getData(maskCanvas).data;
    const starData = getData(starCanvas).data;
    const visited = new Uint8Array(width * height);
    const catalog = [];
    let nextId = 1;
    const index = (x,y) => y * width + x;
    const isMaskOn = pixel => {
      const i = pixel * 4;
      return maskData[i + 3] > 20 || maskData[i] + maskData[i + 1] + maskData[i + 2] > 30;
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const start = index(x, y);
        if (visited[start] || !isMaskOn(start)) continue;
        const queueX = [x];
        const queueY = [y];
        visited[start] = 1;
        let cursor = 0;
        let minX = x, maxX = x, minY = y, maxY = y;
        let sumX = 0, sumY = 0, area = 0, peak = 0, lumSum = 0;
        while (cursor < queueX.length) {
          const cx = queueX[cursor];
          const cy = queueY[cursor++];
          const pixel = index(cx, cy);
          const si = pixel * 4;
          const lum = 0.2126 * starData[si] + 0.7152 * starData[si + 1] + 0.0722 * starData[si + 2];
          peak = Math.max(peak, lum);
          lumSum += lum;
          sumX += cx;
          sumY += cy;
          area++;
          minX = Math.min(minX, cx); maxX = Math.max(maxX, cx);
          minY = Math.min(minY, cy); maxY = Math.max(maxY, cy);
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = cx + dx, ny = cy + dy;
              if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
              const nextPixel = index(nx, ny);
              if (visited[nextPixel] || !isMaskOn(nextPixel)) continue;
              visited[nextPixel] = 1;
              queueX.push(nx); queueY.push(ny);
            }
          }
        }
        if (area < 2) continue;
        const boxW = maxX - minX + 1;
        const boxH = maxY - minY + 1;
        const radius = Math.sqrt(area / Math.PI);
        if (boxW > 36 || boxH > 36 || area > 380) continue;
        if ((boxW > 18 || boxH > 18) && peak < 40) continue;
        const pad = Math.max(5, Math.ceil(radius * 2.8));
        const x0 = clamp(Math.floor(minX - pad), 0, width - 1);
        const y0 = clamp(Math.floor(minY - pad), 0, height - 1);
        const x1 = clamp(Math.ceil(maxX + pad + 1), 1, width);
        const y1 = clamp(Math.ceil(maxY + pad + 1), 1, height);
        const sw = Math.max(1, x1 - x0);
        const sh = Math.max(1, y1 - y0);
        const sprite = document.createElement('canvas');
        sprite.width = sw; sprite.height = sh;
        sprite.getContext('2d').drawImage(starCanvas, x0, y0, sw, sh, 0, 0, sw, sh);
        const cx = sumX / area;
        const cy = sumY / area;
        const mean = lumSum / area;
        catalog.push({
          id: 'mask-' + nextId++, x: cx, y: cy, r: radius, peak: peak / 255, mean: mean / 255,
          area, bboxW: boxW, bboxH: boxH, score: peak * 2 + mean * 0.5 + radius * 12,
          img: sprite, sp: sprite, ax: cx - x0, ay: cy - y0, w: sw, h: sh
        });
      }
    }
    return catalog;
  }

  function assignTiers(stars){
    for (const s of stars) {
      const q = s.peak * 2 + s.r * 0.45 + s.area * 0.008;
      if (q > 3.2 || s.r > 4.5) { s.tier = 3; s.depth = 1.65; }
      else if (q > 2.0 || s.r > 2.7) { s.tier = 2; s.depth = 1.15; }
      else { s.tier = 1; s.depth = 0.78; }
    }
  }

  function chooseMovingAndStatic(catalog){
    const want = Math.min(desiredMovingCount(), catalog.length);
    const ranked = catalog.slice().sort((a,b) => b.score - a.score);
    const moving = [];
    const spacing = Math.max(4, Math.min(S.src.width, S.src.height) / 160);
    for (const s of ranked) {
      if (moving.length >= want) break;
      let ok = true;
      for (const t of moving) {
        if (Math.hypot(s.x - t.x, s.y - t.y) < Math.max(spacing, (s.r + t.r) * 0.4)) { ok = false; break; }
      }
      if (ok) moving.push(s);
    }
    for (const s of ranked) {
      if (moving.length >= want) break;
      if (!moving.includes(s)) moving.push(s);
    }
    const movingIds = new Set(moving.map(s => s.id));
    const remainder = ranked.filter(s => !movingIds.has(s.id));
    const staticCap = Math.min(120, Math.max(12, Math.round(moving.length * 0.12)));
    const statics = remainder.slice(0, staticCap);
    assignTiers(moving);
    return { moving, statics, suppressed: Math.max(0, remainder.length - statics.length) };
  }

  function rebuildMaskDrivenState(){
    const catalog = buildCatalogFromMask();
    if (!catalog || !catalog.length) {
      if (Array.isArray(S.stars)) {
        const moving = S.stars.slice(0, Math.min(desiredMovingCount(), S.stars.length));
        S.movers = moving;
        S.statics = S.stars.slice(moving.length, Math.min(S.stars.length, moving.length + 30));
      }
      return;
    }
    const result = chooseMovingAndStatic(catalog);
    S.maskCatalog = catalog;
    S.movers = result.moving;
    S.statics = result.statics;
    S.suppressedCount = result.suppressed;
    S.move = result.moving.length;
    if ($('mv')) $('mv').textContent = String(result.moving.length);
    if ($('stats')) {
      $('stats').style.display = 'block';
      $('stats').textContent = `${catalog.length} mask stars · ${result.moving.length} moving · ${result.statics.length} static · ${result.suppressed} suppressed`;
    }
  }

  const baseBuild = typeof build === 'function' ? build : null;
  const baseRender = typeof render === 'function' ? render : null;

  async function engineBuild(){
    if (!hasState() || !baseBuild) return;
    await baseBuild();
    rebuildMaskDrivenState();
    setUI();
    engineRender(0);
    const status = $('status');
    if (status) status.textContent = VERSION + ' mask-driven parallax ready';
  }

  function sourceRect(img,w,h,t){
    const z = 1 + (S.zoom || 0) * ease(t || 0);
    const ia = img.width / img.height, oa = w / h;
    let bw,bh; if (ia > oa) { bh = img.height; bw = bh * oa; } else { bw = img.width; bh = bw / oa; }
    const sw = bw / z, sh = bh / z;
    const cx = (S.cx == null ? 0.5 : S.cx) * img.width;
    const cy = (S.cy == null ? 0.5 : S.cy) * img.height;
    return { sx: clamp(cx - sw/2, 0, Math.max(0, img.width - sw)), sy: clamp(cy - sh/2, 0, Math.max(0, img.height - sh)), sw, sh };
  }
  function mapxy(x,y,r,w,h){ return { x:(x-r.sx)/r.sw*w, y:(y-r.sy)/r.sh*h }; }
  function drawSprite(ctx, s, x, y, scale){ const img = s.img || s.sp; if (img) ctx.drawImage(img, x - s.ax * scale, y - s.ay * scale, s.w * scale, s.h * scale); }
  function drawStarLayer(ctx, list, r, w, h, t, moving, boost){
    const e = ease(t || 0), ax = (S.cx == null ? 0.5 : S.cx) * S.src.width, ay = (S.cy == null ? 0.5 : S.cy) * S.src.height;
    if (boost) { ctx.save(); ctx.filter = 'brightness(2.3) contrast(1.22)'; }
    for (const s of list || []) {
      let x = s.x, y = s.y, scale = w / r.sw;
      if (moving) {
        const tierMult = s.tier === 3 ? 1.25 : (s.tier === 2 ? 1.0 : 0.72);
        const push = 1 + (S.fly || 0) * 0.30 * (s.depth || 1) * tierMult * e;
        x = ax + (s.x - ax) * push; y = ay + (s.y - ay) * push;
        scale *= 1 + (S.grow || 0) * 0.36 * (s.depth || 1) * tierMult * e;
      }
      if (boost) scale *= 1.15;
      const p = mapxy(x, y, r, w, h);
      if (p.x < -120 || p.y < -120 || p.x > w + 120 || p.y > h + 120) continue;
      drawSprite(ctx, s, p.x, p.y, scale);
    }
    if (boost) ctx.restore();
  }
  function engineRender(t){
    setUI();
    if (!hasState()) { if (baseRender) baseRender(t || 0); return; }
    const c = $('main'); if (!c) return;
    try { if (typeof size === 'function') size(S.src.width, S.src.height); } catch(e) {}
    const ctx = c.getContext('2d'), w = c.width, h = c.height, mode = S.preview || 'final';
    ctx.clearRect(0,0,w,h); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    const bg = asCanvas(S.starless) || S.src;
    if (mode === 'mask' && asCanvas(S.mask)) { const mc = asCanvas(S.mask), r = sourceRect(mc,w,h,0); ctx.drawImage(mc,r.sx,r.sy,r.sw,r.sh,0,0,w,h); return; }
    if (mode === 'starless') { const r = sourceRect(bg,w,h,0); ctx.drawImage(bg,r.sx,r.sy,r.sw,r.sh,0,0,w,h); return; }
    if (mode === 'stars') { const r = sourceRect(S.src,w,h,0); drawStarLayer(ctx,S.statics,r,w,h,0,false,true); return; }
    if (mode === 'moving') { const r = sourceRect(S.src,w,h,0); drawStarLayer(ctx,S.movers,r,w,h,0,false,true); return; }
    const r = sourceRect(bg,w,h,t||0); ctx.drawImage(bg,r.sx,r.sy,r.sw,r.sh,0,0,w,h); drawStarLayer(ctx,S.statics,r,w,h,t||0,false,false); drawStarLayer(ctx,S.movers,r,w,h,t||0,true,false); S.last = t || 0;
  }
  function install(){
    setUI();
    try { build = engineBuild; render = engineRender; } catch(e) {}
    const btn = $('build'); if (btn && !btn.dataset.maskDrivenEngine) { btn.dataset.maskDrivenEngine = '1'; btn.addEventListener('click', () => setTimeout(engineBuild,0)); }
    const preview = $('preview'); if (preview && !preview.dataset.maskDrivenEngine) { preview.dataset.maskDrivenEngine = '1'; preview.addEventListener('change', () => setTimeout(() => engineRender(S.last || 0), 0)); }
    const move = $('move'); if (move && !move.dataset.maskDrivenEngine) { const refresh = () => { if (hasState() && S.mask && S.starsOnly) { rebuildMaskDrivenState(); engineRender(S.last || 0); } }; move.dataset.maskDrivenEngine = '1'; move.addEventListener('input', refresh); move.addEventListener('change', refresh); }
  }
  document.addEventListener('DOMContentLoaded', install);
})();
