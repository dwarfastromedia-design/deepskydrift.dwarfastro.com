(function(){
  const VERSION='v0.6.7';
  const $=id=>document.getElementById(id);
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  function hasState(){try{return typeof S!=='undefined'&&S&&S.src}catch(e){return false}}
  function setVersion(){const v=document.querySelector('.ver');if(v)v.textContent=VERSION;const b=$('badge');if(b)b.textContent=VERSION+' · stronger conservative starless'}
  function status(t){const s=$('status');if(s)s.textContent=t}
  function progress(t,p,l){const o=$('ol');if(o)o.style.display='grid';if($('olt'))$('olt').textContent=t;if($('fill'))$('fill').style.width=clamp(p,0,100)+'%';if($('oll'))$('oll').textContent=l||'';status(l||t)}
  function hide(){const o=$('ol');if(o)o.style.display='none'}
  function stopPreview(){try{S.play=0;cancelAnimationFrame(S.raf)}catch(e){}const b=$('play');if(b)b.textContent='▶ Play'}
  function copyCanvas(src){const c=document.createElement('canvas');c.width=src.width;c.height=src.height;c.getContext('2d').drawImage(src,0,0);return c}
  function neighborCounts(stars){const r=34,r2=r*r,out=new Map();for(let i=0;i<stars.length;i++){let n=0,a=stars[i];for(let j=0;j<stars.length;j++){if(i===j)continue;let b=stars[j],dx=a.x-b.x,dy=a.y-b.y;if(dx*dx+dy*dy<r2)n++}out.set(a,n)}return out}
  function strongerStarless(src,stars){const W=src.width,H=src.height,c=copyCanvas(src),ctx=c.getContext('2d'),id=ctx.getImageData(0,0,W,H),p=id.data,orig=new Uint8ClampedArray(p),density=neighborCounts(stars);let removed=0;
    for(const s of stars){
      const dense=(density.get(s)||0)>13;
      const protectedStructure=(s.structure||0)>0.135;
      const small=s.scale==='small'&&s.r<6.2;
      const medium=s.scale==='medium'&&s.r<5.0&&(s.iso||0)>1.55&&(s.compact||0)>1.05;
      const eligible=(small||medium)&&!dense&&!protectedStructure&&(s.iso||0)>1.22&&(s.compact||0)>0.85;
      if(!eligible)continue;
      const base=small?1.65:1.45;
      const r=Math.max(2.3,Math.min(9.5,s.r*base));
      const rIn=r*1.28,rOut=r*(small?3.15:3.45),samples=[];
      for(let yy=Math.floor(s.y-rOut);yy<=s.y+rOut;yy+=1)for(let xx=Math.floor(s.x-rOut);xx<=s.x+rOut;xx+=1){
        if(xx<0||yy<0||xx>=W||yy>=H)continue;
        const d=Math.hypot(xx-s.x,yy-s.y);if(d<rIn||d>rOut)continue;
        const k=(yy*W+xx)*4,lum=.2126*orig[k]+.7152*orig[k+1]+.0722*orig[k+2];
        samples.push([lum,orig[k],orig[k+1],orig[k+2]]);
      }
      if(samples.length<12)continue;
      samples.sort((a,b)=>a[0]-b[0]);
      const lo=Math.floor(samples.length*.12),hi=Math.ceil(samples.length*.70);let rr=0,gg=0,bb=0,n=0;
      for(let i=lo;i<hi;i++){rr+=samples[i][1];gg+=samples[i][2];bb+=samples[i][3];n++}
      if(!n)continue;rr/=n;gg/=n;bb/=n;
      for(let yy=Math.floor(s.y-r);yy<=s.y+r;yy++)for(let xx=Math.floor(s.x-r);xx<=s.x+r;xx++){
        if(xx<0||yy<0||xx>=W||yy>=H)continue;
        const d=Math.hypot(xx-s.x,yy-s.y);if(d>r)continue;
        let a=1-clamp((d-r*.22)/(r*.78),0,1);a=a*a*(3-2*a)*(small?.80:.58);
        const k=(yy*W+xx)*4;
        p[k]=p[k]*(1-a)+rr*a;p[k+1]=p[k+1]*(1-a)+gg*a;p[k+2]=p[k+2]*(1-a)+bb*a;
      }
      removed++;
    }
    ctx.putImageData(id,0,0);c.dataset.removedStars=String(removed);return c;
  }
  const oldBuild=typeof build==='function'?build:null;
  async function build067(){
    if(!hasState())return;stopPreview();const btn=$('build');if(btn)btn.disabled=true;
    if(oldBuild){await oldBuild();}
    if(!hasState()||!Array.isArray(S.stars)){if(btn)btn.disabled=false;return;}
    progress('Creating starless',82,'v0.6.7: softening more small and medium field stars…');await sleep(20);
    S.starless=strongerStarless(S.src,S.stars);S.statics=[];
    const removed=S.starless.dataset.removedStars||'0';
    if($('stats')){$('stats').style.display='block';$('stats').textContent=`${S.stars.length} candidates · ${removed} small/medium stars softened · ${(S.movers||[]).length} moving`;}
    setVersion();hide();if(btn){btn.disabled=false;btn.textContent='Recreate Motion'}try{render(0)}catch(e){}status('v0.6.7 stronger conservative starless ready');
  }
  function install(){setVersion();try{build=build067}catch(e){}const btn=$('build');if(btn&&!btn.dataset.v067){const clone=btn.cloneNode(true);clone.dataset.v067=1;btn.parentNode.replaceChild(clone,btn);clone.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation&&e.stopImmediatePropagation();build067();},true)}}
  document.addEventListener('DOMContentLoaded',install);
})();
