function uiSetValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function uiActivate(group, value) {
  document.querySelectorAll(`[data-${group}]`).forEach(btn => {
    btn.classList.toggle('active', btn.dataset[group] === value);
  });
}

const motionStyles = {
  gentle: { move: 180, fly: 45, grow: 8, zoom: 4, dur: 10, label: 'Gentle Drift' },
  cinematic: { move: 260, fly: 65, grow: 12, zoom: 6, dur: 15, label: 'Cinematic Push' },
  deep: { move: 380, fly: 90, grow: 18, zoom: 9, dur: 20, label: 'Deep Fly-In' }
};

function makeButton(text, attrs = {}, className = '') {
  const b = document.createElement('button');
  b.textContent = text;
  if (className) b.className = className;
  for (const [k, v] of Object.entries(attrs)) b.setAttribute(k, v);
  return b;
}

function makeSeg(items, key, active) {
  const wrap = document.createElement('div');
  wrap.className = 'seg';
  items.forEach(([value, label]) => {
    const b = makeButton(label, { [`data-${key}`]: value }, value === active ? 'active' : '');
    wrap.appendChild(b);
  });
  return wrap;
}

function simpleSection(title) {
  const s = document.createElement('section');
  s.className = 'sec simple';
  if (title) {
    const t = document.createElement('div');
    t.className = 'ttl';
    t.textContent = title;
    s.appendChild(t);
  }
  return s;
}

function wireUiButtons(root = document) {
  root.querySelectorAll('[data-style]').forEach(btn => {
    btn.addEventListener('click', () => {
      const style = motionStyles[btn.dataset.style];
      if (!style) return;
      uiSetValue('move', style.move);
      uiSetValue('fly', style.fly);
      uiSetValue('grow', style.grow);
      uiSetValue('zoom', style.zoom);
      uiSetValue('dur', style.dur);
      uiActivate('style', btn.dataset.style);
      uiActivate('duration', String(style.dur));
      const label = document.getElementById('styleLabel');
      if (label) label.textContent = style.label;
    });
  });

  root.querySelectorAll('[data-duration]').forEach(btn => {
    btn.addEventListener('click', () => {
      uiSetValue('dur', btn.dataset.duration);
      uiActivate('duration', btn.dataset.duration);
    });
  });

  root.querySelectorAll('[data-format]').forEach(btn => {
    btn.addEventListener('click', () => {
      uiSetValue('preset', btn.dataset.format);
      uiActivate('format', btn.dataset.format);
    });
  });

  root.querySelectorAll('[data-load-image]').forEach(btn => {
    btn.addEventListener('click', () => document.getElementById('file')?.click());
  });
}

