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

document.querySelectorAll('[data-style]').forEach(btn => {
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

document.querySelectorAll('[data-duration]').forEach(btn => {
  btn.addEventListener('click', () => {
    uiSetValue('dur', btn.dataset.duration);
    uiActivate('duration', btn.dataset.duration);
  });
});

document.querySelectorAll('[data-format]').forEach(btn => {
  btn.addEventListener('click', () => {
    uiSetValue('preset', btn.dataset.format);
    uiActivate('format', btn.dataset.format);
  });
});

document.querySelectorAll('[data-load-image]').forEach(btn => {
  btn.addEventListener('click', () => document.getElementById('file')?.click());
});

const buildButton = document.getElementById('build');
if (buildButton) {
  buildButton.textContent = 'Create Motion';
  new MutationObserver(() => {
    if (/extract/i.test(buildButton.textContent)) buildButton.textContent = 'Recreate Motion';
  }).observe(buildButton, { childList: true, characterData: true, subtree: true });
}

uiActivate('style', 'cinematic');
uiActivate('duration', '15');
uiActivate('format', 'portrait');
