(function(){
  const VERSION='v0.7.1';
  const $=id=>document.getElementById(id);
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  function ok(){try{return typeof S!=='undefined'&&S&&S.src}catch(e){return false}}
  function setUI(){
    const v=document.querySelector('.ver'); if(v)v.textContent=VERSION;
    const b=$('badge'); if(b)b.textContent=VERSION+' · moving layer fix';
    const w=document.querySelector('.warn'); if(w)w.textContent='v0.7.1 · Moving layer visibility fix.';
  }
  function density(stars,r){const r2=r*r,m=new Map();for(let i=0;i<stars.length;i++){let n=0,a=stars[i];for(let j=0;j<stars.length;j++){if(i===j)continue;let b=stars[j],dx=a.x-b.x,dy=a.y-b.y;if(dx*dx+dy*dy<r2)n++}m.set(a,n)}return m}
  function score(s){return (s.score||0)+(s.peak||0)*3+(s.iso||0)*.3+(s.r||0)*.25-(s.structure||0)*2}
  function chooseStars(){
    const stars=(S.stars||[]).slice();
    const want=Math.min(Number(($('move')&&$('move').value)||S.move||260),stars.length);
    const d=density(stars,34);
    const ranked=stars.sort((a,b)=>score(b)-score(a));
    const chosen=[];
    for(const s of ranked){
      if(chosen.length>=want)break;
      if((s.structure||0)>.18)continue;
      if((d.get(s)||0)>22)continue;
      if((s.iso||0)<1.02)continue;
      chosen.push(s);
    }
    for(const s of ranked){if(chosen.length>=want)break;if(!chosen.includes(s))chosen.push(s)}
    return chosen;
  }
  function makeMovingLayer(src,stars){
    const W=src.width,H=src.height,c=document.createElement('canvas');c.width=W;c.height=H;
    const sd=src.getContext('2d').getImageData(0,0,W,H).data,ctx=c.getContext('2d'),id=ctx.createImageData(W,H),p=id.data;
    for(const s of stars){
      const r=Math.max(4,s.r*(s.scale==='large'?3.1:s.scale==='medium'?2.65:2.25));
      for(let y=Math.floor(s.y-r);y<=s.y+r;y++)for(let x=Math.floor(s.x-r);x<=s.x+r;x++){
        if(x<0||y<0||x>=W||y>=H)continue;
        const dist=Math.hypot(x-s.x,y-s.y); if(dist>r)continue;
        let fall=1-clamp(dist/r,0,1); fall=fall*fall*(3-2*fall);
        const k=(y*W+x)*4,lum=(.2126*sd[k]+.7152*sd[k+1]+.0722*sd[k+2])/255;
        const alpha=clamp(fall*Math.max(0,lum-.012)*7.0,0,1);
        if(alpha*255>p[k+3]){
          p[k]=Math.min(255,sd[k]*1.35+8);
          p[k+1]=Math.min(255,sd[k+1]*1.35+8);
          p[k+2]=Math.min(255,sd[k+2]*1.35+8);
          p[k+3]=alpha*255|0;
        }
      }
    }
    ctx.putImageData(id,0,0); return c;
  }
  function tier(s){let sc=(s.peak||0)*1.8+(s.r||0)*.45+(s.iso||0)*.12;if(sc>2.45||s.scale==='large')return 3;if(sc>1.55||s.scale==='medium')return 2;return 1}
  function makeSprites(layer,stars){return stars.map(s=>{const pad=Math.ceil(Math.max(8,s.r*3.2)),x0=clamp(Math.floor(s.x-pad),0,layer.width-1),y0=clamp(Math.floor(s.y-pad),0,layer.height-1),x1=clamp(Math.ceil(s.x+pad),0,layer.width),y1=clamp(Math.ceil(s.y+pad),0,layer.height),w=Math.max(1,x1-x0),h=Math.max(1,y1-y0),c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(layer,x0,y0,w,h,0,0,w,h);const ti=tier(s),depth=ti===3?1.65:ti===2?1.15:.82;return{...s,sp:c,ax:s.x-x0,ay:s.y-y0,w,h,tier:ti,depth}})}
  function repairMovingLayer(){
    if(!ok()||!S.stars||!S.stars.length)return;
    let moving=(S.movingCatalog&&S.movingCatalog.length)?S.movingCatalog.slice():chooseStars();
    const want=Math.min(Number(($('move')&&$('move').value)||S.move||260),S.stars.length);
    if(moving.length<Math.min(20,want)) moving=chooseStars();
    S.movingCatalog=moving;
    S.movingLayer=makeMovingLayer(S.src,moving);
    S.movers=makeSprites(S.movingLayer,moving);
    S.move=S.movers.length;
    if($('mv'))$('mv').textContent=String(S.move);
    if($('stats')){$('stats').style.display='block';$('stats').textContent=`${(S.stars||[]).length} candidates · ${(S.backgroundLayer&&S.backgroundLayer.dataset.removedStars)||'0'} moving stars removed from background · ${S.move} moving`;}
  }
  function srcRect(img,w,h){const ia=img.width/img.height,oa=w/h;let sw,sh;if(ia>oa){sh=img.height;sw=sh*oa}else{sw=img.width;sh=sw/oa}return{sx:Math.max(0,(img.width-sw)/2),sy:Math.max(0,(img.height-sh)/2),sw,sh}}
  function drawMovingPreview(){
    const c=$('main'); if(!ok()||!c||!S.movingLayer)return false;
    try{if(typeof size==='function')size(S.src.width,S.src.height)}catch(e){}
    const ctx=c.getContext('2d'),w=c.width,h=c.height,r=srcRect(S.movingLayer,w,h);
    ctx.clearRect(0,0,w,h); ctx.save(); ctx.filter='brightness(2.4) contrast(1.25)'; ctx.drawImage(S.movingLayer,r.sx,r.sy,r.sw,r.sh,0,0,w,h); ctx.restore(); return true;
  }
  const prevBuild=typeof build==='function'?build:null;
  const prevRender=typeof render==='function'?render:null;
  async function build071(){
    if(prevBuild) await prevBuild();
    repairMovingLayer(); setUI();
    if((S.preview||'final')==='moving') drawMovingPreview(); else if(prevRender) prevRender(S.last||0);
  }
  function render071(t){
    if(ok()&&(S.preview||'final')==='moving'){drawMovingPreview(); return;}
    if(prevRender) prevRender(t||0);
  }
  function install(){
    setUI();
    try{build=build071;render=render071}catch(e){}
    const p=$('preview'); if(p&&!p.dataset.v071){p.dataset.v071='1';p.addEventListener('change',()=>setTimeout(()=>render071(S.last||0),0),true)}
    const btn=$('build'); if(btn&&!btn.dataset.v071){const clone=btn.cloneNode(true);clone.dataset.v071='1';btn.parentNode.replaceChild(clone,btn);clone.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation&&e.stopImmediatePropagation();build071()},true)}
  }
  document.addEventListener('DOMContentLoaded',install);
})();