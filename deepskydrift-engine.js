(function(){
  const VERSION='v0.7.6';
  const $=id=>document.getElementById(id);
  function ready(){try{return typeof S!=='undefined'&&S&&S.src}catch(e){return false}}
  function label(){
    const v=document.querySelector('.ver'); if(v)v.textContent=VERSION;
    const b=$('badge'); if(b)b.textContent=VERSION+' · relaxed star extraction';
    const w=document.querySelector('.warn'); if(w)w.textContent=VERSION+' · Relaxed star extraction.';
  }
  const baseBuild=typeof build==='function'?build:null;
  async function buildRelaxed(){
    if(!ready()||!baseBuild)return;
    const requested=Math.max(260,Number(($('move')&&$('move').value)||S.move||260));
    const oldStrict=S.strict, oldMax=S.max;
    const relaxed=requested>=700?0.14:(requested>=450?0.18:(requested>=260?0.24:0.32));
    S.strict=Math.min(Number.isFinite(oldStrict)?oldStrict:0.7,relaxed);
    S.max=Math.max(Number.isFinite(oldMax)?oldMax:2200,Math.min(14000,Math.max(3200,requested*8)));
    try{await baseBuild()}finally{S.strict=oldStrict;S.max=oldMax}
    label();
    const stats=$('stats'); if(stats)stats.textContent=stats.textContent+' · relaxed max '+S.max;
    const st=$('status'); if(st)st.textContent=VERSION+' relaxed extraction ready';
  }
  function install(){
    label();
    try{build=buildRelaxed}catch(e){}
    const btn=$('build');
    if(btn&&!btn.dataset.relaxedLive){
      btn.dataset.relaxedLive='1';
      btn.addEventListener('click',function(){setTimeout(buildRelaxed,0)},true);
    }
  }
  document.addEventListener('DOMContentLoaded',install);
})();
