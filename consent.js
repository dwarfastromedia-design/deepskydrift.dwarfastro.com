(function(){
  const GA_ID = 'G-FEZT7C1Y93';
  const CONSENT_KEY = 'deepskydrift_ga_consent';

  function getConsent(){ try { return localStorage.getItem(CONSENT_KEY); } catch(e) { return null; } }
  function setConsent(value){ try { localStorage.setItem(CONSENT_KEY, value); } catch(e) {} }

  function loadGA(){
    if (window.gtag) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip: true });
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
  }

  window.trackGA4 = function(eventName, params = {}){
    try {
      if (getConsent() !== 'accepted') return;
      if (!window.gtag) return;
      window.gtag('event', eventName, params || {});
    } catch(e) {}
  };

  function showBanner(){ const el = document.getElementById('cookieConsent'); if (el) el.classList.add('show'); }
  function hideBanner(){ const el = document.getElementById('cookieConsent'); if (el) el.classList.remove('show'); }

  function installDiagnosticsSection(){
    try {
      const preview = document.getElementById('preview');
      if (!preview) return;
      const advanced = preview.closest('details.advanced');
      const oldSection = preview.closest('section.sec');
      if (!advanced || !oldSection) return;
      if (preview.closest('details.diagnosticsWrap')) return;
      const style = document.createElement('style');
      style.textContent = '.diagnosticsWrap{margin-top:10px;border-top:1px solid #1b2a3b;padding-top:10px}.diagnosticsWrap>summary{cursor:pointer;color:#7cc8ff;font:10px monospace;text-transform:uppercase;letter-spacing:.12em;list-style:none}.diagnosticsWrap>summary::-webkit-details-marker{display:none}.diagnosticsWrap>summary:after{content:"+";float:right;color:#50627b}.diagnosticsWrap[open]>summary:after{content:"–"}.diagnosticsWrap .sec{border-bottom:0!important;padding-bottom:0!important}';
      document.head.appendChild(style);
      const diagnostics = document.createElement('details');
      diagnostics.className = 'diagnosticsWrap';
      const summary = document.createElement('summary');
      summary.textContent = 'Diagnostics';
      const section = document.createElement('section');
      section.className = 'sec';
      preview.value = 'final';
      section.appendChild(preview);
      diagnostics.appendChild(summary);
      diagnostics.appendChild(section);
      oldSection.remove();
      advanced.appendChild(diagnostics);
    } catch(e) {}
  }

  function installMobilePortraitPolish(){
    try {
      if (document.getElementById('mobilePortraitPolish')) return;
      const style = document.createElement('style');
      style.id = 'mobilePortraitPolish';
      style.textContent = '.playBtn,.exportBtn{background:#0d4f86!important;border-color:#7cc8ff!important;color:#e8f5ff!important;font-weight:900!important;box-shadow:0 0 0 1px #7cc8ff22,0 0 18px #4fa3ff26!important}.mobileActions .playBtn,.mobileActions .exportBtn{background:#0d4f86!important;border-color:#7cc8ff!important;color:#e8f5ff!important}@media(max-width:700px) and (orientation:portrait){.app-header{justify-content:flex-start!important;gap:6px!important;padding:0 8px!important}.brandLink{display:flex!important;gap:5px!important;flex:0 0 auto!important;min-width:0!important}.brandLogoPlate{width:30px!important;height:30px!important}.brandLogo{width:28px!important;height:28px!important}.brandName{display:inline!important;font-size:13px!important;line-height:1!important;white-space:nowrap!important}.barSep{display:block!important;height:24px!important;width:1px!important;flex:0 0 1px!important;margin:0 2px!important}.appTitle{display:flex!important;flex:0 1 auto!important;min-width:0!important}.appTitle strong{font-size:14px!important;line-height:1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}aside{left:auto!important;right:0!important;top:58px!important;bottom:0!important;height:auto!important;max-height:none!important;border-left:1px solid #26364b!important;border-right:0!important;transform:translateX(105%)!important;padding-bottom:calc(26px + env(safe-area-inset-bottom))!important;z-index:88!important}body.controls-open aside{transform:translateX(0)!important}body.controls-open:after{left:0!important;right:0!important;top:58px!important;bottom:0!important}.drawerClose{display:none!important}.drawerTab{left:auto!important;right:0!important;top:auto!important;bottom:calc(126px + env(safe-area-inset-bottom))!important;transform:none!important;width:38px!important;min-width:38px!important;max-width:38px!important;height:96px!important;min-height:96px!important;max-height:96px!important;border-radius:12px 0 0 12px!important;border-left:1px solid #26364b!important;border-right:0!important;border-top-color:#26364b!important;border-bottom-color:#26364b!important;z-index:91!important;padding:8px 4px!important;background:#071421f2!important;color:#7cc8ff!important;box-shadow:0 0 18px #0009!important}body.controls-open .drawerTab{right:min(82vw,340px)!important;background:#08101cf8!important;border-color:#26364b!important;color:#dce7f7!important;box-shadow:-10px 0 34px #0008!important}}@media(max-width:380px) and (orientation:portrait){.brandName{font-size:12px!important}.appTitle strong{font-size:13px!important}.app-header{gap:5px!important;padding:0 7px!important}.drawerTab{bottom:calc(118px + env(safe-area-inset-bottom))!important}}';
      document.head.appendChild(style);
    } catch(e) {}
  }

  function installFramingPreviewFix(){
    try {
      if (window.__dsdFramingPreviewFix) return;
      window.__dsdFramingPreviewFix = true;
      if (typeof S === 'undefined') return;
      S.framing = 0;
      const originalDrawFrame = window.drawFrame088 || (typeof drawFrame088 !== 'undefined' ? drawFrame088 : null);
      if (typeof originalDrawFrame === 'function') {
        const stillFrame = function(c, t){
          if (S && S.framing && S.src && typeof srcRect === 'function') {
            const g = c.getContext('2d'), w = c.width, h = c.height, r = srcRect(S.src, w, h, 0);
            g.clearRect(0, 0, w, h);
            g.fillStyle = '#000';
            g.fillRect(0, 0, w, h);
            g.imageSmoothingEnabled = true;
            g.imageSmoothingQuality = 'high';
            g.drawImage(S.src, r.sx, r.sy, r.sw, r.sh, 0, 0, w, h);
            return;
          }
          return originalDrawFrame(c, t);
        };
        window.drawFrame088 = stillFrame;
        try { drawFrame088 = stillFrame; } catch(e) {}
      }
      const view = document.querySelector('.view');
      if (!view) return;
      const startFraming = function(){
        try {
          if (S && S.src && S.viewMode === 'reel916') {
            S.framing = 1;
            if (typeof render088 === 'function') render088(0);
          }
        } catch(e) {}
      };
      const stopFraming = function(){
        try {
          if (S && S.framing) {
            S.framing = 0;
            if (typeof render088 === 'function') setTimeout(function(){ render088(S.last || 0); }, 0);
          }
        } catch(e) {}
      };
      view.addEventListener('pointerdown', startFraming, { capture: true, passive: true });
      view.addEventListener('pointerup', stopFraming, { capture: true, passive: true });
      view.addEventListener('pointercancel', stopFraming, { capture: true, passive: true });
    } catch(e) {}
  }

  function installFrameMotionCenterFix(){
    try {
      if (window.__dsdFrameMotionCenterFix) return;
      window.__dsdFrameMotionCenterFix = true;
      if (typeof S === 'undefined') return;
      const clamp = function(x,a,b){ return Math.max(a, Math.min(b, x)); };
      const ensure = function(){
        if (S.frameCx == null) S.frameCx = S.cx == null ? .5 : S.cx;
        if (S.frameCy == null) S.frameCy = S.cy == null ? .5 : S.cy;
        if (S.motionCx == null) S.motionCx = S.cx == null ? .5 : S.cx;
        if (S.motionCy == null) S.motionCy = S.cy == null ? .5 : S.cy;
      };
      const frameX = function(){ ensure(); return S.frameCx; };
      const frameY = function(){ ensure(); return S.frameCy; };
      const motionX = function(){ ensure(); return S.motionCx; };
      const motionY = function(){ ensure(); return S.motionCy; };

      srcRect = function(img, W, H, t){
        ensure();
        t = t || 0;
        const z = 1 + (S.zoom || 0) * ((t / Math.max(1, S.dur || 10)) % 1);
        const ia = img.width / img.height, oa = W / H;
        let bw, bh;
        if (ia > oa) { bh = img.height; bw = bh * oa; } else { bw = img.width; bh = bw / oa; }
        const sw = bw / z, sh = bh / z, cx = frameX() * img.width, cy = frameY() * img.height;
        return { sx: clamp(cx - sw / 2, 0, Math.max(0, img.width - sw)), sy: clamp(cy - sh / 2, 0, Math.max(0, img.height - sh)), sw, sh };
      };
      motionRect = function(img, W, H){
        ensure();
        const ia = img.width / img.height, oa = W / H;
        let bw, bh;
        if (ia > oa) { bh = img.height; bw = bh * oa; } else { bw = img.width; bh = bw / oa; }
        const cx = frameX() * img.width, cy = frameY() * img.height;
        return { sx: clamp(cx - bw / 2, 0, Math.max(0, img.width - bw)), sy: clamp(cy - bh / 2, 0, Math.max(0, img.height - bh)), sw: bw, sh: bh };
      };
      drawMoving = function(g, s, r, w, h, t, alphaScale, phase){
        const img = s.img || s.sp;
        if (!img) return;
        const p = phase === null || phase === undefined ? starPhase(s, t) : phase;
        const vis = starVis(p);
        if (vis <= .01) return;
        const p0 = mapxy(s.x, s.y, r, w, h);
        const center = mapxy(motionX() * S.src.width, motionY() * S.src.height, r, w, h);
        const v = screenVectorFromCenter(p0, center, w, h);
        const scale = w / r.sw, x = p0.x + v.dx * v.dist * p, y = p0.y + v.dy * v.dist * p;
        if (x < -340 || y < -340 || x > w + 340 || y > h + 340) return;
        g.save();
        g.globalAlpha *= vis * (alphaScale == null ? 1 : alphaScale);
        g.globalCompositeOperation = 'lighter';
        g.filter = 'brightness(2.6) contrast(1.18) saturate(1.12)';
        g.drawImage(img, x - s.ax * scale, y - s.ay * scale, s.w * scale, s.h * scale);
        g.restore();
      };
      updateTarget = function(){
        const m = document.getElementById('target'), h = document.querySelector('.targethint'), c = document.getElementById('main'), v = document.querySelector('.view');
        if (!m || !c || !v || !S.src) { if (m) m.style.display = 'none'; if (h) h.style.display = 'none'; return; }
        const cr = c.getBoundingClientRect(), vr = v.getBoundingClientRect(), rr = srcRect(S.src, c.width, c.height, 0);
        const pt = mapxy(motionX() * S.src.width, motionY() * S.src.height, rr, c.width, c.height);
        m.style.left = (cr.left - vr.left + pt.x) + 'px';
        m.style.top = (cr.top - vr.top + pt.y) + 'px';
        m.style.display = 'block';
        if (h) h.style.display = 'block';
      };
      const originalAutoCenter = autoCenter;
      autoCenter = function(){
        if (typeof originalAutoCenter === 'function') originalAutoCenter();
        ensure();
        S.frameCx = S.motionCx = S.cx == null ? frameX() : S.cx;
        S.frameCy = S.motionCy = S.cy == null ? frameY() : S.cy;
      };

      let localPan = null;
      const point = function(e){
        if (!S.src) return null;
        const c = document.getElementById('main');
        if (!c) return null;
        const b = c.getBoundingClientRect();
        if (!b.width || !b.height) return null;
        const nx = (e.clientX - b.left) / b.width, ny = (e.clientY - b.top) / b.height;
        if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return null;
        const r = srcRect(S.src, c.width, c.height, 0);
        return { x: r.sx + nx * r.sw, y: r.sy + ny * r.sh, rect: r, w: c.width, h: c.height };
      };
      const setMotion = function(e){
        const p = point(e);
        if (!p) return;
        S.motionCx = S.cx = clamp(p.x / S.src.width, .04, .96);
        S.motionCy = S.cy = clamp(p.y / S.src.height, .04, .96);
        if (typeof render088 === 'function') render088(S.last || 0);
        if (typeof window.trackGA4 === 'function') window.trackGA4('center_set', { cx: Number(S.motionCx.toFixed(3)), cy: Number(S.motionCy.toFixed(3)), view_mode: S.viewMode || 'original' });
      };
      const view = document.querySelector('.view');
      if (view && !view.dataset.frameMotionHandler) {
        view.dataset.frameMotionHandler = '1';
        view.addEventListener('pointerdown', function(e){
          const p = point(e);
          if (!p) return;
          ensure();
          localPan = { id: e.pointerId, x: e.clientX, y: e.clientY, frameCx: frameX(), frameCy: frameY(), rect: p.rect, w: p.w, h: p.h, moved: false };
          try { document.getElementById('main').setPointerCapture(e.pointerId); } catch(err) {}
          if (S.viewMode === 'reel916') e.preventDefault();
          e.stopImmediatePropagation();
        }, { capture: true, passive: false });
        view.addEventListener('pointermove', function(e){
          if (!localPan || e.pointerId !== localPan.id || !S.src) return;
          const dx = e.clientX - localPan.x, dy = e.clientY - localPan.y;
          if (Math.abs(dx) + Math.abs(dy) < 8 && !localPan.moved) { e.stopImmediatePropagation(); return; }
          localPan.moved = true;
          if (S.viewMode === 'reel916') {
            S.frameCx = clamp(localPan.frameCx - dx / localPan.w * localPan.rect.sw / S.src.width, .04, .96);
            S.frameCy = clamp(localPan.frameCy - dy / localPan.h * localPan.rect.sh / S.src.height, .04, .96);
            if (typeof render088 === 'function') render088(S.last || 0);
            e.preventDefault();
          }
          e.stopImmediatePropagation();
        }, { capture: true, passive: false });
        view.addEventListener('pointerup', function(e){
          if (!localPan || e.pointerId !== localPan.id) return;
          const moved = localPan.moved;
          localPan = null;
          if (!moved) setMotion(e);
          e.stopImmediatePropagation();
        }, { capture: true, passive: false });
        view.addEventListener('pointercancel', function(e){ localPan = null; e.stopImmediatePropagation(); }, { capture: true, passive: true });
      }
      ensure();
    } catch(e) {}
  }

  function installOptionsTabToggle(){
    try {
      const oldTab = document.getElementById('drawerTab');
      if (!oldTab || oldTab.dataset.optionsToggleInstalled === '1') return;
      const tab = oldTab.cloneNode(true);
      tab.textContent = 'Options';
      tab.dataset.optionsToggleInstalled = '1';
      tab.setAttribute('aria-label', 'Toggle options');
      oldTab.parentNode.replaceChild(tab, oldTab);
      tab.addEventListener('click', function(){
        document.body.classList.toggle('controls-open');
      });
    } catch(e) {}
  }

  document.addEventListener('DOMContentLoaded', function(){
    installDiagnosticsSection();
    installMobilePortraitPolish();
    installFramingPreviewFix();
    installFrameMotionCenterFix();
    setTimeout(installFrameMotionCenterFix, 120);
    setTimeout(installOptionsTabToggle, 0);
    setTimeout(installOptionsTabToggle, 120);
    const consent = getConsent();
    if (consent === 'accepted') { loadGA(); return; }
    if (consent === 'declined') return;
    setTimeout(showBanner, 700);
    const accept = document.getElementById('cookieAccept');
    const decline = document.getElementById('cookieDecline');
    if (accept) accept.addEventListener('click', function(){ setConsent('accepted'); hideBanner(); loadGA(); });
    if (decline) decline.addEventListener('click', function(){ setConsent('declined'); hideBanner(); });
  });
})();
