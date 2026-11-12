(() => {
  const form = document.querySelector('.appearance-controls');
  if (!form) return;
  const body = document.body;
  const result = document.querySelector('#appearance-code');
  const responsive = document.querySelector('link[data-responsive]');
  const status = document.querySelector('#appearance-status');

  function apply() {
    const {palette, typography, layout, alignment} = form.elements;
    Object.assign(body.dataset, {
      palette: palette.value, typography: typography.value,
      layout: layout.value, alignment: alignment.value
    });
    document.querySelector('meta[name="color-scheme"]').content = palette.value === 'ink' ? 'dark' : 'light';
    responsive.media = layout.value === 'canvas' ? 'all' : '(max-width: 860px)';
    result.textContent = `layout: ${layout.value}\nalignment: ${alignment.value}\ntypography: ${typography.value}\npalette: ${palette.value}`;
    status.textContent = `${palette.selectedOptions[0].textContent} · ${layout.selectedOptions[0].textContent} · ${typography.selectedOptions[0].textContent}`;
    document.dispatchEvent(new Event('appearance:layout'));
  }

  form.addEventListener('change', apply);
  form.addEventListener('reset', () => requestAnimationFrame(apply));
  apply();
})();
