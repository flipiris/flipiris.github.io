(() => {
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const modes = ['system', 'light', 'dark'];

  function display(mode) {
    root.dataset.mode = mode;
    root.style.colorScheme = mode;
    document.querySelector('meta[name="color-scheme"]').content = mode;
    document.dispatchEvent(new Event('theme:change'));
  }

  function apply(preference) {
    root.dataset.modePreference = modes.includes(preference) ? preference : 'system';
    display(root.dataset.modePreference === 'system' ? (system.matches ? 'dark' : 'light') : root.dataset.modePreference);
  }

  let stored;
  try { stored = localStorage.getItem('iris-mode'); } catch {}
  apply(stored);
  system.addEventListener('change', () => {
    if (root.dataset.modePreference === 'system') apply('system');
  });
  window.addEventListener('storage', event => {
    if (event.key === 'iris-mode' || event.key === null) apply(event.newValue);
  });
  window.irisTheme = {
    setPreference(preference) {
      apply(preference);
      try { localStorage.setItem('iris-mode', root.dataset.modePreference); } catch {}
    },
    previewPalette(palette) { display(palette === 'ink' ? 'dark' : 'light'); }
  };
})();
