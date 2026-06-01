(function(){
  const VERSION = 'v0.6.4';
  const $ = id => document.getElementById(id);
  const clamp = (x,a,b) => Math.max(a, Math.min(b, x));
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function hasState(){ try { return typeof S !== 'undefined' && S && S.src; } catch(e) { return false; } }
  function ease(t){ return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }
  function stopPreview(){ try { S.play = 0; cancelAnimationFrame(S.raf); } catch(e) {} const b=$('play'); if(b) b.textContent='▶ Play'; }
  function setStatus(txt){ const s=$('status'); if(s) s.textContent=txt; }
  function setVersion(){ const v=document.querySelector('.ver'); if(v) v.textContent=VERSION; const b=$('badge'); if(b) b.textContent=VERSION+' · safe diagnostics'; }
  function showProgress(title,pct,label){ const o=$('ol'); if(o) o.style.display='grid'; if($('olt')) $('olt').textContent=title; if($('fill')) $('fill').style.width=clamp(pct,0,100)+'%'; if($('oll')) $('oll').textContent=label||''; setStatus(label||title); }
  function hideProgress(){ const o=$('ol'); if(o) o.style.display='none'; }

  function ios(){ const ua=navigator.userAgent||'', ipad=/iPad/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1), iphone=/iPhone|iPod/.test(ua); return (ipad||iphone)&&/WebKit/.test(ua)&&!/CriOS|FxiOS/.test(ua); }
  function rawDims(){ const v=$('preset')&&$('preset').value; return v==='landscape'?{w:1920,h:1080,l:'16x9'}:v==='square'?{w:1080,h:1080,l:'1x1'}:{w:1080,h:1920,l:'9x16'}; }
  function perfDims(d){ if(!ios()) return d; if(d.w===1920) return {w:1280,h:720,l:d.l}; if(d.h===1920) return {w:720,h:1280,l:d.l}; return {w:900,h:900,l:d.l}; }
  function patchDims(){ try { if(typeof dims==='function'&&!window.__dsd_dims_064){ const old=dims; dims=function(){return perfDims(old());}; window.__dsd_dims_064=1; } } catch(e) {} }
  function exportNote(){ const e=$('exinfo'); if(!e) return; const r=rawDims(), d=perfDims(r), note=(r.w!==d.w||r.h!==d.h)?` · performance export ${d.w}×${d.h} on iPad/Safari`:''; e.textContent=`Export target: ${r.w}×${r.h} at 30 fps${note}`; }

  function makeCopyCanvas(src){ const c=document.createElement('canvas'); c.width=src.width; c.height=src.height; c.getContext('2d').drawImage(src,0,0); return c; }

  function blur(src,W,H,r){
    const tmp=new Float32Array(W*H), out=new Float32Array(W*H), ww=2*r+1;
    for(let y=0;y<H;y++){ let s=0; for(let x=-r;x<=r;x++) s+=src[y*W+clamp(x,0,W-1)]; for(let x=0;x<W;x++){ tmp[y*W+x]=s/ww; s+=src[y*W+clamp(x+r+1,0,W-1)]-src[y*W+clamp(x-r,0,W-1)]; } }
    for(let x=0;x<W;x++){ let s=0; for(let y=-r;y<=r;y++) s+=tmp[clamp(y,0,H-1)*W+x]; for(let y=0;y<H;y++){ out[y*W+x]=s/ww; s+=tmp[clamp(y+r+1,0,H-1)*W+x]-tmp[clamp(y-r,0,H-1)*W+x]; } }
    return out;
  }

  function detectCandidates(src){
    const W=Math.max(80, Math.floor(src.width/2)), H=Math.max(80, Math.floor(src.height/2));
    const c=document.createElement('canvas'); c.width=W; c.height=H; c.getContext('2d').drawImage(src,0,0,W,H);
    const p=c.getContext('2d').getImageData(0,0,W,H).data, L=new Float32Array(W*H);
    for(let i=0;i<W*H;i++) L[i]=(0.2126*p[i*4]+0.7152*p[i*4+1]+0.0722*p[i*4+2])/255;
    const bg=blur(L,W,H,16), b1=blur(L,W,H,1), b3=blur(L,W,H,3), R=new Float32Array(W*H);
    let sum=0,sum2=0;
    for(let i=0;i<R.length;i++){ R[i]=Math.max(0,b1[i]-b3[i]); sum+=R[i]; sum2+=R[i]*R[i]; }
    const mean=sum/R.length, rms=Math.sqrt(Math.max(1e-8,sum2/R.length-mean*mean)), strict=clamp(S.strict||0.7,0.3,0.95), th=mean+rms*(0.9+strict*2.1);
    const visit=new Uint8Array(W*H), dirs=[1,-1,W,-W,W+1,W-1,-W+1,-W-1], out=[];
    for(let i=0;i<W*H;i++){
      if(visit[i]||R[i]<th) continue;
      const q=[i], pts=[]; visit[i]=1;
      while(q.length){ const p0=q.pop(); pts.push(p0); const x=p0%W,y=(p0/W)|0; for(const d of dirs){ const n=p0+d,nx=n%W,ny=(n/W)|0; if(n<0||n>=W*H||visit[n]||Math.abs(nx-x)>1||Math.abs(ny-y)>1) continue; if(R[n]>th*0.55){ visit[n]=1; q.push(n); } } }
      const area=pts.length; if(area<1||area>180) continue;
      let sx=0,sy=0,flux=0,peak=0,minx=W,maxx=0,miny=H,maxy=0;
      for(const p0 of pts){ const x=p0%W,y=(p0/W)|0,v=Math.max(0,L[p0]-bg[p0]); sx+=x*v; sy+=y*v; flux+=v; peak=Math.max(peak,v); minx=Math.min(minx,x); maxx=Math.max(maxx,x); miny=Math.min(miny,y); maxy=Math.max(maxy,y); }
      if(flux<=0||peak<th*0.55) continue;
      const bw=maxx-minx+1,bh=maxy-miny+1, aspect=Math.max(bw,bh)/Math.max(1,Math.min(bw,bh)), rad=Math.sqrt(area/Math.PI);
      if(aspect>2.4||rad>7.0) continue;
      out.push({x:(sx/flux)*2,y:(sy/flux)*2,r:Math.max(1.2,rad*2),peak,flux,score:peak*1.8+Math.sqrt(flux)*0.7+rad*0.3});
    }
    out.sort((a,b)=>b.score-a.score);
    return out.slice(0,Math.max(100,Math.min(S.max||2200,out.length)));
  }

  function makeDiagnosticMask(src, stars){
    const W=src.width,H=src.height,a=new Float32Array(W*H);
    for(const s of stars){
      const r=Math.max(2.5, s.r*1.65);
      for(let y=Math.floor(s.y-r);y<=s.y+r;y++) for(let x=Math.floor(s.x-r);x<=s.x+r;x++){
        if(x<0||y<0||x>=W||y>=H) continue;
        const d=Math.hypot(x-s.x,y-s.y); if(d>r) continue;
        let v=1-clamp(d/r,0,1); v=v*v*(3-2*v);
        const k=y*W+x; if(v>a[k]) a[k]=v;
      }
    }
    const c=document.createElement('canvas'); c.width=W; c.height=H; const ctx=c.getContext('2d'), id=ctx.createImageData(W,H), p=id.data;
    for(let i=0;i<a.length;i++){ const v=(a[i]*255)|0,k=i*4; p[k]=p[k+1]=p[k+2]=v; p[k+3]=255; }
    ctx.putImageData(id,0,0);
    return {a,canvas:c};
  }

  function makeTransparentStarsLayer(src, stars){
    const W=src.width,H=src.height, c=document.createElement('canvas'); c.width=W; c.height=H;
    const srcData=src.getContext('2d').getImageData(0,0,W,H).data, ctx=c.getContext('2d'), id=ctx.createImageData(W,H), p=id.data;
    for(const s of stars){
      const r=Math.max(3, s.r*2.2);
      for(let y=Math.floor(s.y-r);y<=s.y+r;y++) for(let x=Math.floor(s.x-r);x<=s.x+r;x++){
        if(x<0||y<0||x>=W||y>=H) continue;
        const d=Math.hypot(x-s.x,y-s.y); if(d>r) continue;
        let a=1-clamp(d/r,0,1); a=a*a*(3-2*a);
        const k=(y*W+x)*4;
        const lum=(0.2126*srcData[k]+0.7152*srcData[k+1]+0.0722*srcData[k+2])/255;
        const alpha=clamp(a*Math.max(0,(lum-0.03))*4.0,0,1);
        if(alpha*255>p[k+3]){ p[k]=srcData[k]; p[k+1]=srcData[k+1]; p[k+2]=srcData[k+2]; p[k+3]=(alpha*255)|0; }
      }
    }
    ctx.putImageData(id,0,0);
    return c;
  }

  function scoreStar(s){ return (s.score||0)+(s.peak||0)*2+(s.r||0)*0.25; }
  function chooseMoving(stars){
    const desired=Math.min(Number(($('move')&&$('move').value)||S.move||260), stars.length), ranked=stars.slice().sort((a,b)=>scoreStar(b)-scoreStar(a));
    const chosen=[], spacing=Math.max(6,Math.min(S.src.width,S.src.height)/85);
    for(const s of ranked){ if(chosen.length>=desired) break; let ok=true; for(const t of chosen){ if(Math.hypot(s.x-t.x,s.y-t.y)<Math.max(spacing,(s.r+t.r)*0.8)){ ok=false; break; } } if(ok) chosen.push(s); }
    for(const s of ranked){ if(chosen.length>=desired) break; if(!chosen.includes(s)) chosen.push(s); }
    return chosen;
  }

  function makeSprite(layer,s){
    const pad=Math.ceil(Math.max(7,s.r*2.8)), x0=clamp(Math.floor(s.x-pad),0,layer.width-1), y0=clamp(Math.floor(s.y-pad),0,layer.height-1), x1=clamp(Math.ceil(s.x+pad),0,layer.width), y1=clamp(Math.ceil(s.y+pad),0,layer.height), w=Math.max(1,x1-x0), h=Math.max(1,y1-y0);
    const c=document.createElement('canvas'); c.width=w; c.height=h; c.getContext('2d').drawImage(layer,x0,y0,w,h,0,0,w,h);
    return {...s,sp:c,ax:s.x-x0,ay:s.y-y0,w,h,depth:clamp(0.75+(s.peak||0)*2+(s.r||0)*0.05,0.75,1.8)};
  }

  async function safeBuild(){
    if(!hasState()) return;
    stopPreview();
    const btn=$('build'); if(btn) btn.disabled=true;
    showProgress('Analyzing stars',5,'Safe diagnostics: destructive starless disabled…'); await sleep(20);
    const stars=detectCandidates(S.src); showProgress('Analyzing stars',45,'Building diagnostic star mask…'); await sleep(20);
    S.stars=stars; S.mask=makeDiagnosticMask(S.src,stars);
    S.starless=makeCopyCanvas(S.src); // v0.6.4 safety rollback: no destructive fill.
    S.starsOnly=makeTransparentStarsLayer(S.src,stars);
    const moving=chooseMoving(stars); S.movers=moving.map(s=>makeSprite(S.starsOnly,s)); S.statics=[]; S.map=1; S.move=S.movers.length;
    showProgress('Analyzing stars',90,'Creating alpha-correct moving sprites…'); await sleep(20);
    if($('mv')) $('mv').textContent=String(S.movers.length);
    if($('stats')){ $('stats').style.display='block'; $('stats').textContent=`${stars.length} star candidates · ${S.movers.length} moving · safe starless disabled`; }
    if(btn){ btn.disabled=false; btn.textContent='Recreate Motion'; }
    if($('play')) $('play').disabled=false; if($('export')) $('export').disabled=false;
    setVersion(); hideProgress(); render(0); setStatus('Safe diagnostic build ready');
  }

  function sourceRect(img,w,h,t){
    const z=1+(S.zoom||0)*ease(t||0), ia=img.width/img.height, oa=w/h; let bw,bh;
    if(ia>oa){ bh=img.height; bw=bh*oa; } else { bw=img.width; bh=bw/oa; }
    const sw=bw/z, sh=bh/z, ax=(S.cx==null?0.5:S.cx)*img.width, ay=(S.cy==null?0.5:S.cy)*img.height;
    return {sx:clamp(ax-sw/2,0,Math.max(0,img.width-sw)), sy:clamp(ay-sh/2,0,Math.max(0,img.height-sh)), sw, sh};
  }
  function mapxy(x,y,r,w,h){ return {x:(x-r.sx)/r.sw*w, y:(y-r.sy)/r.sh*h}; }
  function drawStars(ctx,w,h,r,t){
    const e=ease(t||0), ax=(S.cx||0.5)*S.src.width, ay=(S.cy||0.5)*S.src.height;
    for(const s of S.movers||[]){ if(!s.sp) continue; const push=1+(S.fly||0)*0.24*(s.depth||1)*e, sx=ax+(s.x-ax)*push, sy=ay+(s.y-ay)*push, p=mapxy(sx,sy,r,w,h); if(p.x<-120||p.y<-120||p.x>w+120||p.y>h+120) continue; const sc=w/r.sw*(1+(S.grow||0)*0.35*(s.depth||1)*e); ctx.drawImage(s.sp,p.x-s.ax*sc,p.y-s.ay*sc,s.w*sc,s.h*sc); }
  }
  function tunedDraw(c,t){
    if(!hasState()||!c) return; const ctx=c.getContext('2d'), w=c.width,h=c.height, mode=S.preview||'final'; ctx.clearRect(0,0,w,h);
    let img=mode==='mask'&&S.mask?S.mask.canvas:mode==='stars'&&S.starsOnly?S.starsOnly:mode==='moving'?null:S.starless||S.src;
    if(mode==='moving'){ drawStars(ctx,w,h,sourceRect(S.src,w,h,0),0); return; }
    const r=sourceRect(img,w,h,mode==='final'?t:0); ctx.drawImage(img,r.sx,r.sy,r.sw,r.sh,0,0,w,h); if(mode==='final') drawStars(ctx,w,h,r,t||0);
  }
  function tunedRender(t){ if(!hasState()) return; try{ if(typeof size==='function') size(S.src.width,S.src.height); }catch(e){} tunedDraw($('main'),t||0); S.last=t||0; try{ if(typeof target==='function') target(); }catch(e){} }

  function install(){ try{ build=safeBuild; draw=tunedDraw; render=tunedRender; }catch(e){} patchDims(); exportNote(); setVersion(); }
  function hooks(){
    const btn=$('build'), preset=$('preset'), exp=$('export');
    if(btn&&!btn.dataset.v064){ btn.dataset.v064=1; btn.addEventListener('click',e=>{ e.stopImmediatePropagation&&e.stopImmediatePropagation(); e.preventDefault&&e.preventDefault(); safeBuild(); },true); }
    if(preset&&!preset.dataset.v064){ preset.dataset.v064=1; preset.addEventListener('change',exportNote); }
    if(exp&&!exp.dataset.v064){ exp.dataset.v064=1; exp.addEventListener('click',()=>{ stopPreview(); S.statics=[]; patchDims(); exportNote(); },true); }
  }
  document.addEventListener('DOMContentLoaded',()=>{ install(); hooks(); });
})();
