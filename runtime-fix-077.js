(function(){
  var VERSION='v0.7.7';
  window.DSD_LIVE_VERSION=VERSION;
  function q(id){return document.getElementById(id)}
  function apply(){
    var v=document.querySelector('.ver'); if(v)v.textContent=VERSION;
    var b=q('badge'); if(b)b.textContent=VERSION+' runtime fix loaded';
    var w=document.querySelector('.warn'); if(w)w.textContent=VERSION+' runtime fix loaded.';
  }
  var originalBuild=null;
  function install(){
    apply();
    if(typeof build==='function' && build!==wrappedBuild){originalBuild=build; build=wrappedBuild;}
  }
  async function wrappedBuild(){
    if(!originalBuild)return;
    var oldStrict=S.strict, oldMax=S.max;
    var requested=Math.max(260,Number((q('move')&&q('move').value)||S.move||260));
    S.strict=Math.min(Number.isFinite(oldStrict)?oldStrict:0.7, requested>=700?0.14:requested>=450?0.18:0.24);
    S.max=Math.max(Number.isFinite(oldMax)?oldMax:2200, Math.min(14000, Math.max(3200, requested*8)));
    await originalBuild();
    S.strict=oldStrict; S.max=oldMax;
    apply();
    var s=q('status'); if(s)s.textContent=VERSION+' relaxed extraction ready';
  }
  install();
  setTimeout(install,250);
  setTimeout(install,1000);
  setInterval(apply,2000);
})();