function transformToSimpleUi() {
  document.querySelector('.ver') && (document.querySelector('.ver').textContent = 'v0.5.0');
  const subtitle = document.querySelector('header em:not(#badge)');
  if (subtitle) subtitle.textContent = 'simple creator UI';
  const dropTitle = document.querySelector('#drop h1');
  if (dropTitle) dropTitle.textContent = 'Create a deep-sky motion video';
  const dropText = document.querySelector('#drop p');
  if (dropText) dropText.textContent = 'Load an astrophotography image. Everything runs locally in your browser.';
  const browse = document.getElementById('browse');
  if (browse) { browse.textContent = 'Load Image'; browse.classList.add('primary'); }

  const aside = document.querySelector('aside');
  if (!aside) return;

  const build = document.getElementById('build');
  const stats = document.getElementById('stats');
  const play = document.getElementById('play');
  const exp = document.getElementById('export');
  const reset = document.getElementById('reset');

  const controls = {
    strict: document.getElementById('strict')?.closest('.row'),
    max: document.getElementById('max')?.closest('.row'),
    move: document.getElementById('move')?.closest('.row'),
    rad: document.getElementById('rad')?.closest('.row'),
    bias: document.getElementById('bias'),
    preview: document.getElementById('preview'),
    fly: document.getElementById('fly')?.closest('.row'),
    grow: document.getElementById('grow')?.closest('.row'),
    zoom: document.getElementById('zoom')?.closest('.row'),
    dur: document.getElementById('dur')?.closest('.row'),
    preset: document.getElementById('preset'),
    exinfo: document.getElementById('exinfo')
  };

  aside.innerHTML = '';

  const start = document.createElement('section');
  start.className = 'sec simple simpletop';
  start.innerHTML = '<h2>Make your video</h2><p>Use the defaults, or pick a style. Most images only need Create Motion and Export Video.</p>';
  start.appendChild(makeButton('Load Image', { 'data-load-image': '1' }, 'secondary'));
  if (build) { build.textContent = 'Create Motion'; build.className = 'primary'; start.appendChild(build); }
  if (stats) start.appendChild(stats);
  aside.appendChild(start);

  const style = simpleSection('Motion Style');
  style.appendChild(makeSeg([['gentle','Gentle'],['cinematic','Cinematic'],['deep','Deep']], 'style', 'cinematic'));
  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.innerHTML = 'Current look: <span id="styleLabel">Cinematic Push</span>';
  style.appendChild(hint);
  aside.appendChild(style);

  const tune = simpleSection('Fine Tune');
  if (controls.fly) {
    controls.fly.querySelector('.head span:first-child').textContent = 'Motion Amount';
    tune.appendChild(controls.fly);
  }
  if (controls.zoom) {
    controls.zoom.querySelector('.head span:first-child').textContent = 'Push In';
    tune.appendChild(controls.zoom);
  }
  if (controls.grow) { controls.grow.style.display = 'none'; tune.appendChild(controls.grow); }
  aside.appendChild(tune);

  const length = simpleSection('Length');
  length.appendChild(makeSeg([['10','10s'],['15','15s'],['20','20s']], 'duration', '15'));
  if (controls.dur) { controls.dur.style.display = 'none'; length.appendChild(controls.dur); }
  aside.appendChild(length);

  const format = simpleSection('Format');
  format.appendChild(makeSeg([['portrait','Portrait'],['landscape','Wide'],['square','Square']], 'format', 'portrait'));
  if (controls.preset) { controls.preset.style.display = 'none'; format.appendChild(controls.preset); }
  if (controls.exinfo) format.appendChild(controls.exinfo);
  aside.appendChild(format);

  const actions = simpleSection('Export');
  const group = document.createElement('div');
  group.className = 'actions';
  if (play) { play.textContent = '▶ Preview'; play.className = 'secondary'; group.appendChild(play); }
  if (exp) { exp.textContent = 'Export Video'; exp.className = 'primary'; group.appendChild(exp); }
  actions.appendChild(group);
  const warn = document.createElement('div');
  warn.className = 'warn';
  warn.textContent = 'iPad/Safari may export below full HD. Desktop Chrome or Edge is recommended for full-resolution video.';
  actions.appendChild(warn);
  aside.appendChild(actions);

  const details = document.createElement('details');
  details.className = 'advanced';
  details.innerHTML = '<summary>Advanced star settings</summary>';
  const adv = simpleSection('Extraction');
  if (controls.strict) { controls.strict.querySelector('.head span:first-child').textContent = 'Cleaner Stars'; adv.appendChild(controls.strict); }
  if (controls.max) adv.appendChild(controls.max);
  if (controls.move) { controls.move.querySelector('.head span:first-child').textContent = 'Stars That Move'; adv.appendChild(controls.move); }
  if (controls.rad) adv.appendChild(controls.rad);
  if (controls.bias) adv.appendChild(controls.bias);
  details.appendChild(adv);
  const diag = simpleSection('Diagnostics');
  if (controls.preview) {
    controls.preview.querySelector('option[value="starless"]').textContent = 'Background Only';
    controls.preview.querySelector('option[value="stars"]').textContent = 'Stars Layer';
    diag.appendChild(controls.preview);
  }
  const p = document.createElement('p');
  p.className = 'tiny';
  p.textContent = 'Use only if the motion looks wrong.';
  diag.appendChild(p);
  details.appendChild(diag);
  aside.appendChild(details);

  const bottom = document.createElement('section');
  bottom.className = 'sec';
  if (reset) { reset.textContent = 'Reset'; reset.className = 'secondary'; bottom.appendChild(reset); }
  aside.appendChild(bottom);

  if (build) {
    new MutationObserver(() => {
      if (/extract/i.test(build.textContent)) build.textContent = 'Recreate Motion';
    }).observe(build, { childList: true, characterData: true, subtree: true });
  }

  wireUiButtons(aside);
  uiSetValue('dur', 15);
  uiSetValue('zoom', 6);
  uiActivate('style', 'cinematic');
  uiActivate('duration', '15');
  uiActivate('format', 'portrait');
}

transformToSimpleUi();
