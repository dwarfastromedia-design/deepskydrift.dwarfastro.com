(function(){
  const $ = id => document.getElementById(id);
  const clamp = (x,a,b) => Math.max(a, Math.min(b, x));
  const versionRaw = (window.DSD_VERSION || '0.7.4-20260608c').toString().trim();
  const VERSION = 'v' + versionRaw.split('-')[0];

  function ok(){ try { return typeof S !== 'undefined' && S && S.src; } catch(e){ return false; } }
  function ease(t){ return t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }
  function setUI(){
    const v = document.querySelector('.ver'); if (v) v.textContent = VERSION;
    const b = $('badge'); if (b) b.textContent = VERSION + ' · layered parallax engine';
    const w = document.querySelector('.warn'); if (w) w.textContent = VERSION + ' · Layered parallax engine.';
    const p = $('preview');
    if (p) Array.from(p.options).forEach(o=>{
      if(o.value==='final') o.text='Final Preview';
      if(o.value==='starless') o.text='Clean Background';
      if(o.value==='stars') o.text='Static Stars';
      if(o.value==='moving') o.text='Stars That Move';
      if(o.value==='mask') o.text='Star Mask';
    });
  }

  function score(s){ return (s.score||0)+(s.peak||0)*3+(s.iso||0)*.28+(s.r||0)*.24; }
  function desiredMoving(){ return Math.max(0, Number(($('move')&&$('move').value)||S.move||260)); }
  function chooseMoving(stars){
    const want = Math.min(desiredMoving(), stars.length);
    const ranked = stars.slice().sort((a,b)=>score(b)-score(a));
    const chosen = [];
    const spacing = Math.max(5, Math.min(S.src.width,S.src.height)/120);
    for(const s of ranked){
      if(chosen.length>=want) break;
      let good = true;
      for(const t of chosen){ if(Math.hypot(s.x-t.x,s.y-t.y) < Math.max(spacing,(s.r+t.r)*.55)){ good=false; break; } }
      if(good) chosen.push(s);
    }
    for(const s of ranked){ if(chosen.length>=want) break; if(!chosen.includes(s)) chosen.push(s); }
    return chosen.slice(0,want);
  }
  function tier(s){
    const q=(s.peak||0)*1.7+(s.r||0)*.45+(s.iso||0)*.12;
    if(q>2.4 || (s.r||0)>6) return 3;
    if(q>1.45 || (s.r||0)>3.2) return 2;
    return 1;
  }
  function annotateMoving(movers){
    for(const s of movers){
      s.tier = tier(s);
      s.depth = s.tier===3 ? 1.7 : (s.tier===2 ? 1.15 : .78);
    }
  }
  function chooseStatic(nonmoving){
    const ranked = nonmoving.slice().sort((a,b)=>score(b)-score(a));
    const cap = Math.min(220, Math.max(40, Math.round((S.stars||[]).length*.12)));
    return ranked.slice(0, cap);
  }
  function repairLayers(){
    if(!ok() || !Array.isArray(S.stars) || !S.stars.length) return;
    const moving = chooseMoving(S.stars);
    annotateMoving(moving);
    const moveIds = new Set(moving.map(s=>s.id));
    const nonmoving = S.stars.filter(s=>!moveIds.has(s.id));
    const statics = chooseStatic(nonmoving);
    S.movers = moving;
    S.statics = statics;
    S.hiddenStars = nonmoving.filter(s=>!statics.includes(s));
    S.move = S.movers.length;
    if($('mv')) $('mv').textContent = String(S.move);
    if($('stats')){
      $('stats').style.display='block';
      $('stats').textContent = `${S.stars.length} detected · ${S.move} moving · ${S.statics.length} static · ${S.hiddenStars.length} suppressed`;
    }
  }

  const baseBuild = typeof build === 'function' ? build : null;
  const baseRender = typeof render === 'function' ? render : null;

  async function engineBuild(){
    if(!ok() || !baseBuild) return;
    await baseBuild();
    repairLayers();
    setUI();
    engineRender(0);
    const s = $('status'); if(s) s.textContent = VERSION + ' layered parallax ready';
  }

  function sourceRect(img,w,h,t){
    const z = 1 + (S.zoom||0) * ease(t||0);
    const ia = img.width/img.height, oa=w/h;
    let bw,bh; if(ia>oa){ bh=img.height; bw=bh*oa; } else { bw=img.width; bh=bw/oa; }
    const sw=bw/z, sh=bh/z;
    const ax=(S.cx==null?.5:S.cx)*img.width, ay=(S.cy==null?.5:S.cy)*img.height;
    return { sx:clamp(ax-sw/2,0,Math.max(0,img.width-sw)), sy:clamp(ay-sh/2,0,Math.max(0,img.height-sh)), sw, sh };
  }
  function mapxy(x,y,r,w,h){ return {x:(x-r.sx)/r.sw*w, y:(y-r.sy)/r.sh*h}; }
  function drawSprite(ctx,s,x,y,scale,boost){
    const img=s.img||s.sp; if(!img) return;
    ctx.drawImage(img, x-s.ax*scale, y-s.ay*scale, s.w*scale, s.h*scale);
  }
  function drawStatic(ctx,w,h,r,boost){
    if(boost){ ctx.save(); ctx.filter='brightness(2.15) contrast(1.2)'; }
    for(const s of S.statics||[]){
      const p=mapxy(s.x,s.y,r,w,h), sc=w/r.sw*(boost?1.2:1);
      if(p.x<-80||p.y<-80||p.x>w+80||p.y>h+80) continue;
      drawSprite(ctx,s,p.x,p.y,sc,boost);
    }
    if(boost) ctx.restore();
  }
  function drawMoving(ctx,w,h,r,t,boost){
    const e=ease(t||0), ax=(S.cx||.5)*S.src.width, ay=(S.cy||.5)*S.src.height;
    if(boost) ctx.save(), ctx.filter='brightness(2.4) contrast(1.25)';
    for(const s of S.movers||[]){
      const mult=s.tier===3?1.25:s.tier===2?1.0:.75;
      const push=1+(S.fly||0)*.28*(s.depth||1)*mult*e;
      const sx=ax+(s.x-ax)*push, sy=ay+(s.y-ay)*push;
      const p=mapxy(sx,sy,r,w,h);
      if(p.x<-100||p.y<-100||p.x>w+100||p.y>h+100) continue;
      const grow=(S.grow||0)*.35*(s.depth||1)*mult*e;
      const sc=w/r.sw*(1+grow)*(boost?1.2:1);
      drawSprite(ctx,s,p.x,p.y,sc,boost);
    }
    if(boost) ctx.restore();
  }

  function engineRender(t){
    if(!ok()) { if(baseRender) baseRender(t||0); return; }
    setUI();
    try { if(typeof size==='function') size(S.src.width,S.src.height); } catch(e) {}
    const c=$('main'); if(!c) return;
    const ctx=c.getContext('2d'), w=c.width, h=c.height, mode=S.preview||'final';
    ctx.clearRect(0,0,w,h);
    ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
    const bg=S.starless||S.src;
    if(mode==='mask' && S.mask){ const r=sourceRect(S.mask.canvas,w,h,0); ctx.drawImage(S.mask.canvas,r.sx,r.sy,r.sw,r.sh,0,0,w,h); return; }
    if(mode==='starless'){ const r=sourceRect(bg,w,h,0); ctx.drawImage(bg,r.sx,r.sy,r.sw,r.sh,0,0,w,h); return; }
    if(mode==='stars'){ const r=sourceRect(S.src,w,h,0); drawStatic(ctx,w,h,r,true); return; }
    if(mode==='moving'){ const r=sourceRect(S.src,w,h,0); drawMoving(ctx,w,h,r,0,true); return; }
    const r=sourceRect(bg,w,h,t||0);
    ctx.drawImage(bg,r.sx,r.sy,r.sw,r.sh,0,0,w,h);
    drawStatic(ctx,w,h,r,false);
    drawMoving(ctx,w,h,r,t||0,false);
    S.last=t||0;
  }

  function install(){
    setUI();
    try { build = engineBuild; render = engineRender; } catch(e) {}
    const btn = $('build');
    if(btn && !btn.dataset.layeredParallaxEngine){
      const clone = btn.cloneNode(true);
      clone.dataset.layeredParallaxEngine = '1';
      btn.parentNode.replaceChild(clone, btn);
      clone.addEventListener('click', e=>{ e.preventDefault(); e.stopImmediatePropagation&&e.stopImmediatePropagation(); engineBuild(); }, true);
    }
    const p = $('preview');
    if(p && !p.dataset.layeredParallaxEngine){
      p.dataset.layeredParallaxEngine='1';
      p.addEventListener('change', ()=>setTimeout(()=>engineRender(S.last||0),0), true);
    }
    const mv = $('move');
    if(mv && !mv.dataset.layeredParallaxEngine){
      mv.dataset.layeredParallaxEngine='1';
      mv.addEventListener('change', ()=>{ if(ok()&&S.stars&&S.stars.length){ repairLayers(); engineRender(S.last||0); } }, true);
    }
    document.addEventListener('click', ()=>setTimeout(setUI,0), true);
  }

  document.addEventListener('DOMContentLoaded', install);
})();
