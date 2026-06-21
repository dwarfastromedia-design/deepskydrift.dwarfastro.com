(function(){
  const playIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/></svg>';
  const pauseIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor" stroke="none"/></svg>';
  const shareIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3"/><path d="M7 8l5-5 5 5"/><path d="M6 12v8h12v-8"/></svg>';

  function setIcon(button, icon, label){
    if (!button) return;
    if (button.dataset.icon !== label) {
      button.innerHTML = icon;
      button.dataset.icon = label;
    }
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
  }

  function syncHeaderIcons(){
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
  }

  try { window.syncMobileActions = syncHeaderIcons; } catch(e) {}
  document.addEventListener('DOMContentLoaded', syncHeaderIcons);
  window.addEventListener('load', syncHeaderIcons);
  setInterval(syncHeaderIcons, 250);
})();
