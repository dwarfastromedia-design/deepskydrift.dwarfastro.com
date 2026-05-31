(function(){
  function addMotionTune(){
    if (document.getElementById('motionTuneScript')) return;
    var s = document.createElement('script');
    s.id = 'motionTuneScript';
    s.src = 'motion-tune.js?v=0.6.1';
    document.body.appendChild(s);
  }
  function launch(){
    var landing = document.getElementById('landing');
    var app = document.getElementById('app');
    if (landing) landing.classList.add('landing-hidden');
    if (app) app.classList.remove('app-hidden');
    document.body.classList.remove('landing-mode');
    document.body.classList.add('app-mode');
    window.scrollTo(0,0);
  }
  function buildLanding(){
    var app = document.getElementById('app');
    if (!app) return;
    app.classList.add('app-hidden');
    document.body.classList.add('landing-mode');
    var landing = document.createElement('section');
    landing.id = 'landing';
    landing.className = 'landing';
    landing.innerHTML = '<div class="landing-hero"><p class="eyebrow">DwarfAstro free web tool</p><h1>Turn your deep-sky image into a subtle motion video.</h1><p class="lead">DeepSkyDrift helps you create cinematic motion clips from finished astrophotography images. Load an image, choose a motion style, tap the galaxy or nebula, and export a short video.</p><div class="landing-actions"><button class="primary landing-launch" type="button">Launch DeepSkyDrift</button><a class="landing-link" href="#how-it-works">How it works</a></div><p class="privacy-note">Your image stays on your device. DeepSkyDrift runs locally in your browser.</p></div><div class="landing-grid"><article><h2>Create social-ready motion</h2><p>Use Gentle, Cinematic, or Deep Fly-In styles to make a still image feel more alive.</p></article><article><h2>Built for deep-sky images</h2><p>Use finished JPG, PNG, or WebP images of galaxies, nebulae, star fields, and wide scenes.</p></article><article><h2>Private by design</h2><p>Images are processed locally. Analytics only load if accepted.</p></article></div><section id="how-it-works" class="landing-section"><p class="eyebrow">How it works</p><h2>Create a motion video in five steps</h2><ol class="steps"><li><strong>Load your image.</strong> Choose a finished astrophotography image.</li><li><strong>Create motion.</strong> The app creates a stars-only motion layer.</li><li><strong>Choose a style.</strong> Pick Gentle, Cinematic, or Deep Fly-In.</li><li><strong>Set the zoom center.</strong> Tap the target.</li><li><strong>Export your video.</strong> Choose portrait, wide, or square.</li></ol></section><section class="landing-section faq"><p class="eyebrow">FAQ</p><h2>Frequently asked questions</h2><details><summary>Does DeepSkyDrift upload my image?</summary><p>No. Processing happens locally in your browser.</p></details><details><summary>Is DeepSkyDrift real 3D motion?</summary><p>No. It creates a 2D cinematic motion effect from a still image.</p></details><details><summary>Is DeepSkyDrift free?</summary><p>Yes. DeepSkyDrift is free to use.</p></details></section><section class="landing-final"><h2>Create a DeepSkyDrift video now</h2><p>Load a finished astrophotography image, choose a style, tap the subject, and export a short motion video.</p><button class="primary landing-launch" type="button">Launch DeepSkyDrift</button></section>';
    app.parentNode.insertBefore(landing, app);
    landing.querySelectorAll('.landing-launch').forEach(function(btn){ btn.addEventListener('click', launch); });
  }
  window.launchDeepSkyDrift = launch;
  document.addEventListener('DOMContentLoaded', function(){ addMotionTune(); buildLanding(); });
})();
