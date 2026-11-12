(() => {
  let queued = false;
  function report() {
    queued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    let section = '';
    for (const heading of document.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
      const anchor = heading.closest('[id]') || heading;
      if (anchor.getBoundingClientRect().top > 100) break;
      section = anchor.id || section;
    }
    parent.postMessage({type: 'iris:canvas-progress', progress: max > 24 ? (max - scrollY <= 24 ? 1 : scrollY / max) : 0, section}, '*');
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(report);
  }
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', schedule);
  addEventListener('load', schedule);
  addEventListener('message', event => {
    if (event.source !== parent || event.data?.type !== 'iris:canvas-section') return;
    document.getElementById(String(event.data.id))?.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  });
  report();
})();
