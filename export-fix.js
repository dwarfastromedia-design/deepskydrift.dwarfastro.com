(function(){
  const EXPORT_VERSION = 'v0.9.12';
  const MIN_VALID_BYTES = 1024;

  function byId(id){ return document.getElementById(id); }
  function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
  function appVersion(){
    try { return (byId('appVersion')?.textContent || EXPORT_VERSION).trim() || EXPORT_VERSION; } catch(e) { return EXPORT_VERSION; }
  }
  function setStatus(text){ try { if (typeof st === 'function') st(text); } catch(e) {} }
  function progress(title, pct, text){ try { if (typeof prog === 'function') prog(title, pct, text); } catch(e) { setStatus(text || title); } }
  function hideProgress(){ try { if (typeof hide === 'function') hide(); } catch(e) {} }
  function analytics(name, params){ try { if (typeof ga === 'function') ga(name, params || {}); } catch(e) {} }
  function currentDims(){ try { return typeof dims === 'function' ? dims() : { w:1080, h:1920, l:'9x16' }; } catch(e) { return { w:1080, h:1920, l:'9x16' }; } }
  function readState(){ try { if (typeof read === 'function') read(); } catch(e) {} }
  function clearAnchorState(){ try { if (typeof clearAnchor === 'function') clearAnchor(); } catch(e) {} }
  function installRender(){ try { if (typeof installRenderOverride === 'function') installRenderOverride(); } catch(e) {} }
  function drawFrame(canvas, seconds){ try { if (typeof drawFrame088 === 'function') drawFrame088(canvas, seconds); } catch(e) {} }
  function showDone(name){ try { if (typeof showSuccess === 'function') showSuccess(name); } catch(e) {} }
  function renderPreview(){ try { if (typeof render088 === 'function') render088(S.last || 0); } catch(e) {} }

  function setDisabled(disabled){
    ['export','play','mobilePlay','mobileExport'].forEach(id => { const el = byId(id); if (el) el.disabled = !!disabled; });
  }

  function supportedTypes(){
    const webm = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    const mp4 = ['video/mp4;codecs=avc1.42E01E', 'video/mp4'];
    const isWindows = /Windows/i.test(navigator.userAgent || '');
    const ordered = isWindows ? webm.concat(mp4) : mp4.concat(webm);
    return ordered.filter(t => {
      try { return window.MediaRecorder && MediaRecorder.isTypeSupported(t); } catch(e) { return false; }
    });
  }

  async function recordAttempt(canvas, mimeType, duration, label){
    const fps = (typeof FPS === 'number' && FPS > 0) ? FPS : 30;
    const stream = canvas.captureStream(fps);
    const track = stream.getVideoTracks()[0];
    const chunks = [];
    let recorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 18000000 });
    } catch(e) {
      try { stream.getTracks().forEach(t => t.stop()); } catch(_) {}
      throw e;
    }
    recorder.ondataavailable = ev => { if (ev.data && ev.data.size > 0) chunks.push(ev.data); };
    const stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = ev => reject(ev.error || new Error('MediaRecorder error'));
    });

    const frames = Math.max(1, Math.round(duration * fps));
    const frameMs = 1000 / fps;
    recorder.start(1000);
    await sleep(80);
    const start = performance.now();

    for (let f = 0; f < frames; f++) {
      const target = start + f * frameMs;
      const now = performance.now();
      if (target > now) await sleep(target - now);
      const seconds = f / fps;
      drawFrame(canvas, seconds);
      if (track && typeof track.requestFrame === 'function') {
        try { track.requestFrame(); } catch(e) {}
      }
      if (f % 15 === 0 || f === frames - 1) {
        const pct = Math.round((f + 1) / frames * 100);
        progress('Exporting movie', pct, `${pct}% · ${label}`);
      }
    }

    await sleep(250);
    try { if (recorder.state === 'recording') recorder.requestData(); } catch(e) {}
    await sleep(120);
    try { if (recorder.state !== 'inactive') recorder.stop(); } catch(e) {}
    await stopped.catch(() => {});
    try { stream.getTracks().forEach(t => t.stop()); } catch(e) {}

    const blob = new Blob(chunks, { type: mimeType });
    return blob;
  }

  async function fixedExport(){
    try {
      if (!S || !S.map || !window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return;
      installRender();
      clearAnchorState();
      readState();
      if (S.play && typeof play === 'function') play();

      const types = supportedTypes();
      if (!types.length) { setStatus('No supported recording format found.'); return; }

      const d = currentDims();
      const duration = Math.max(1, Number(S.dur || 10));
      analytics('export_started', { duration, aspect: d.l, preset: S.lastPreset || '', view_mode: S.viewMode, exporter: EXPORT_VERSION });

      const canvas = document.createElement('canvas');
      canvas.width = d.w;
      canvas.height = d.h;
      canvas.style.cssText = `position:fixed;left:-99999px;top:0;width:${d.w}px;height:${d.h}px;opacity:0;pointer-events:none;background:#000;z-index:-1`;
      document.body.appendChild(canvas);

      const oldPreview = S.preview;
      S.preview = 'final';
      setDisabled(true);
      drawFrame(canvas, 0);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

      let blob = null;
      let usedType = '';
      let lastError = null;
      for (const type of types) {
        try {
          const ext = type.includes('mp4') ? 'mp4' : 'webm';
          progress('Exporting movie', 0, `${d.w}×${d.h} · ${duration}s · ${ext}`);
          const candidate = await recordAttempt(canvas, type, duration, ext.toUpperCase());
          if (candidate && candidate.size >= MIN_VALID_BYTES) {
            blob = candidate;
            usedType = type;
            break;
          }
          lastError = new Error(`Empty export with ${type}`);
          analytics('export_empty_blob', { mime_type: type, bytes: candidate ? candidate.size : 0 });
        } catch(e) {
          lastError = e;
          analytics('export_attempt_failed', { mime_type: type, message: String(e && e.message || e) });
        }
      }

      S.preview = oldPreview;
      try { document.body.removeChild(canvas); } catch(e) {}
      setDisabled(false);
      renderPreview();

      if (!blob || blob.size < MIN_VALID_BYTES) {
        hideProgress();
        setStatus('Export failed: browser produced an empty video file. Try Edge/Chrome WebM export or a shorter duration.');
        analytics('export_failed_empty', { message: String(lastError && lastError.message || lastError || 'empty blob') });
        return;
      }

      const ext = usedType.includes('mp4') ? 'mp4' : 'webm';
      const name = `deepsky-drift-${appVersion()}-${d.l}-${duration}s.${ext}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      S.lastExportBlob = blob;
      S.lastExportName = name;
      hideProgress();
      showDone(name);
      setStatus(`Download ready · ${appVersion()} · ${(blob.size / 1048576).toFixed(1)} MB`);
      setTimeout(() => { try { a.click(); } catch(e) {} }, 180);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      analytics('export_completed', { duration, aspect: d.l, bytes: blob.size, view_mode: S.viewMode, mime_type: usedType, exporter: EXPORT_VERSION });
    } catch(e) {
      setDisabled(false);
      hideProgress();
      setStatus('Export failed: ' + String(e && e.message || e));
      analytics('export_failed_exception', { message: String(e && e.message || e), exporter: EXPORT_VERSION });
    }
  }

  function install(){
    try {
      if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return;
      exp = fixedExport;
      window.exp = fixedExport;
      window.__DSD_EXPORT_FIX_VERSION__ = EXPORT_VERSION;
      const v = byId('appVersion');
      if (v) v.textContent = EXPORT_VERSION;
    } catch(e) {}
  }

  install();
  setInterval(install, 500);
})();
