(function(){
  function g(id){return document.getElementById(id)}
  function ready(){try{return typeof S!=='undefined'&&S&&S.src}catch(e){return false}}
  function label(){
    var v=document.querySelector('.ver'); if(v)v.textContent='v0.7.6';
    var b=g('badge'); if(b)b.textContent='v0.7.6 · relaxed star extraction';
    var w=document.querySelector('.warn'); if(w)w.textContent='v0.7.6 · Relaxed star extraction.';
  }
  var priorBuild=typeof build==='function'?build:null;
  async function buildRelaxed(){
    if(!ready()||!priorBuild)return;
    var requested=Math.max(260,Number((g('move')&&g('move').value)||S.move||260));
    var oldStrict=S.strict, oldMax=S.max;
    var targetStrict=requested>=700?0.14:(requested>=450?0.18:(requested>=260?0.24:0.32));
    S.strict=Math.min(Number.isFinite(oldStrict)?oldStrict:0.7,targetStrict);
    S.max=Math.max(Number.isFinite(oldMax)?oldMax:2200,Math.min(14000,Math.max(3200,requested*8)));
    try{await priorBuild()}finally{S.strict=oldStrict;S.max=oldMax}
    label();
    var stats=g('stats'); if(stats)stats.textContent=stats.textContent+' · relaxed pass';
    var st=g('status'); if(st)st.textContent='v0.7.6 relaxed star extraction ready';
  }
  function install(){
    label();
    try{build=buildRelaxed}catch(e){}
    var btn=g('build');
    if(btn&&!btn.dataset.relaxedExtraction){
      btn.dataset.relaxedExtraction='1';
      btn.addEventListener('click',function(){setTimeout(buildRelaxed,0)},true);
    }
  }
  document.addEventListener('DOMContentLoaded',install);
})();
