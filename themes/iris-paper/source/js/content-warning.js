(() => {
  const page = document.querySelector('.content-page.is-content-locked');
  if (!page) return;
  const warning = page.querySelector('.content-warning');
  const body = page.querySelector('.content-warning-body');
  const link = warning.querySelector('.content-warning-continue');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let animations = [];
  let revealing = false;

  function cancelAnimations() {
    for (const animation of animations) animation.cancel();
    animations = [];
  }

  function lock() {
    cancelAnimations();
    revealing = false;
    page.classList.add('is-content-locked');
    body.setAttribute('inert', '');
    body.setAttribute('aria-hidden', 'true');
    warning.hidden = false;
  }

  function finish() {
    cancelAnimations();
    revealing = false;
    body.removeAttribute('inert');
    body.removeAttribute('aria-hidden');
    warning.hidden = true;
    body.focus({preventScroll: true});
    document.dispatchEvent(new Event('content:continue'));
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target && body.contains(target)) target.scrollIntoView();
  }

  lock();

  link.addEventListener('click', event => {
    event.preventDefault();
    if (revealing || !page.classList.contains('is-content-locked')) return;
    revealing = true;
    page.classList.remove('is-content-locked');
    if (reducedMotion.matches) {
      finish();
      return;
    }
    const style = getComputedStyle(document.documentElement);
    const easing = style.getPropertyValue('--ease-out').trim();
    const shade = warning.animate([{opacity: 1}, {opacity: 0}], {
      duration: parseFloat(style.getPropertyValue('--motion-base')), easing, fill: 'both'
    });
    const content = body.animate([
      {opacity: 0, transform: document.body.dataset.canvas === 'document' ? 'none' : 'translateY(6px)'},
      {opacity: 1, transform: 'none'}
    ], {duration: parseFloat(style.getPropertyValue('--motion-reveal')), easing, fill: 'both'});
    const current = [shade, content];
    animations = current;
    Promise.all(current.map(animation => animation.finished)).then(() => {
      if (animations === current) finish();
    }, () => {});
  });

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches && revealing) finish();
  });
  window.addEventListener('pagehide', lock);
  window.addEventListener('pageshow', event => {
    if (event.persisted) lock();
  });
})();
