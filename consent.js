(function(){
  const GA_ID = 'G-FEZT7C1Y93';
  const CONSENT_KEY = 'deepskydrift_ga_consent';
  const VERSION_KEY = 'deepskydrift_loaded_version';
  const FALLBACK = { version: '0.8.0', cacheKey: '0.8.0-star-pipeline', engine: 'deepskydrift-engine.js', runtimeFix: null };

  function getConsent(){ try { return localStorage.getItem(CONSENT_KEY); } catch(e) { return null; } }
  function setConsent(value){ try { localStorage.setItem(CONSENT_KEY, value); } catch(e) {} }

  async function getManifest(){
    try {
      const r = await fetch('version.json?ts=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return FALLBACK;
      const data = await r.json();
      return Object.assign({}, FALLBACK, data || {});
    } catch(e) {
      return FALLBACK;
    }
  }

  function rememberVersion(key){ try { localStorage.setItem(VERSION_KEY, key); } catch(e) {} }

  function loadScript(id, src, key){
    return new Promise(function(resolve){
      const existing = document.getElementById(id);
      if (existing) existing.remove();
      const s = document.createElement('script');
      s.id = id;
      s.src = src + '?v=' + encodeURIComponent(key) + '&ts=' + Date.now();
      s.onload = function(){ resolve(); };
      s.onerror = function(){ resolve(); };
      document.body.appendChild(s);
    });
  }

  async function loadEngine(){
    const manifest = await getManifest();
    const key = manifest.cacheKey || manifest.version || FALLBACK.cacheKey;
    window.DSD_VERSION = key;
    rememberVersion(key);
    await loadScript('deepskydriftEngineScript', manifest.engine || FALLBACK.engine, key);
    if (manifest.runtimeFix) await loadScript('runtimeFixScript', manifest.runtimeFix, key);
    const label = window.DSD_LIVE_VERSION || ('v' + (manifest.version || key).split('-')[0]);
    const v = document.querySelector('.ver'); if (v) v.textContent = label;
  }

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

  document.addEventListener('DOMContentLoaded', function(){
    loadEngine();
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
