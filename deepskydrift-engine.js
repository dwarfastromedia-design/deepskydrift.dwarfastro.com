(function(){
  'use strict';

  const ENGINE_VERSION = 'v0.8.0';
  window.DSD_LIVE_VERSION = ENGINE_VERSION;

  const $ = id => document.getElementById(id);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const ease = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;

  let baseRender = null;

  function hasState(){
    try { return typeof S !== 'undefined' && S && S.src; }
    catch (e) { return false; }
  }

  function readNumber(id, fallback, scale = 1){
    const el = $(id);
    const v = el ? Number(el.value) : NaN;
    return Number.isFinite(v) ? v * scale : fallback;
  }

  function readControls(){
    if (!hasState()) return;
    S.strict = readNumber('strict', S.strict == null ? 0.7 : S.strict, 0.01);
    S.max = Math.round(readNumber('max', S.max || 2200, 1));
    S.move = Math.round(readNumber('move', S.move || 260, 1));
    S.rad = readNumber('rad', S.rad || 2.5, 0.01);
    S.fly = readNumber('fly', S.fly || 0.65, 0.01);
    S.grow = readNumber('grow', S.grow || 0.12, 0.01);
    S.zoom = readNumber('zoom', S.zoom || 0.05, 0.01);
    S.dur = readNumber('dur', S.dur || 10, 1);
    const preview = $('preview');
    if (preview) S.preview = preview.value;
    const bias = $('bias');
    if (bias) S.bias = bias.value;
  }

  function setText(id, text){ const el = $(id); if (el) el.textContent = text; }
  function setStatus(text){ setText('status', text); }

  function showProgress(title, pct, label){
    const ol = $('ol'); if (ol) ol.style.display = 'grid';
    setText('olt', title);
    const fill = $('fill'); if (fill) fill.style.width = clamp(pct, 0, 100) + '%';
    setText('oll', label || '');
    setStatus(label || title);
  }

  function hideProgress(){ const ol = $('ol'); if (ol) ol.style.display = 'none'; }

  function setUI(){
    const ver = document.querySelector('.ver'); if (ver) ver.textContent = ENGINE_VERSION;
    const badge = $('badge'); if (badge) badge.textContent = ENGINE_VERSION + ' · full star-mask parallax engine';
    const warn = document.querySelector('.warn'); if (warn) warn.textContent = ENGINE_VERSION + ' · Full star-mask parallax engine.';
  }

  function makeCanvas(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function getCtx(c){ return c.getContext('2d', { willReadFrequently: true }); }
  function getImageData(c){ return getCtx(c).getImageData(0, 0, c.width, c.height); }

  function luminanceFromRGBA(data){
    const out = new Float32Array(data.length / 4);
    for (let i = 0, p = 0; i < out.length; i++, p += 4) out[i] = (0.2126 * data[p] + 0.7152 * data[p+1] + 0.0722 * data[p+2]) / 255;
    return out;
  }

  function boxBlurFloat(src, w, h, radius){
    radius = Math.max(1, radius | 0);
    const tmp = new Float32Array(w * h);
    const out = new Float32Array(w * h);
    const win = radius * 2 + 1;
    for (let y = 0; y < h; y++) {
      const row = y * w;
      let sum = 0;
      for (let dx = -radius; dx <= radius; dx++) sum += src[row + clamp(dx, 0, w - 1)];
      for (let x = 0; x < w; x++) {
        tmp[row + x] = sum / win;
        sum += src[row + clamp(x + radius + 1, 0, w - 1)] - src[row + clamp(x - radius, 0, w - 1)];
      }
    }
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let dy = -radius; dy <= radius; dy++) sum += tmp[clamp(dy, 0, h - 1) * w + x];
      for (let y = 0; y < h; y++) {
        out[y * w + x] = sum / win;
        sum += tmp[clamp(y + radius + 1, 0, h - 1) * w + x] - tmp[clamp(y - radius, 0, h - 1) * w + x];
      }
    }
    return out;
  }

  function statsPositive(arr){
    let n = 0, sum = 0, sum2 = 0;
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i];
      if (v <= 0) continue;
      n++; sum += v; sum2 += v * v;
    }
    if (!n) return { mean: 0, rms: 0.001 };
    const mean = sum / n;
    const rms = Math.sqrt(Math.max(1e-8, sum2 / n - mean * mean));
    return { mean, rms };
  }

  function detectStars(src){
    const W = src.width, H = src.height;
    const imageData = getImageData(src);
    const lum = luminanceFromRGBA(imageData.data);
    const bgLarge = boxBlurFloat(lum, W, H, Math.max(12, Math.round(Math.min(W, H) / 90)));
    const bgSmall = boxBlurFloat(lum, W, H, 1);
    const dog = new Float32Array(W * H);
    for (let i = 0; i < dog.length; i++) dog[i] = Math.max(0, bgSmall[i] - bgLarge[i]);
    const st = statsPositive(dog);
    const strict = clamp(S.strict == null ? 0.7 : S.strict, 0.05, 0.95);
    const requested = Math.max(260, S.move || 260);
    const relaxed = requested >= 900 ? 0.48 : requested >= 600 ? 0.56 : requested >= 350 ? 0.66 : 0.78;
    const threshold = st.mean + st.rms * Math.max(0.45, (0.65 + strict * 2.15) * relaxed);
    const growThreshold = threshold * 0.42;

    const seen = new Uint8Array(W * H);
    const dirs = [1, -1, W, -W, W + 1, W - 1, -W + 1, -W - 1];
    const stars = [];
    let nextId = 1;

    for (let i = 0; i < dog.length; i++) {
      if (seen[i] || dog[i] < threshold) continue;
      const queue = [i];
      const pixels = [];
      seen[i] = 1;
      while (queue.length) {
        const p = queue.pop();
        pixels.push(p);
        const x = p % W, y = (p / W) | 0;
        for (const d of dirs) {
          const np = p + d;
          if (np < 0 || np >= dog.length || seen[np]) continue;
          const nx = np % W, ny = (np / W) | 0;
          if (Math.abs(nx - x) > 1 || Math.abs(ny - y) > 1) continue;
          if (dog[np] < growThreshold) continue;
          seen[np] = 1;
          queue.push(np);
        }
      }

      const area = pixels.length;
      if (area < 1 || area > 900) continue;
      let minX = W, maxX = 0, minY = H, maxY = 0, flux = 0, peak = 0, sx = 0, sy = 0, localBg = 0;
      for (const p of pixels) {
        const x = p % W, y = (p / W) | 0;
        const v = dog[p];
        const weight = Math.max(v, 1e-5);
        flux += v; peak = Math.max(peak, v); sx += x * weight; sy += y * weight; localBg += bgLarge[p];
        minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
      if (flux <= 0) continue;
      const cx = sx / Math.max(1e-6, flux), cy = sy / Math.max(1e-6, flux);
      const bw = maxX - minX + 1, bh = maxY - minY + 1;
      const aspect = Math.max(bw, bh) / Math.max(1, Math.min(bw, bh));
      const radius = Math.sqrt(area / Math.PI);
      if (bw > 54 || bh > 54) continue;
      if (area > 520 && peak < st.rms * 6) continue;
      if (aspect > 3.2 && area > 6) continue;

      let ann = 0, annN = 0;
      const annR1 = Math.max(3.5, radius * 2.1), annR2 = Math.max(6.5, radius * 4.2);
      for (let yy = Math.floor(cy - annR2); yy <= cy + annR2; yy++) {
        if (yy < 0 || yy >= H) continue;
        for (let xx = Math.floor(cx - annR2); xx <= cx + annR2; xx++) {
          if (xx < 0 || xx >= W) continue;
          const d = Math.hypot(xx - cx, yy - cy);
          if (d < annR1 || d > annR2) continue;
          ann += dog[yy * W + xx]; annN++;
        }
      }
      const annAvg = annN ? ann / annN : 0;
      const isolation = peak / Math.max(st.rms * 0.25, annAvg + st.rms * 0.12);
      if (isolation < (area > 80 ? 0.85 : 1.05)) continue;

      stars.push({
        id: 'star-' + nextId++, x: cx, y: cy, r: Math.max(1.15, radius), area, bboxW: bw, bboxH: bh,
        peak, flux, isolation, bg: localBg / area,
        score: peak * 3.0 + Math.sqrt(flux) * 0.45 + radius * 0.08 + isolation * 0.025
      });
    }

    const maxStars = Math.max(S.max || 2200, (S.move || 260) * 5, 1200);
    stars.sort((a, b) => b.score - a.score);
    return { stars: stars.slice(0, Math.min(maxStars, stars.length)) };
  }

  function assignTiers(stars){
    const sorted = stars.slice().sort((a, b) => b.score - a.score);
    const rank = new Map();
    const n = Math.max(1, sorted.length);
    sorted.forEach((s, i) => rank.set(s.id, i / n));
    for (const s of stars) {
      const q = rank.get(s.id);
      if (q <= 0.15 || s.r > 4.8 || s.peak > 0.22) { s.tier = 3; s.depth = 1.42; s.speed = 1.22; }
      else if (q <= 0.50 || s.r > 2.5) { s.tier = 2; s.depth = 1.0; s.speed = 0.94; }
      else { s.tier = 1; s.depth = 0.62; s.speed = 0.68; }
    }
  }

  function buildMask(W, H, stars){
    const mask = new Float32Array(W * H);
    const radFactor = clamp(S.rad || 2.5, 1.2, 4.8);
    for (const s of stars) {
      const halo = s.tier === 3 ? 1.32 : s.tier === 2 ? 1.15 : 1.0;
      const r = Math.max(2.4, s.r * radFactor * halo);
      s.maskRadius = r;
      for (let yy = Math.floor(s.y - r); yy <= s.y + r; yy++) {
        if (yy < 0 || yy >= H) continue;
        for (let xx = Math.floor(s.x - r); xx <= s.x + r; xx++) {
          if (xx < 0 || xx >= W) continue;
          const d = Math.hypot(xx - s.x, yy - s.y);
          if (d > r) continue;
          let a = 1 - clamp((d - r * 0.28) / Math.max(1e-5, r * 0.72), 0, 1);
          a = a * a * (3 - 2 * a);
          const k = yy * W + xx;
          if (a > mask[k]) mask[k] = a;
        }
      }
    }
    return mask;
  }

  function maskToCanvas(mask, W, H){
    const c = makeCanvas(W, H);
    const ctx = getCtx(c);
    const id = ctx.createImageData(W, H);
    for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
      const v = clamp(mask[i] * 255, 0, 255) | 0;
      id.data[p] = id.data[p+1] = id.data[p+2] = v; id.data[p+3] = 255;
    }
    ctx.putImageData(id, 0, 0);
    return c;
  }

  function solvePlane(samples, channel){
    let n = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, sz = 0, sxz = 0, syz = 0;
    for (const s of samples) {
      const x = s.dx, y = s.dy, z = s[channel];
      n++; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y; sz += z; sxz += x * z; syz += y * z;
    }
    const A00 = n, A01 = sx, A02 = sy, A11 = sxx, A12 = sxy, A22 = syy;
    const B0 = sz, B1 = sxz, B2 = syz;
    const det = A00 * (A11 * A22 - A12 * A12) - A01 * (A01 * A22 - A12 * A02) + A02 * (A01 * A12 - A11 * A02);
    if (Math.abs(det) < 1e-5) return [B0 / Math.max(1, n), 0, 0];
    const d0 = B0 * (A11 * A22 - A12 * A12) - A01 * (B1 * A22 - A12 * B2) + A02 * (B1 * A12 - A11 * B2);
    const d1 = A00 * (B1 * A22 - A12 * B2) - B0 * (A01 * A22 - A12 * A02) + A02 * (A01 * B2 - B1 * A02);
    const d2 = A00 * (A11 * B2 - B1 * A12) - A01 * (A01 * B2 - B1 * A02) + B0 * (A01 * A12 - A11 * A02);
    return [d0 / det, d1 / det, d2 / det];
  }

  function createStarless(src, mask, stars){
    const W = src.width, H = src.height;
    const out = makeCanvas(W, H);
    const ctx = getCtx(out);
    ctx.drawImage(src, 0, 0);
    const id = ctx.getImageData(0, 0, W, H);
    const p = id.data;
    const orig = new Uint8ClampedArray(p);
    const ordered = stars.slice().sort((a, b) => b.maskRadius - a.maskRadius);

    for (const s of ordered) {
      const r = s.maskRadius || Math.max(3, s.r * (S.rad || 2.5));
      const rInner = r * 1.15;
      const rOuter = Math.max(r * 2.8, r + 8);
      const samples = [];
      for (let yy = Math.floor(s.y - rOuter); yy <= s.y + rOuter; yy += 2) {
        if (yy < 0 || yy >= H) continue;
        for (let xx = Math.floor(s.x - rOuter); xx <= s.x + rOuter; xx += 2) {
          if (xx < 0 || xx >= W) continue;
          const d = Math.hypot(xx - s.x, yy - s.y);
          if (d < rInner || d > rOuter) continue;
          if (mask[yy * W + xx] > 0.03) continue;
          const k = (yy * W + xx) * 4;
          const lum = 0.2126 * orig[k] + 0.7152 * orig[k+1] + 0.0722 * orig[k+2];
          samples.push({ dx: xx - s.x, dy: yy - s.y, r: orig[k], g: orig[k+1], b: orig[k+2], lum });
        }
      }
      if (samples.length < 12) continue;
      samples.sort((a, b) => a.lum - b.lum);
      const lo = Math.floor(samples.length * 0.08);
      const hi = Math.max(lo + 8, Math.floor(samples.length * 0.72));
      const clipped = samples.slice(lo, hi);
      const pr = solvePlane(clipped, 'r');
      const pg = solvePlane(clipped, 'g');
      const pb = solvePlane(clipped, 'b');

      for (let yy = Math.floor(s.y - r); yy <= s.y + r; yy++) {
        if (yy < 0 || yy >= H) continue;
        for (let xx = Math.floor(s.x - r); xx <= s.x + r; xx++) {
          if (xx < 0 || xx >= W) continue;
          const idx = yy * W + xx;
          const a = mask[idx];
          if (a <= 0.001) continue;
          const dx = xx - s.x, dy = yy - s.y;
          const rr = pr[0] + pr[1] * dx + pr[2] * dy;
          const gg = pg[0] + pg[1] * dx + pg[2] * dy;
          const bb = pb[0] + pb[1] * dx + pb[2] * dy;
          const k = idx * 4;
          const blend = clamp(a * (s.tier === 3 ? 0.98 : 0.94), 0, 1);
          p[k]   = clamp(p[k]   * (1 - blend) + rr * blend, 0, 255);
          p[k+1] = clamp(p[k+1] * (1 - blend) + gg * blend, 0, 255);
          p[k+2] = clamp(p[k+2] * (1 - blend) + bb * blend, 0, 255);
        }
      }
    }

    for (let pass = 0; pass < 2; pass++) {
      const prev = new Uint8ClampedArray(p);
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const idx = y * W + x;
          const a = mask[idx];
          if (a < 0.25) continue;
          let sr = 0, sg = 0, sb = 0, n = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (!dx && !dy) continue;
              const ni = ((y + dy) * W + (x + dx)) * 4;
              sr += prev[ni]; sg += prev[ni+1]; sb += prev[ni+2]; n++;
            }
          }
          const k = idx * 4;
          const smooth = 0.18 * a;
          p[k]   = p[k]   * (1 - smooth) + (sr / n) * smooth;
          p[k+1] = p[k+1] * (1 - smooth) + (sg / n) * smooth;
          p[k+2] = p[k+2] * (1 - smooth) + (sb / n) * smooth;
        }
      }
    }

    ctx.putImageData(id, 0, 0);
    return out;
  }

  function createSprites(src, mask, stars){
    const W = src.width, H = src.height;
    const srcData = getImageData(src).data;
    for (const s of stars) {
      const r = Math.max(4, (s.maskRadius || s.r * 2.5) * 1.15);
      const x0 = clamp(Math.floor(s.x - r), 0, W - 1), y0 = clamp(Math.floor(s.y - r), 0, H - 1);
      const x1 = clamp(Math.ceil(s.x + r + 1), 1, W), y1 = clamp(Math.ceil(s.y + r + 1), 1, H);
      const sw = Math.max(1, x1 - x0), sh = Math.max(1, y1 - y0);
      const sprite = makeCanvas(sw, sh);
      const ctx = getCtx(sprite);
      const id = ctx.createImageData(sw, sh);
      for (let yy = 0; yy < sh; yy++) {
        for (let xx = 0; xx < sw; xx++) {
          const sx = x0 + xx, sy = y0 + yy;
          const si = sy * W + sx;
          const srcK = si * 4, dstK = (yy * sw + xx) * 4;
          const a = clamp(mask[si], 0, 1);
          if (a <= 0.002) continue;
          id.data[dstK] = srcData[srcK]; id.data[dstK+1] = srcData[srcK+1]; id.data[dstK+2] = srcData[srcK+2]; id.data[dstK+3] = clamp(a * 255, 0, 255) | 0;
        }
      }
      ctx.putImageData(id, 0, 0);
      s.img = sprite; s.sp = sprite; s.ax = s.x - x0; s.ay = s.y - y0; s.w = sw; s.h = sh;
    }
  }

  function chooseMoving(stars){
    const want = Math.min(Math.max(0, S.move || 260), stars.length);
    const bias = S.bias || 'balanced';
    const ranked = stars.slice().sort((a, b) => {
      const scoreA = bias === 'bright' ? a.peak : bias === 'size' ? a.r : bias === 'isolated' ? a.isolation : a.score;
      const scoreB = bias === 'bright' ? b.peak : bias === 'size' ? b.r : bias === 'isolated' ? b.isolation : b.score;
      return scoreB - scoreA;
    });
    const moving = [];
    const spacing = Math.max(2.5, Math.min(S.src.width, S.src.height) / 220);
    for (const s of ranked) {
      if (moving.length >= want) break;
      let ok = true;
      for (const t of moving) {
        if (Math.hypot(s.x - t.x, s.y - t.y) < Math.max(spacing, (s.r + t.r) * 0.32)) { ok = false; break; }
      }
      if (ok) moving.push(s);
    }
    for (const s of ranked) {
      if (moving.length >= want) break;
      if (!moving.includes(s)) moving.push(s);
    }
    return moving.slice(0, want);
  }

  function createStarsOnly(src, starless, mask){
    const W = src.width, H = src.height;
    const out = makeCanvas(W, H);
    const ctx = getCtx(out);
    const srcData = getImageData(src).data;
    const bgData = getImageData(starless).data;
    const id = ctx.createImageData(W, H);
    for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
      const a = clamp(mask[i], 0, 1);
      if (a <= 0.002) continue;
      id.data[p] = clamp(srcData[p] - bgData[p] + 24, 0, 255);
      id.data[p+1] = clamp(srcData[p+1] - bgData[p+1] + 24, 0, 255);
      id.data[p+2] = clamp(srcData[p+2] - bgData[p+2] + 24, 0, 255);
      id.data[p+3] = clamp(a * 255, 0, 255) | 0;
    }
    ctx.putImageData(id, 0, 0);
    return out;
  }

  function bucket(n){
    if (n < 100) return '<100';
    if (n < 300) return '100-299';
    if (n < 700) return '300-699';
    if (n < 1500) return '700-1499';
    return '1500+';
  }

  async function buildEngine(){
    if (!hasState()) return;
    readControls();
    const src = S.src;
    const buildBtn = $('build'); if (buildBtn) buildBtn.disabled = true;
    try {
      showProgress('Finding stars', 5, 'Building luminance and local background maps…');
      await sleep(20);
      const detection = detectStars(src);
      const stars = detection.stars;
      if (!stars.length) {
        hideProgress();
        setStatus('No stars detected. Lower Star Strictness.');
        if (buildBtn) buildBtn.disabled = false;
        return;
      }
      showProgress('Classifying stars', 26, 'Assigning three parallax tiers…');
      await sleep(20);
      assignTiers(stars);
      showProgress('Creating star mask', 42, 'Expanding star halos into a soft mask…');
      await sleep(20);
      const mask = buildMask(src.width, src.height, stars);
      const maskCanvas = maskToCanvas(mask, src.width, src.height);
      showProgress('Creating starless background', 62, 'Inpainting masked stars from local background…');
      await sleep(20);
      const starless = createStarless(src, mask, stars);
      showProgress('Creating star sprites', 82, 'Building moving star sprites…');
      await sleep(20);
      createSprites(src, mask, stars);
      const moving = chooseMoving(stars);
      const movingIds = new Set(moving.map(s => s.id));
      const suppressed = stars.filter(s => !movingIds.has(s.id));
      const starsOnly = createStarsOnly(src, starless, mask);

      S.mask = { a: mask, canvas: maskCanvas };
      S.starless = starless;
      S.starsOnly = starsOnly;
      S.stars = stars;
      S.movers = moving;
      S.statics = [];
      S.suppressedStars = suppressed;
      S.map = 1;
      S.cx = 0.5;
      S.cy = 0.5;
      S.last = 0;

      setText('mv', String(moving.length));
      const stats = $('stats');
      if (stats) {
        stats.style.display = 'block';
        const tiers = [1, 2, 3].map(t => moving.filter(s => s.tier === t).length);
        stats.textContent = `${stars.length} stars detected · ${moving.length} moving · tiers ${tiers[0]}/${tiers[1]}/${tiers[2]} · ${suppressed.length} suppressed`;
      }
      const play = $('play'); if (play) play.disabled = false;
      const exp = $('export'); if (exp) exp.disabled = false;
      if (buildBtn) { buildBtn.disabled = false; buildBtn.textContent = 'Rebuild Star Layers'; }
      showProgress('Ready', 100, 'Starless background and parallax layers ready');
      await sleep(20);
      hideProgress();
      renderEngine(0);
      setStatus(`${ENGINE_VERSION} ready · starless background + ${moving.length} moving stars`);
      if (window.trackGA4) window.trackGA4('stars_extracted', { engine: ENGINE_VERSION, stars_bucket: bucket(stars.length), moving_bucket: bucket(moving.length) });
    } catch (err) {
      hideProgress();
      if (buildBtn) buildBtn.disabled = false;
      console.error(err);
      setStatus('Build failed: ' + (err && err.message ? err.message : err));
    }
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
    return { sx: clamp(cx - sw / 2, 0, Math.max(0, img.width - sw)), sy: clamp(cy - sh / 2, 0, Math.max(0, img.height - sh)), sw, sh };
  }

  function mapxy(x, y, r, w, h){ return { x: (x - r.sx) / r.sw * w, y: (y - r.sy) / r.sh * h }; }

  function hash(str){ let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; }

  function travelToEdge(star, ax, ay, W, H){
    let dx = star.x - ax, dy = star.y - ay;
    const len = Math.hypot(dx, dy);
    if (len < 1e-3) { const ang = hash(star.id) * Math.PI * 2; dx = Math.cos(ang); dy = Math.sin(ang); }
    else { dx /= len; dy /= len; }
    const tx = dx > 0 ? (W - star.x + 80) / dx : dx < 0 ? (-star.x - 80) / dx : Infinity;
    const ty = dy > 0 ? (H - star.y + 80) / dy : dy < 0 ? (-star.y - 80) / dy : Infinity;
    return { dx, dy, dist: Math.max(20, Math.min(Math.abs(tx), Math.abs(ty))) };
  }

  function drawStar(ctx, s, r, w, h, t, moving, boost){
    const img = s.img || s.sp;
    if (!img) return;
    let x = s.x, y = s.y, scale = w / r.sw;
    if (moving) {
      const ax = (S.cx == null ? 0.5 : S.cx) * S.src.width;
      const ay = (S.cy == null ? 0.5 : S.cy) * S.src.height;
      const path = travelToEdge(s, ax, ay, S.src.width, S.src.height);
      const phase = ((t || 0) * Math.max(0.01, S.fly || 0.65) * (s.speed || 1)) % 1;
      x = s.x + path.dx * path.dist * phase;
      y = s.y + path.dy * path.dist * phase;
      scale *= 1 + (S.grow || 0) * (s.depth || 1) * phase * 0.75;
    }
    if (boost) scale *= 1.2;
    const p = mapxy(x, y, r, w, h);
    if (p.x < -180 || p.y < -180 || p.x > w + 180 || p.y > h + 180) return;
    ctx.drawImage(img, p.x - s.ax * scale, p.y - s.ay * scale, s.w * scale, s.h * scale);
  }

  function drawStarList(ctx, list, r, w, h, t, moving, boost){
    if (boost) { ctx.save(); ctx.filter = 'brightness(2.25) contrast(1.2)'; }
    for (const s of list || []) drawStar(ctx, s, r, w, h, t, moving, boost);
    if (boost) ctx.restore();
  }

  function renderEngine(t){
    readControls();
    setUI();
    if (!hasState()) { if (baseRender) baseRender(t || 0); return; }
    const c = $('main'); if (!c) return;
    try { if (typeof size === 'function') size(S.src.width, S.src.height); } catch (e) {}
    const ctx = c.getContext('2d');
    const w = c.width, h = c.height;
    const mode = S.preview || 'final';
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const bg = S.starless || S.src;
    if (mode === 'mask' && S.mask && S.mask.canvas) {
      const r = sourceRect(S.mask.canvas, w, h, 0);
      ctx.drawImage(S.mask.canvas, r.sx, r.sy, r.sw, r.sh, 0, 0, w, h);
      return;
    }
    if (mode === 'starless') {
      const r = sourceRect(bg, w, h, 0);
      ctx.drawImage(bg, r.sx, r.sy, r.sw, r.sh, 0, 0, w, h);
      return;
    }
    if (mode === 'stars') {
      const r = sourceRect(S.src, w, h, 0);
      drawStarList(ctx, S.suppressedStars || [], r, w, h, 0, false, true);
      return;
    }
    if (mode === 'moving') {
      const r = sourceRect(S.src, w, h, 0);
      drawStarList(ctx, S.movers || [], r, w, h, 0, false, true);
      return;
    }

    const r = sourceRect(bg, w, h, t || 0);
    ctx.drawImage(bg, r.sx, r.sy, r.sw, r.sh, 0, 0, w, h);
    drawStarList(ctx, S.movers || [], r, w, h, t || 0, true, false);
    S.last = t || 0;
  }

  function install(){
    setUI();
    if (!baseRender && typeof render === 'function') baseRender = render;
    try { build = buildEngine; render = renderEngine; } catch (e) {}

    const buildBtn = $('build');
    if (buildBtn && !buildBtn.dataset.v080Engine) {
      const clone = buildBtn.cloneNode(true);
      clone.dataset.v080Engine = '1';
      buildBtn.parentNode.replaceChild(clone, buildBtn);
      clone.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation && e.stopImmediatePropagation(); buildEngine(); }, true);
    }
    const preview = $('preview');
    if (preview && !preview.dataset.v080Engine) {
      preview.dataset.v080Engine = '1';
      preview.addEventListener('change', () => setTimeout(() => renderEngine(S.last || 0), 0), true);
    }
    for (const id of ['move', 'fly', 'grow', 'zoom', 'preset', 'bias']) {
      const el = $(id);
      if (el && !el.dataset.v080Engine) {
        el.dataset.v080Engine = '1';
        el.addEventListener('input', () => { if (hasState() && S.map) renderEngine(S.last || 0); }, true);
        el.addEventListener('change', () => { if (hasState() && S.map) renderEngine(S.last || 0); }, true);
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
