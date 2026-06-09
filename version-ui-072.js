(function(){
  const FALLBACK='0.7.2-20260608a';
  function current(){
    const raw=(window.DSD_VERSION||FALLBACK).toString().trim();
    return raw || FALLBACK;
  }
  function label(){ return 'v' + current().split('-')[0]; }
  function apply(){
    const versionLabel=label();
    const ver=document.querySelector('.ver');
    if(ver) ver.textContent=versionLabel;
    const badge=document.getElementById('badge');
    if(badge && /v0\./.test(badge.textContent||'')) badge.textContent=versionLabel+' · manifest-loaded app';
    const warn=document.querySelector('.warn');
    if(warn && /v0\./.test(warn.textContent||'')) warn.textContent=versionLabel+' · Manifest-loaded app.';
  }
  document.addEventListener('DOMContentLoaded',function(){
    apply();
    document.addEventListener('click',function(){ setTimeout(apply,0); setTimeout(apply,250); setTimeout(apply,1000); },true);
    document.addEventListener('change',function(){ setTimeout(apply,0); setTimeout(apply,250); },true);
    setInterval(apply,1500);
  });
  window.DeepSkyDriftApplyVersion=apply;
})();
