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
  function loadLayeredEngine(){
    if (!document.getElementById('layered070Script')) {
      const s = document.createElement('script');
      s.id = 'layered070Script';
      s.src = 'layered-070.js?v=0.7.0';
      document.body.appendChild(s);
    }
    if (!document.getElementById('layered071Script')) {
      const f = document.createElement('script');
      f.id = 'layered071Script';
      f.src = 'layered-071.js?v=0.7.1';
      document.body.appendChild(f);
    }
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