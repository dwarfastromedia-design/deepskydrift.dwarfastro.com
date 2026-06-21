(function(){
  const VERSION = 'v0.9.7';
  function clamp(x,a,b){ return Math.max(a, Math.min(b, x)); }
  function ease(x){ x = clamp(x,0,1); return x*x*(3-2*x); }
  function install(){
    try {
      if (window.__DSD_MOTION_CLEANUP_097__) return;
      if (typeof drawMoving !== 'function' || typeof drawStatic !== 'function' || typeof starPhase !== 'function' || typeof srcRect !== 'function') return;
      drawStars = function(g, list, r, w, h, t, moving = false, boost = false){
        if (!list || !list.length) return;
        for (const s of list) {
          if (!moving) { drawStatic(g, s, r, w, h, boost); continue; }
          if (S && S.anchorPreview) { drawMoving(g, s, r, w, h, 0, 1, 0); continue; }
          const p = starPhase(s, t);
          const fadeOut = 1 - ease((p - 0.82) / 0.16);
          const alpha = clamp(fadeOut, 0, 1);
          if (alpha > 0.01) drawMoving(g, s, r, w, h, t, alpha, p);
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
      window.__DSD_MOTION_CLEANUP_097__ = true;
    } catch(e) {}
  }
  install();
  setInterval(install, 500);
})();
