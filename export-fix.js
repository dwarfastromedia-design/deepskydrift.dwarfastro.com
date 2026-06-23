(function(){
  const EXPORT_VERSION = 'v0.9.13';
  const MIN_VALID_BYTES = 1024;
  let currentUrl = null;

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
  function renderPreview(){ try { if (typeof render088 === 'function') render088(S.last || 0); } catch(e) {} }
  function sizeLabel(bytes){ return bytes ? (bytes / 1048576).toFixed(1) + ' MB' : ''; }

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

  function ensureExportModal(){
    let modal = byId('exportReadyModal');
    if (modal) return modal;
    const style = document.createElement('style');
    style.id = 'exportReadyModalStyle';
    style.textContent = '.exportReadyModal{position:fixed;inset:0;display:none;place-items:center;z-index:99999;background:#000a;backdrop-filter:blur(6px);padding:18px}.exportReadyModal.open{display:grid}.exportReadyCard{width:min(440px,calc(100vw - 32px));border:1px solid #33506d;background:#08101cf7;border-radius:18px;box-shadow:0 24px 80px #000;color:#dce7f7;padding:20px}.exportReadyTop{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.exportReadyTop h2{margin:0;font:700 20px/1.1 system-ui,-apple-system,Segoe UI,sans-serif}.exportReadyClose{border:1px solid #365a78;background:#0b1726;color:#dce7f7;border-radius:10px;width:36px;height:36px;font-size:20px}.exportReadyMeta{margin:0 0 16px;color:#9cafc3;font:13px/1.4 system-ui,-apple-system,Segoe UI,sans-serif}.exportReadyActions{display:grid;gap:10px}.exportReadyActions button{min-height:46px;border-radius:12px;border:1px solid #69b9ff;background:#10385b;color:#eaf4ff;text-transform:uppercase;letter-spacing:.12em;font:800 12px/1 system-ui,-apple-system,Segoe UI,sans-serif}.exportReadyActions button.primary{background:#ff9d2e;border-color:#ffd08a;color:#1d0d00}.exportReadyActions button:disabled{opacity:.45}.exportReadyHint{margin:12px 0 0;color:#7f91a6;font:12px/1.4 system-ui,-apple-system,Segoe UI,sans-serif}';
    document.head.appendChild(style);
    modal = document.createElement('div');
    modal.id = 'exportReadyModal';
    modal.className = 'exportReadyModal';
    modal.setAttribute('aria-hidden','true');
    modal.innerHTML = '<div class="exportReadyCard" role="dialog" aria-modal="true" aria-labelledby="exportReadyTitle"><div class="exportReadyTop"><h2 id="exportReadyTitle">Video ready</h2><button id="exportReadyClose" class="exportReadyClose" type="button" aria-label="Close">×</button></div><p id="exportReadyMeta" class="exportReadyMeta">Your video has been created.</p><div class="exportReadyActions"><button id="exportDownloadBtn" class="primary" type="button">Download video</button><button id="exportShareBtn" type="button">Share video</button></div><p id="exportReadyHint" class="exportReadyHint"></p></div>';
    document.body.appendChild(modal);
    byId('exportReadyClose')?.addEventListener('click', closeExportModal);
    modal.addEventListener('click', ev => { if (ev.target === modal) closeExportModal(); });
    byId('exportDownloadBtn')?.addEventListener('click', downloadLastExport);
    byId('exportShareBtn')?.addEventListener('click', shareLastExport);
    document.addEventListener('keydown', ev => { if (ev.key === 'Escape') closeExportModal(); });
    return modal;
  }

  function closeExportModal(){
    const modal = byId('exportReadyModal');
    if (modal) { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); }
  }

  function openExportModal(){
    const modal = ensureExportModal();
    const blob = S && S.lastExportBlob;
    const name = S && S.lastExportName;
    const meta = byId('exportReadyMeta');
    const share = byId('exportShareBtn');
    const hint = byId('exportReadyHint');
    const canFileShare = canShareVideo();
    if (meta) meta.textContent = `${name || 'deepsky-drift video'} · ${sizeLabel(blob && blob.size)}`;
    if (share) {
      share.style.display = canFileShare ? '' : 'none';
      share.disabled = !canFileShare;
    }
    if (hint) hint.textContent = canFileShare ? 'Use Share for the mobile OS share sheet, or download the video file.' : 'Sharing files is not available in this browser. Download the video file instead.';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    analytics('export_ready_modal_opened', { can_share: canFileShare, bytes: blob ? blob.size : 0 });
  }

  function ensureObjectUrl(){
    if (currentUrl) return currentUrl;
    if (!S || !S.lastExportBlob) return '';
    currentUrl = URL.createObjectURL(S.lastExportBlob);
    return currentUrl;
  }

  function downloadLastExport(){
    if (!S || !S.lastExportBlob) return;
    const url = ensureObjectUrl();
    const a = document.createElement('a');
    a.href = url;
    a.download = S.lastExportName || 'deepsky-drift-video.webm';
    document.body.appendChild(a);
    try { a.click(); } catch(e) {}
    setTimeout(() => { try { a.remove(); } catch(e) {} }, 0);
    analytics('export_download_clicked', { bytes: S.lastExportBlob.size, file_name: S.lastExportName || '' });
  }

  function canShareVideo(){
    try {
      if (!S || !S.lastExportBlob || !navigator.share) return false;
      const file = new File([S.lastExportBlob], S.lastExportName || 'deepsky-drift-video.webm', { type: S.lastExportBlob.type || 'video/webm' });
      return !navigator.canShare || navigator.canShare({ files:[file] });
    } catch(e) { return false; }
  }

  async function shareLastExport(){
    try {
      if (!canShareVideo()) return;
      const file = new File([S.lastExportBlob], S.lastExportName || 'deepsky-drift-video.webm', { type: S.lastExportBlob.type || 'video/webm' });
      await navigator.share({ files:[file], title:'DeepSkyDrift', text:'I made my astrophotography image move with DeepSkyDrift' });
      analytics('export_share_clicked', { bytes: S.lastExportBlob.size, file_name: S.lastExportName || '' });
    } catch(e) { setStatus('Share canceled or unavailable'); }
  }

  async function recordAttempt(canvas, mimeType, duration, label){
    const fps = (typeof FPS === 'number' && FPS > 0) ? FPS : 30;
    const stream = canvas.captureStream(fps);
    const track = stream.getVideoTracks()[0];
    const chunks = [];
    let recorder;
    try { recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 18000000 }); }
    catch(e) { try { stream.getTracks().forEach(t => t.stop()); } catch(_) {} throw e; }
    recorder.ondataavailable = ev => { if (ev.data && ev.data.size > 0) chunks.push(ev.data); };
    const stopped = new Promise((resolve, reject) => { recorder.onstop = resolve; recorder.onerror = ev => reject(ev.error || new Error('MediaRecorder error')); });
    const frames = Math.max(1, Math.round(duration * fps));
    const frameMs = 1000 / fps;
    recorder.start(1000);
    await sleep(80);
    const start = performance.now();
    for (let f = 0; f < frames; f++) {
      const target = start + f * frameMs, now = performance.now();
      if (target > now) await sleep(target - now);
      drawFrame(canvas, f / fps);
      if (track && typeof track.requestFrame === 'function') { try { track.requestFrame(); } catch(e) {} }
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
    return new Blob(chunks, { type: mimeType });
  }

  async function fixedExport(){
    try {
      if (!S || !S.map || !window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return;
      if (currentUrl) { try { URL.revokeObjectURL(currentUrl); } catch(e) {} currentUrl = null; }
      installRender(); clearAnchorState(); readState();
      if (S.play && typeof play === 'function') play();
      const types = supportedTypes();
      if (!types.length) { setStatus('No supported recording format found.'); return; }
      const d = currentDims(), duration = Math.max(1, Number(S.dur || 10));
      analytics('export_started', { duration, aspect: d.l, preset: S.lastPreset || '', view_mode: S.viewMode, exporter: EXPORT_VERSION });
      const canvas = document.createElement('canvas');
      canvas.width = d.w; canvas.height = d.h;
      canvas.style.cssText = `position:fixed;left:-99999px;top:0;width:${d.w}px;height:${d.h}px;opacity:0;pointer-events:none;background:#000;z-index:-1`;
      document.body.appendChild(canvas);
      const oldPreview = S.preview;
      S.preview = 'final';
      setDisabled(true);
      drawFrame(canvas, 0);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      let blob = null, usedType = '', lastError = null;
      for (const type of types) {
        try {
          const ext = type.includes('mp4') ? 'mp4' : 'webm';
          progress('Exporting movie', 0, `${d.w}×${d.h} · ${duration}s · ${ext}`);
          const candidate = await recordAttempt(canvas, type, duration, ext.toUpperCase());
          if (candidate && candidate.size >= MIN_VALID_BYTES) { blob = candidate; usedType = type; break; }
          lastError = new Error(`Empty export with ${type}`);
          analytics('export_empty_blob', { mime_type:type, bytes:candidate ? candidate.size : 0 });
        } catch(e) { lastError = e; analytics('export_attempt_failed', { mime_type:type, message:String(e && e.message || e) }); }
      }
      S.preview = oldPreview;
      try { document.body.removeChild(canvas); } catch(e) {}
      setDisabled(false);
      renderPreview();
      if (!blob || blob.size < MIN_VALID_BYTES) {
        hideProgress();
        setStatus('Export failed: browser produced an empty video file. Try Edge/Chrome WebM export or a shorter duration.');
        analytics('export_failed_empty', { message:String(lastError && lastError.message || lastError || 'empty blob') });
        return;
      }
      const ext = usedType.includes('mp4') ? 'mp4' : 'webm';
      const name = `deepsky-drift-${appVersion()}-${d.l}-${duration}s.${ext}`;
      S.lastExportBlob = blob;
      S.lastExportName = name;
      hideProgress();
      setStatus(`Video ready · ${appVersion()} · ${sizeLabel(blob.size)}`);
      openExportModal();
      analytics('export_completed', { duration, aspect:d.l, bytes:blob.size, view_mode:S.viewMode, mime_type:usedType, exporter:EXPORT_VERSION });
    } catch(e) {
      setDisabled(false); hideProgress(); setStatus('Export failed: ' + String(e && e.message || e));
      analytics('export_failed_exception', { message:String(e && e.message || e), exporter:EXPORT_VERSION });
    }
  }

  function install(){
    try {
      if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return;
      exp = fixedExport;
      window.exp = fixedExport;
      window.__DSD_EXPORT_FIX_VERSION__ = EXPORT_VERSION;
      window.DSD_OPEN_EXPORT_MODAL = openExportModal;
      const v = byId('appVersion');
      if (v) v.textContent = EXPORT_VERSION;
    } catch(e) {}
  }

  install();
  setInterval(install, 500);
})();
