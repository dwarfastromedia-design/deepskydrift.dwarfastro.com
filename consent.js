(function(){
  const GA_ID = 'G-FEZT7C1Y93';
  const CONSENT_KEY = 'deepskydrift_ga_consent';
  const VERSION_KEY = 'deepskydrift_loaded_version';
  const FALLBACK_VERSION = '0.7.2-20260608a';

  function getConsent(){ try { return localStorage.getItem(CONSENT_KEY); } catch(e) { return null; } }
  function setConsent(value){ try { localStorage.setItem(CONSENT_KEY, value); } catch(e) {} }

  async function getAppVersion(){
    try {
      const r = await fetch('VERSION?ts=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return FALLBACK_VERSION;
      const text = (await r.text()).trim();
      return text || FALLBACK_VERSION;
    } catch(e) {
      return FALLBACK_VERSION;
    }
  }

  function rememberVersion(version){
    try {
      const previous = localStorage.getItem(VERSION_KEY);
      localStorage.setItem(VERSION_KEY, version);
      if (previous && previous !== version) {
        console.info('DeepSkyDrift updated', previous, '→', version);
      }
    } catch(e) {}
  }

  function loadScript(id, src, version){
    return new Promise(function(resolve){
      if (document.getElementById(id)) { resolve(); return; }
      const s = document.createElement('script');
      s.id = id;
      s.src = src + '?v=' + encodeURIComponent(version);
      s.onload = function(){ resolve(); };
      s.onerror = function(){ resolve(); };
      document.body.appendChild(s);
    });
  }

  async function loadLayeredEngine(){
    const version = await getAppVersion();
    window.DSD_VERSION = version;
    rememberVersion(version);
    await loadScript('layered070Script', 'layered-070.js', version);
    await loadScript('layered071Script', 'layered-071.js', version);
    await loadScript('versionUiScript', 'version-ui-072.js', version);
    const v = document.querySelector('.ver');
    if (v) v.textContent = 'v' + version.split('-')[0];
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
    loadLayeredEngine();
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