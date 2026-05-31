(function(){
  const HARD_MOVE_CAP = 160;
  const $ = (id) => document.getElementById(id);

  function isIOSLikeSafari(){
    const ua = navigator.userAgent || '';
    const iPad = /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const iPhone = /iPhone|iPod/.test(ua);
    return (iPad || iPhone) && /WebKit/.test(ua) && !/CriOS|FxiOS/.test(ua);
  }

  function getRawDims(){
    const preset = $('preset') && $('preset').value;
    if (preset === 'portrait') return { w: 1080, h: 1920, l: '9x16' };
    if (preset === 'landscape') return { w: 1920, h: 1080, l: '16x9' };
    return { w: 1080, h: 1080, l: '1x1' };
  }

  function getPerformanceDims(d){
    if (!isIOSLikeSafari()) return d;
    if (d.w === 1920 && d.h === 1080) return { w: 1280, h: 720, l: d.l };
    if (d.w === 1080 && d.h === 1920) return { w: 720, h: 1280, l: d.l };
    return { w: 900, h: 900, l: d.l };
  }

  function updateExportNote(){
    const exinfo = $('exinfo');
    if (!exinfo) return;
    const raw = getRawDims();
    const perf = getPerformanceDims(raw);
    const note = raw.w !== perf.w || raw.h !== perf.h
      ? ` · performance export ${perf.w}×${perf.h} on iPad/Safari`
      : '';
    exinfo.textContent = `Export target: ${raw.w}×${raw.h} at 30 fps${note}`;
  }

  function patchDims(){
    if (typeof window.dims !== 'function' || window.__deepSkyDriftDimsTuned) return;
    window.__deepSkyDriftDimsTuned = true;
    const originalDims = window.dims;
    window.dims = function(){
      return getPerformanceDims(originalDims());
    };
  }

  function applyDefaults(){
    const move = $('move');
    const mv = $('mv');
    if (move && Number(move.value) > HARD_MOVE_CAP) {
      move.value = String(HARD_MOVE_CAP);
      if (window.S) S.move = HARD_MOVE_CAP;
      if (mv) mv.textContent = String(HARD_MOVE_CAP);
    }
    const rad = $('rad');
    const rv = $('rv');
    if (rad && Number(rad.value) < 280) {
      rad.value = '280';
      if (window.S) S.rad = 2.8;
      if (rv) rv.textContent = '2.8×';
    }
  }

  function starScore(s){
    return (s.score || 0) + (s.peak || 0) * 2 + (s.iso || 0) * 0.1 + (s.r || 0) * 0.1;
  }

  function optimizeMotionLayer(){
    if (!window.S) return false;
    const pool = Array.isArray(S.stars) ? S.stars.slice() : [];
    if (!pool.length) return false;

    let desired = Number(($('move') && $('move').value) || S.move || 140);
    desired = Math.min(desired, HARD_MOVE_CAP, pool.length);

    const source = Array.isArray(S.movers) && S.movers.length ? S.movers.slice() : pool;
    const ranked = source.sort((a,b) => starScore(b) - starScore(a));

    S.movers = ranked.slice(0, desired);
    S.statics = [];
    S.move = desired;

    const move = $('move');
    const mv = $('mv');
    const stats = $('stats');
    if (move) move.value = String(desired);
    if (mv) mv.textContent = String(desired);
    if (stats) {
      stats.style.display = 'block';
      stats.textContent = `${pool.length} stars detected · ${S.movers.length} animated · 0 static`;
    }
    if ($('badge')) $('badge').textContent = 'motion layer optimized';
    if (typeof window.render === 'function') window.render(0);
    return true;
  }

  async function waitForExtraction(timeoutMs){
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (window.S && S.starless && S.starsOnly && Array.isArray(S.stars) && S.stars.length) return true;
      await new Promise(r => setTimeout(r, 120));
    }
    return false;
  }

  function hookBuild(){
    const btn = $('build');
    if (!btn || btn.dataset.motionTuned) return;
    btn.dataset.motionTuned = '1';
    btn.addEventListener('click', function(){
      setTimeout(async function(){
        if (await waitForExtraction(20000)) optimizeMotionLayer();
      }, 80);
    });
  }

  function hookPlayAndExport(){
    const play = $('play');
    const exportBtn = $('export');
    if (play && !play.dataset.motionTuned) {
      play.dataset.motionTuned = '1';
      play.addEventListener('click', function(){
        if (window.S) S.statics = [];
      }, true);
    }
    if (exportBtn && !exportBtn.dataset.motionTuned) {
      exportBtn.dataset.motionTuned = '1';
      exportBtn.addEventListener('click', function(){
        if (window.S) S.statics = [];
        patchDims();
        updateExportNote();
      }, true);
    }
  }

  document.addEventListener('DOMContentLoaded', function(){
    applyDefaults();
    patchDims();
    updateExportNote();
    hookBuild();
    hookPlayAndExport();
    document.addEventListener('change', function(e){
      if (e.target && e.target.id === 'preset') updateExportNote();
    });
  });
})();
