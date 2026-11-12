(() => {
  const form = document.querySelector('.appearance-controls');
  if (!form) return;
  const body = document.body;
  const result = document.querySelector('#appearance-code');
  const status = document.querySelector('#appearance-status');

  function apply() {
    const {palette, typography, layout, alignment} = form.elements;
    Object.assign(body.dataset, {
      palette: palette.value, typography: typography.value,
      layout: layout.value, alignment: alignment.value
    });
    if (layout.value === 'canvas') body.dataset.canvas = 'prose';
    else delete body.dataset.canvas;
    document.querySelector('meta[name="color-scheme"]').content = palette.value === 'ink' ? 'dark' : 'light';
    result.textContent = `layout: ${layout.value}\nalignment: ${alignment.value}\ntypography: ${typography.value}\npalette: ${palette.value}`;
    status.textContent = `${palette.selectedOptions[0].textContent} · ${layout.selectedOptions[0].textContent} · ${typography.selectedOptions[0].textContent}`;
    document.dispatchEvent(new Event('appearance:layout'));
  }

  form.addEventListener('change', apply);
  form.addEventListener('reset', () => requestAnimationFrame(apply));
  apply();
})();
