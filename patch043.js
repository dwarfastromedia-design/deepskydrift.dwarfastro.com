const PATCH_VERSION = 'v0.5.2';

function applyPatch043Ui() {
  const versionLabel = document.querySelector('.ver');
  if (versionLabel) versionLabel.textContent = PATCH_VERSION;

  const headerLabel = document.querySelector('header em:not(#badge)');
  if (headerLabel) headerLabel.textContent = 'smooth export';

  const warning = document.querySelector('.warn');
  if (warning) warning.textContent = 'iPad/Safari may export below full HD. Desktop Chrome or Edge is recommended for full-resolution video.';

  updExportInfo = function () {
    const d = dims();
    $('exinfo').textContent = `Export target: ${d.w}×${d.h} at ${FPS} fps · browser may downscale`;
  };

  $('preset').oninput = updExportInfo;
  updExportInfo();
}

function waitMs(ms) {
  return new Promise(resolve => setTimeout(resolve, Math.max(0, ms)));
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
    videoBitsPerSecond: 18000000
  });

  const chunks = [];
  recorder.ondataavailable = event => {
    if (event.data.size) chunks.push(event.data);
  };

  const done = new Promise(resolve => { recorder.onstop = resolve; });
  const totalFrames = Math.max(1, Math.round(S.dur * FPS));
  const frameMs = 1000 / FPS;

  prog('Exporting movie', 0, `${d.w}×${d.h} · ${S.dur}s · ${ext.toUpperCase()}`);
  recorder.start(250);

  const start = performance.now();
  for (let frame = 0; frame <= totalFrames; frame++) {
    const targetTime = start + frame * frameMs;
    const now = performance.now();
    if (targetTime > now) await waitMs(targetTime - now);

    const t = frame / totalFrames;
    draw(canvas, t, 'cover');
    if (track.requestFrame) track.requestFrame();

    if (frame % 3 === 0 || frame === totalFrames) {
      const pct = Math.round(t * 100);
      prog('Exporting movie', pct, `${pct}% · fixed ${FPS} fps · requested ${d.w}×${d.h}`);
    }
  }

  draw(canvas, 1, 'cover');
  if (track.requestFrame) track.requestFrame();
  await waitMs(120);

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
  st(`Download ready · fixed ${FPS} fps · requested ${d.w}×${d.h}`);
}

applyPatch043Ui();
exp = exportPatched043;
$('export').onclick = exp;
