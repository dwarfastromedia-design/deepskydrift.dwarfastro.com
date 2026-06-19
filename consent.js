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

  document.addEventListener('DOMContentLoaded', function(){
    installDiagnosticsSection();
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
