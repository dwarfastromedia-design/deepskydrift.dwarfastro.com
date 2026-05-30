const PATCH_VERSION = 'v0.5.0';

function applyPatch043Ui() {
  const versionLabel = document.querySelector('.ver');
  if (versionLabel) versionLabel.textContent = PATCH_VERSION;

  const headerLabel = document.querySelector('header em:not(#badge)');
  if (headerLabel) headerLabel.textContent = 'simple creator UI';

  const warning = document.querySelector('.warn');
  if (warning) warning.textContent = 'iPad/Safari may export below full HD. Desktop Chrome or Edge is recommended for full-resolution video.';

  updExportInfo = function () {
    const d = dims();
    $('exinfo').textContent = `Export target: ${d.w}×${d.h} at ~${FPS} fps · browser may downscale`;
  };

  $('preset').oninput = updExportInfo;
  updExportInfo();
}

async function exportPatched043() {
  if (!S.map || !window.MediaRecorder) return;
  if (S.play) play();

  const mimeType = [
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm'
  ].find(type => MediaRecorder.isTypeSupported(type));

  if (!mimeType) return st('No supported recording format found.');

  const d = dims();
  const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
  const canvas = document.createElement('canvas');
  canvas.width = d.w;
  canvas.height = d.h;
  canvas.style.width = d.w + 'px';
  canvas.style.height = d.h + 'px';
  canvas.style.position = 'fixed';
  canvas.style.left = '0px';
  canvas.style.top = '0px';
  canvas.style.zIndex = '9999';
  canvas.style.opacity = '0.01';
  canvas.style.pointerEvents = 'none';
  canvas.style.background = '#000';
  document.body.appendChild(canvas);

  const oldPreview = S.preview;
  S.preview = 'final';
  $('export').disabled = true;
  $('play').disabled = true;

  draw(canvas, 0, 'cover');
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const stream = canvas.captureStream(FPS);
  const track = stream.getVideoTracks()[0];
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 16000000
  });

  const chunks = [];
  recorder.ondataavailable = event => {
    if (event.data.size) chunks.push(event.data);
  };

  const done = new Promise(resolve => { recorder.onstop = resolve; });

  prog('Exporting movie', 0, `${d.w}×${d.h} · ${S.dur}s · ${ext.toUpperCase()}`);
  recorder.start(250);
  if (track.requestFrame) track.requestFrame();

  const start = performance.now();
  const durationMs = S.dur * 1000;

  await new Promise(resolve => {
    function step(now) {
      const t = cl((now - start) / durationMs, 0, 1);
      draw(canvas, t, 'cover');
      if (track.requestFrame) track.requestFrame();
      prog('Exporting movie', Math.round(t * 100), `${Math.round(t * 100)}% · requested ${d.w}×${d.h} · ${ext.toUpperCase()}`);
      if (t < 1) requestAnimationFrame(step);
      else resolve();
    }
    requestAnimationFrame(step);
  });

  draw(canvas, 1, 'cover');
  if (track.requestFrame) track.requestFrame();
  await new Promise(resolve => setTimeout(resolve, 80));

  recorder.stop();
  await done;

  S.preview = oldPreview;
  document.body.removeChild(canvas);

  const blob = new Blob(chunks, { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `deepsky-drift-${PATCH_VERSION}-${d.l}-${S.dur}s.${ext}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);

  hide();
  $('export').disabled = false;
  $('play').disabled = false;
  render(S.last);
  st(`Download ready · requested ${d.w}×${d.h} · ${ext.toUpperCase()}`);
}

applyPatch043Ui();
exp = exportPatched043;
$('export').onclick = exp;
