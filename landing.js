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
    landing.innerHTML = '<div class="landing-hero"><p class="eyebrow">DwarfAstro AI-free web tool</p><h1>Turn your deep-sky image into a subtle motion video.</h1><p class="lead">DeepSkyDrift creates cinematic motion clips from finished astrophotography images. Load an image, let the app extract stars, choose a preset, tune the frame, and export a short local browser-rendered clip.</p><div class="landing-actions"><button class="primary landing-launch" type="button">Launch DeepSkyDrift</button><a class="landing-link" href="#how-it-works">How it works</a></div><p class="privacy-note">Your image stays on your device. DeepSkyDrift runs locally in your browser and uses no generative AI.</p></div><div class="landing-grid"><article><h2>Create social-ready motion</h2><p>Export portrait, landscape, or square clips from a still astrophotography image.</p></article><article><h2>Built from your image data</h2><p>The app detects stars, builds a motion background, extracts star sprites, and animates selected stars with a cinematic drift effect.</p></article><article><h2>Private by design</h2><p>Images are processed locally. Analytics only load if accepted.</p></article></div><section id="how-it-works" class="landing-section"><p class="eyebrow">How it works</p><h2>Create a motion video in five steps</h2><ol class="steps"><li><strong>Load your image.</strong> Choose a finished JPG, PNG, or WebP astrophotography image.</li><li><strong>Extract stars.</strong> The app detects stars and creates a motion layer.</li><li><strong>Choose a preset.</strong> Pick Cinematic, Meditation, or Social.</li><li><strong>Frame the output.</strong> Use Original view or 9:16 Reel view for vertical social clips.</li><li><strong>Export your video.</strong> Create a local browser-rendered motion clip.</li></ol></section><section class="landing-section faq"><p class="eyebrow">FAQ</p><h2>Frequently asked questions</h2><details><summary>Does DeepSkyDrift upload my image?</summary><p>No. Processing happens locally in your browser.</p></details><details><summary>Does DeepSkyDrift use AI?</summary><p>No. It is an AI-free app. It uses image data and classical browser-side processing.</p></details><details><summary>Is DeepSkyDrift real 3D motion?</summary><p>No. It creates a 2D cinematic motion effect from a still image.</p></details><details><summary>Is DeepSkyDrift free?</summary><p>Yes. DeepSkyDrift is free to use.</p></details></section><section class="landing-final"><h2>Create a DeepSkyDrift video now</h2><p>Load a finished astrophotography image, choose a motion preset, frame the result, and export a short motion video.</p><button class="primary landing-launch" type="button">Launch DeepSkyDrift</button></section>';
    app.parentNode.insertBefore(landing, app);
    landing.querySelectorAll('.landing-launch').forEach(function(btn){ btn.addEventListener('click', launch); });
  }

  window.launchDeepSkyDrift = launch;
  document.addEventListener('DOMContentLoaded', buildLanding);
})();
