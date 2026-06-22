(function(){
  const UI_VERSION = 'v0.9.9';
  const playIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/></svg>';
  const pauseIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor" stroke="none"/></svg>';
  const shareIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3"/><path d="M7 8l5-5 5 5"/><path d="M6 12v8h12v-8"/></svg>';

  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }
  function smooth(x){ x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }

  function loadMotionCleanup(){
    try {
      const old = document.getElementById('dsdMotionCleanupScript');
      if (old && old.getAttribute('src') === 'motion-cleanup.js?v=0.9.9') return;
      if (old) old.remove();
      const script = document.createElement('script');
      script.id = 'dsdMotionCleanupScript';
      script.src = 'motion-cleanup.js?v=0.9.9';
      document.head.appendChild(script);
    } catch(e) {}
  }

  function injectProgressStyle(){
    if (document.getElementById('dsdProgressStyle')) return;
    const style = document.createElement('style');
    style.id = 'dsdProgressStyle';
    style.textContent = '.playProgress{position:absolute;left:12px;right:12px;bottom:36px;z-index:7;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:9px;align-items:center;opacity:0;transform:translateY(4px);transition:opacity .18s ease,transform .18s ease;pointer-events:none}.playProgress.active{opacity:1;transform:translateY(0)}.playProgressTrack{height:4px;background:#1b2a3bcc;border-radius:999px;overflow:hidden;box-shadow:0 0 0 1px #0008}.playProgressFill{height:100%;width:0;background:#7cc8ff;border-radius:999px;box-shadow:0 0 10px #7cc8ff88}.playProgressTime{font:9px monospace;color:#b8c7da;text-shadow:0 1px 4px #000;white-space:nowrap;letter-spacing:.05em}@media(max-width:700px) and (orientation:portrait){.playProgress{left:10px;right:10px;bottom:34px}.playProgressTime{font-size:8px}}@media(max-width:950px) and (max-height:520px) and (orientation:landscape){.playProgress{left:10px;right:10px;bottom:28px}.playProgressTrack{height:3px}.playProgressTime{font-size:8px}}';
    document.head.appendChild(style);
  }

  function setIcon(button, icon, label){
    if (!button) return;
    if (button.dataset.icon !== label) {
      button.innerHTML = icon;
      button.dataset.icon = label;
    }
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
  }

  function installStableZoom(){
    try {
      if (window.__DSD_STABLE_ZOOM_INSTALLED__) return;
      const originalSrcRect = srcRect;
      if (typeof originalSrcRect !== 'function') return;
      srcRect = function(img, W, H, t = 0){
        if (!img) return originalSrcRect(img, W, H, t);
        const dur = Math.max(1, (typeof S !== 'undefined' && S.dur) ? S.dur : 10);
        const zoom = (typeof S !== 'undefined' && S.zoom) ? S.zoom : 0;
        const z = 1 + zoom * smooth((t || 0) / dur);
        const ia = img.width / img.height, oa = W / H;
        let bw, bh;
        if (ia > oa) { bh = img.height; bw = bh * oa; } else { bw = img.width; bh = bw / oa; }
        const sw = bw / z, sh = bh / z;
        const fx = (typeof frameX === 'function') ? frameX() : 0.5;
        const fy = (typeof frameY === 'function') ? frameY() : 0.5;
        const cx = fx * img.width, cy = fy * img.height;
        return {
          sx: clamp(cx - sw / 2, 0, Math.max(0, img.width - sw)),
          sy: clamp(cy - sh / 2, 0, Math.max(0, img.height - sh)),
          sw,
          sh
        };
      };
      window.__DSD_STABLE_ZOOM_INSTALLED__ = true;
    } catch(e) {}
  }

  function ensureProgressBar(){
    injectProgressStyle();
    let bar = document.getElementById('playProgress');
    if (bar) return bar;
    const main = document.querySelector('main');
    if (!main) return null;
    bar = document.createElement('div');
    bar.id = 'playProgress';
    bar.className = 'playProgress';
    bar.innerHTML = '<div class="playProgressTrack"><div id="playProgressFill" class="playProgressFill"></div></div><div id="playProgressTime" class="playProgressTime">0:00 / 0:00</div>';
    main.appendChild(bar);
    return bar;
  }

  function fmt(seconds){
    seconds = Math.max(0, Math.floor(seconds || 0));
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m + ':' + String(s).padStart(2, '0');
  }

  function updateProgressBar(){
    const bar = ensureProgressBar();
    if (!bar) return;
    let playing = false, elapsed = 0, dur = 0, hasImage = false;
    try {
      hasImage = !!(typeof S !== 'undefined' && S.src);
      playing = !!(typeof S !== 'undefined' && S.play);
      dur = Math.max(0, Number(S.dur || 0));
      elapsed = Math.max(0, Number(S.last || 0));
    } catch(e) {}
    if (!hasImage || !dur) {
      bar.classList.remove('active');
      const fill0 = document.getElementById('playProgressFill');
      const time0 = document.getElementById('playProgressTime');
      if (fill0) fill0.style.width = '0%';
      if (time0) time0.textContent = '0:00 / 0:00';
      return;
    }
    const loopElapsed = playing ? (elapsed % dur) : Math.min(elapsed, dur);
    const pct = dur ? clamp(loopElapsed / dur, 0, 1) * 100 : 0;
    const fill = document.getElementById('playProgressFill');
    const time = document.getElementById('playProgressTime');
    if (fill) fill.style.width = pct.toFixed(2) + '%';
    if (time) time.textContent = fmt(loopElapsed) + ' / ' + fmt(dur);
    bar.classList.toggle('active', playing || loopElapsed > 0);
  }

  function stopPlaybackForSettingChange(){
    try {
      if (!S || !S.play) return;
      S.play = 0;
      if (S.raf) cancelAnimationFrame(S.raf);
      S.raf = 0;
      S.start = 0;
      const play = document.getElementById('play');
      if (play) play.textContent = '▶ Play';
      const dur = Math.max(0, Number(S.dur || 0));
      if (dur && S.last > dur) S.last = dur;
      setTimeout(function(){
        try { if (typeof render088 === 'function') render088(S.last || 0); } catch(e) {}
        try { updateProgressBar(); } catch(e) {}
      }, 0);
    } catch(e) {}
  }

  function isSettingsTarget(el){
    if (!el || !el.closest) return false;
    return !!el.closest('#dur,#travel,#starBright,#fly,#accel,#grow,#zoom,#strict,#max,#move,#rad,#bias,#preset,#preview,#centerToggle,[data-preset-key],[data-intensity],[data-view-mode]');
  }

  function installAutoPause(){
    if (window.__DSD_AUTOPAUSE_099__) return;
    const handler = function(ev){
      if (isSettingsTarget(ev.target)) stopPlaybackForSettingChange();
    };
    document.addEventListener('input', handler, true);
    document.addEventListener('change', handler, true);
    document.addEventListener('click', handler, true);
    window.__DSD_AUTOPAUSE_099__ = true;
  }

  function syncHeaderIcons(){
    installStableZoom();
    installAutoPause();
    loadMotionCleanup();
    const version = document.getElementById('appVersion');
    if (version) version.textContent = UI_VERSION;
    const play = document.getElementById('play');
    const exportBtn = document.getElementById('export');
    const mobilePlay = document.getElementById('mobilePlay');
    const mobileExport = document.getElementById('mobileExport');
    const isPausedState = play && /pause/i.test(play.textContent || '');
    if (mobilePlay) {
      mobilePlay.disabled = play ? play.disabled : mobilePlay.disabled;
      setIcon(mobilePlay, isPausedState ? pauseIcon : playIcon, isPausedState ? 'Pause animation' : 'Play animation');
    }
    if (mobileExport) {
      mobileExport.disabled = exportBtn ? exportBtn.disabled : mobileExport.disabled;
      setIcon(mobileExport, shareIcon, 'Export or share movie');
    }
    updateProgressBar();
  }

  try { window.syncMobileActions = syncHeaderIcons; } catch(e) {}
  document.addEventListener('DOMContentLoaded', syncHeaderIcons);
  window.addEventListener('load', syncHeaderIcons);
  setInterval(syncHeaderIcons, 120);
})();
