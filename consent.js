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
      style.textContent = '.playBtn,.exportBtn{background:#0d4f86!important;border-color:#7cc8ff!important;color:#e8f5ff!important;font-weight:900!important;box-shadow:0 0 0 1px #7cc8ff22,0 0 18px #4fa3ff26!important}.mobileActions .playBtn,.mobileActions .exportBtn{background:#0d4f86!important;border-color:#7cc8ff!important;color:#e8f5ff!important}@media(max-width:700px) and (orientation:portrait){.app-header{justify-content:flex-start!important;gap:6px!important;padding:0 8px!important}.brandLink{display:flex!important;gap:5px!important;flex:0 0 auto!important;min-width:0!important}.brandLogoPlate{width:30px!important;height:30px!important}.brandLogo{width:28px!important;height:28px!important}.brandName{display:inline!important;font-size:13px!important;line-height:1!important;white-space:nowrap!important}.barSep{display:block!important;height:24px!important;width:1px!important;flex:0 0 1px!important;margin:0 2px!important}.appTitle{display:flex!important;flex:0 1 auto!important;min-width:0!important}.appTitle strong{font-size:14px!important;line-height:1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}aside{left:auto!important;right:0!important;border-left:1px solid #26364b!important;border-right:0!important;transform:translateX(105%)!important}body.controls-open aside{transform:translateX(0)!important}body.controls-open:after{left:0!important;right:0!important}.drawerClose{display:none!important}.drawerTab{left:auto!important;right:0!important;top:auto!important;bottom:calc(126px + env(safe-area-inset-bottom))!important;transform:none!important;width:38px!important;min-width:38px!important;max-width:38px!important;height:96px!important;min-height:96px!important;max-height:96px!important;border-radius:12px 0 0 12px!important;border-left:1px solid #2e5f94!important;border-right:0!important;z-index:91!important;padding:8px 4px!important;background:#071421f2!important;color:#7cc8ff!important;box-shadow:0 0 18px #0009!important}body.controls-open .drawerTab{right:min(82vw,340px)!important;background:#0d2740f5!important;border-color:#7cc8ff!important;color:#e8f5ff!important;box-shadow:-10px 0 34px #0008!important}}@media(max-width:380px) and (orientation:portrait){.brandName{font-size:12px!important}.appTitle strong{font-size:13px!important}.app-header{gap:5px!important;padding:0 7px!important}.drawerTab{bottom:calc(118px + env(safe-area-inset-bottom))!important}}';
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
    installOptionsTabToggle();
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
