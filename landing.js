(function(){
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
    landing.innerHTML = '<div class="landing-hero"><p class="eyebrow">DwarfAstro free web tool</p><h1>Turn your deep-sky image into a subtle motion video.</h1><p class="lead">DeepSkyDrift creates cinematic motion clips from finished astrophotography images. Load an image, extract stars, build a clean background, and animate the star layer with three-tier parallax.</p><div class="landing-actions"><button class="primary landing-launch" type="button">Launch DeepSkyDrift</button><a class="landing-link" href="#how-it-works">How it works</a></div><p class="privacy-note">Your image stays on your device. DeepSkyDrift runs locally in your browser.</p></div><div class="landing-grid"><article><h2>Create social-ready motion</h2><p>Export portrait, landscape, or square clips from a still astrophotography image.</p></article><article><h2>Built for deep-sky images</h2><p>The v0.8 engine detects stars, builds a soft star mask, removes stars from the background, and animates selected stars in parallax tiers.</p></article><article><h2>Private by design</h2><p>Images are processed locally. Analytics only load if accepted.</p></article></div><section id="how-it-works" class="landing-section"><p class="eyebrow">How it works</p><h2>Create a motion video in five steps</h2><ol class="steps"><li><strong>Load your image.</strong> Choose a finished JPG, PNG, or WebP astrophotography image.</li><li><strong>Extract stars.</strong> The app detects stars and creates a soft star mask.</li><li><strong>Review layers.</strong> Check the clean background, star mask, and moving-star preview.</li><li><strong>Tune motion.</strong> Adjust moving stars, star motion, growth, zoom, and export shape.</li><li><strong>Export your video.</strong> Create a short local browser-rendered motion clip.</li></ol></section><section class="landing-section faq"><p class="eyebrow">FAQ</p><h2>Frequently asked questions</h2><details><summary>Does DeepSkyDrift upload my image?</summary><p>No. Processing happens locally in your browser.</p></details><details><summary>Is DeepSkyDrift real 3D motion?</summary><p>No. It creates a 2D cinematic parallax effect from a still image.</p></details><details><summary>Is DeepSkyDrift free?</summary><p>Yes. DeepSkyDrift is free to use.</p></details></section><section class="landing-final"><h2>Create a DeepSkyDrift video now</h2><p>Load a finished astrophotography image, extract the star layer, tune the parallax motion, and export a short motion video.</p><button class="primary landing-launch" type="button">Launch DeepSkyDrift</button></section>';
    app.parentNode.insertBefore(landing, app);
    landing.querySelectorAll('.landing-launch').forEach(function(btn){ btn.addEventListener('click', launch); });
  }

  window.launchDeepSkyDrift = launch;
  document.addEventListener('DOMContentLoaded', buildLanding);
})();
