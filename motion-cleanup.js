(function(){
  const VERSION = 'v0.9.9';
  const BASE_CYCLE_SECONDS = 10;
  function clamp(x,a,b){ return Math.max(a, Math.min(b, x)); }
  function ease(x){ x = clamp(x,0,1); return x*x*(3-2*x); }
  function fract(x){ return x - Math.floor(x); }
  function hash01(n){ return fract(Math.sin(n * 12.9898 + 78.233) * 43758.5453123); }
  function starSeed(s,i){
    const x = Number(s.x || 0), y = Number(s.y || 0);
    const r = Number(s.r || s.radius || 0);
    const b = Number(s.b || s.flux || s.brightness || s.snr || 0);
    return x * 0.754877666 + y * 0.569840296 + r * 0.438289623 + b * 0.228459041 + i * 0.1234567;
  }
  function travelSpeed(){
    try { return clamp(Number(S && S.travel ? S.travel : 1), 0.1, 7); } catch(e) { return 1; }
  }
  function profile(s,i){
    if (s.__motionProfile099) return s.__motionProfile099;
    const seed = starSeed(s,i);
    const cooldown = 0.08 + hash01(seed + 1.71) * 0.18;
    s.__motionProfile099 = {
      phaseOffset: hash01(seed + 0.11),
      cooldown,
      activeSpan: 1 - cooldown,
      speed: 0.92 + hash01(seed + 2.37) * 0.22,
      brightness: 0.92 + hash01(seed + 3.19) * 0.22
    };
    return s.__motionProfile099;
  }
  function life(s,t,i){
    const p = profile(s,i);
    const cycle = (((t || 0) * travelSpeed() / BASE_CYCLE_SECONDS) * p.speed + p.phaseOffset) % 1;
    if (cycle > p.activeSpan) return null;
    const q = cycle / p.activeSpan;
    const fadeIn = ease(q / 0.06);
    const fadeOut = 1 - ease((q - 0.82) / 0.18);
    const alpha = clamp(Math.min(fadeIn, fadeOut), 0, 1) * p.brightness;
    return alpha > 0.01 ? { phase:q, alpha } : null;
  }
  function install(){
    try {
      if (window.__DSD_MOTION_CLEANUP_099__) return;
      if (typeof drawMoving !== 'function' || typeof drawStatic !== 'function' || typeof srcRect !== 'function') return;
      drawStars = function(g, list, r, w, h, t, moving = false, boost = false){
        if (!list || !list.length) return;
        for (let i=0; i<list.length; i++) {
          const s = list[i];
          if (!moving) { drawStatic(g, s, r, w, h, boost); continue; }
          if (S && S.anchorPreview) { drawMoving(g, s, r, w, h, 0, 1, 0); continue; }
          const l = life(s, t, i);
          if (l) drawMoving(g, s, r, w, h, t, l.alpha, l.phase);
        }
      };
      if (typeof drawFrame088 === 'function') {
        drawFrame088 = function(c, t = 0){
          if (!S || !S.src) return;
          const g = c.getContext('2d'), w = c.width, h = c.height;
          const bg = S.framing ? S.src : (S.motionBg || S.src);
          const r = srcRect(bg, w, h, S.framing ? 0 : t);
          const starRect = srcRect(S.src, w, h, S.framing ? 0 : t);
          g.clearRect(0,0,w,h);
          g.fillStyle = '#000';
          g.fillRect(0,0,w,h);
          g.imageSmoothingEnabled = true;
          g.imageSmoothingQuality = 'high';
          g.drawImage(bg, r.sx, r.sy, r.sw, r.sh, 0, 0, w, h);
          if (!S.framing) drawStars(g, S.movers || [], starRect, w, h, t, true, false);
        };
        try { window.DSD_DRAW_FRAME = drawFrame088; } catch(e) {}
      }
      const v = document.getElementById('appVersion');
      if (v) v.textContent = VERSION;
      window.__DSD_MOTION_CLEANUP_099__ = true;
    } catch(e) {}
  }
  install();
  setInterval(install, 500);
})();
