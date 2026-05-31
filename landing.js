(function(){
  function h(tag, attrs, html){
    const el=document.createElement(tag);
    if(attrs) Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
    if(html!==undefined) el.innerHTML=html;
    return el;
  }
  function launch(){
    const landing=document.getElementById('landing');
    const app=document.getElementById('app');
    if(landing) landing.classList.add('landing-hidden');
    if(app) app.classList.remove('app-hidden');
    document.body.classList.remove('landing-mode');
    document.body.classList.add('app-mode');
    window.scrollTo(0,0);
  }
  window.launchDeepSkyDrift=launch;
  document.addEventListener('DOMContentLoaded',function(){
    const app=document.getElementById('app');
    if(!app) return;
    app.classList.add('app-hidden');
    document.body.classList.add('landing-mode');
    const landing=h('section',{id:'landing',class:'landing'},`
      <div class="landing-hero">
        <p class="eyebrow">DwarfAstro free web tool</p>
        <h1>Turn your deep-sky image into a subtle motion video.</h1>
        <p class="lead">DeepSkyDrift helps you create cinematic motion clips from finished astrophotography images. Load an image, choose a motion style, tap the galaxy or nebula, and export a short video for Reels, Shorts, Facebook, or your website.</p>
        <div class="landing-actions"><button class="primary landing-launch" type="button">Launch DeepSkyDrift</button><a class="landing-link" href="#how-it-works">How it works</a></div>
        <p class="privacy-note">Your image stays on your device. DeepSkyDrift runs locally in your browser and does not upload your image to a server.</p>
      </div>
      <div class="landing-grid">
        <article><h2>Create social-ready motion</h2><p>Use Gentle, Cinematic, or Deep Fly-In styles to make a still astrophotography image feel more alive without creating a fake warp-speed effect.</p></article>
        <article><h2>Built for deep-sky images</h2><p>Use finished JPG, PNG, or WebP images of galaxies, nebulae, star fields, and wide deep-sky scenes.</p></article>
        <article><h2>Private by design</h2><p>DeepSkyDrift processes your image locally. Analytics only load if you accept the optional Google Analytics prompt.</p></article>
      </div>
      <section id="how-it-works" class="landing-section"><p class="eyebrow">How it works</p><h2>Create a motion video in five steps</h2><ol class="steps"><li><strong>Load your image.</strong> Choose a finished JPG, PNG, or WebP astrophotography image.</li><li><strong>Create motion.</strong> DeepSkyDrift analyzes the star field and creates a stars-only motion layer.</li><li><strong>Choose a style.</strong> Pick Gentle, Cinematic, or Deep Fly-In.</li><li><strong>Set the zoom center.</strong> Tap or click the galaxy, nebula, or subject you want the motion to move toward.</li><li><strong>Export your video.</strong> Choose Portrait, Wide, or Square format and export the finished video.</li></ol></section>
      <section class="landing-section"><p class="eyebrow">Why it exists</p><h2>Astrophotography images deserve more than a quick scroll.</h2><p>Deep-sky images often represent hours of captured light. DeepSkyDrift turns a finished image into a tasteful short motion clip so viewers are more likely to stop, watch, and appreciate the target.</p></section>
      <section class="landing-section faq"><p class="eyebrow">FAQ</p><h2>Frequently asked questions</h2><details><summary>Does DeepSkyDrift upload my image?</summary><p>No. DeepSkyDrift processes your image locally in your browser. Your image is not uploaded to DwarfAstro or any server.</p></details><details><summary>What image formats work with DeepSkyDrift?</summary><p>DeepSkyDrift is intended for finished JPG, PNG, or WebP astrophotography images.</p></details><details><summary>Can I use DWARF 3 images with DeepSkyDrift?</summary><p>Yes. DeepSkyDrift works with finished DWARF 3 images as well as images from other smart telescopes or traditional astrophotography workflows.</p></details><details><summary>Is DeepSkyDrift real 3D motion?</summary><p>No. DeepSkyDrift creates a 2D motion effect from a still image. It is designed to make a finished astrophotography image feel more cinematic for sharing.</p></details><details><summary>Why is my iPad export not full HD?</summary><p>Some iPad and Safari combinations downscale canvas video recording even when a higher export size is requested. Desktop Chrome or Edge is recommended when full-resolution export is important.</p></details><details><summary>Is DeepSkyDrift free?</summary><p>Yes. DeepSkyDrift is free to use.</p></details></section>
      <section class="landing-final"><h2>Create a DeepSkyDrift video now</h2><p>Load a finished astrophotography image, choose a style, tap the subject, and export a short motion video.</p><button class="primary landing-launch" type="button">Launch DeepSkyDrift</button></section>
    `);
    app.parentNode.insertBefore(landing,app);
    landing.querySelectorAll('.landing-launch').forEach(btn=>btn.addEventListener('click',launch));
  });
})();
