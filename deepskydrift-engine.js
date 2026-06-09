(function(){
  const $ = id => document.getElementById(id);
  const clamp = (x,a,b) => Math.max(a, Math.min(b, x));
  const versionRaw = (window.DSD_VERSION || '0.7.3-20260608b').toString().trim();
  const VERSION = 'v' + versionRaw.split('-')[0];

  function ok(){ try { return typeof S !== 'undefined' && S && S.src; } catch(e){ return false; } }
  function setUI(){
    const v = document.querySelector('.ver'); if (v) v.textContent = VERSION;
    const b = $('badge'); if (b) b.textContent = VERSION + ' · consolidated engine';
    const w = document.querySelector('.warn'); if (w) w.textContent = VERSION + ' · Consolidated engine.';
    const p = $('preview');
    if (p) Array.from(p.options).forEach(o=>{
      if(o.value==='final') o.text='Final Preview';
      if(o.value==='starless') o.text='Clean Background';
      if(o.value==='stars') o.text='Static Stars';
      if(o.value==='moving') o.text='Stars That Move';
      if(o.value==='mask') o.text='Star Mask';
    });
  }

  function score(s){ return (s.score||0)+(s.peak||0)*3+(s.iso||0)*0.25+(s.r||0)*0.2; }
  function chooseMoving(stars){
    const want = Math.min(Number(($('move')&&$('move').value)||S.move||260), stars.length);
    const ranked = stars.slice().sort((a,b)=>score(b)-score(a));
    const chosen = [];
    const spacing = Math.max(7, Math.min(S.src.width,S.src.height)/95);
    for(const s of ranked){
      if(chosen.length>=want) break;
      let good = true;
      for(const t of chosen){ if(Math.hypot(s.x-t.x,s.y-t.y) < Math.max(spacing,(s.r+t.r)*0.75)){ good=false; break; } }
      if(good) chosen.push(s);
    }
    for(const s of ranked){ if(chosen.length>=want) break; if(!chosen.includes(s)) chosen.push(s); }
    return chosen;
  }

  function repairLayers(){
    if(!ok() || !Array.isArray(S.stars) || !S.stars.length) return;
    const moving = chooseMoving(S.stars);
    const moveSet = new Set(moving.map(s=>s.id));
    S.movers = moving;
    S.statics = S.stars.filter(s=>!moveSet.has(s.id));
    S.move = S.movers.length;
    if($('mv')) $('mv').textContent = String(S.move);
    if($('stats')){
      $('stats').style.display='block';
      $('stats').textContent = `${S.stars.length} stars · ${S.move} moving · ${S.statics.length} static · consolidated engine`;
    }
  }

  const baseBuild = typeof build === 'function' ? build : null;
  const baseRender = typeof render === 'function' ? render : null;

  async function engineBuild(){
    if(!ok() || !baseBuild) return;
    await baseBuild();
    repairLayers();
    setUI();
    if(typeof baseRender === 'function') baseRender(0);
    const s = $('status'); if(s) s.textContent = VERSION + ' consolidated engine ready';
  }

  function renderMovingPreview(){
    if(!ok()) return false;
    const c = $('main'); if(!c) return false;
    try { if(typeof size === 'function') size(S.src.width,S.src.height); } catch(e) {}
    const ctx = c.getContext('2d'), w=c.width, h=c.height;
    ctx.clearRect(0,0,w,h);
    const ia = S.src.width/S.src.height, oa = w/h;
    let sw,sh; if(ia>oa){ sh=S.src.height; sw=sh*oa; } else { sw=S.src.width; sh=sw/oa; }
    const sx=(S.src.width-sw)/2, sy=(S.src.height-sh)/2;
    ctx.save();
    ctx.globalCompositeOperation='source-over';
    ctx.filter='brightness(2.2) contrast(1.25)';
    for(const s of S.movers||[]){
      if(!s.img) continue;
      const x=(s.x-sx)/sw*w, y=(s.y-sy)/sh*h, sc=w/sw*(1.15);
      if(x<-80||y<-80||x>w+80||y>h+80) continue;
      ctx.drawImage(s.img, x-s.ax*sc, y-s.ay*sc, s.w*sc, s.h*sc);
    }
    ctx.restore();
    return true;
  }

  function engineRender(t){
    setUI();
    if(ok() && (S.preview||'final')==='moving'){
      if(renderMovingPreview()) return;
    }
    if(typeof baseRender === 'function') baseRender(t||0);
    setUI();
  }

  function install(){
    setUI();
    try { build = engineBuild; render = engineRender; } catch(e) {}
    const btn = $('build');
    if(btn && !btn.dataset.consolidatedEngine){
      const clone = btn.cloneNode(true);
      clone.dataset.consolidatedEngine = '1';
      btn.parentNode.replaceChild(clone, btn);
      clone.addEventListener('click', e=>{ e.preventDefault(); e.stopImmediatePropagation&&e.stopImmediatePropagation(); engineBuild(); }, true);
    }
    const p = $('preview');
    if(p && !p.dataset.consolidatedEngine){
      p.dataset.consolidatedEngine = '1';
      p.addEventListener('change', ()=>setTimeout(()=>engineRender(S.last||0),0), true);
    }
    document.addEventListener('click', ()=>setTimeout(setUI,0), true);
  }

  document.addEventListener('DOMContentLoaded', install);
})();
