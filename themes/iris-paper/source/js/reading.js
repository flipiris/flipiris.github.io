(() => {
  const root = document.documentElement;
  const info = document.querySelector('.post-info');
  const article = document.querySelector('.article-content');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  const canvas = document.querySelector('.canvas-document');
  let canvasProgress = 0;
  const bars = Array.from(document.querySelectorAll('.read-progress'));
  const SNAP = 24;
  let progressQueued = false;

  function updateProgress() {
    progressQueued = false;
    const max = root.scrollHeight - window.innerHeight;
    const idle = canvas ? canvasProgress === 0 : max <= SNAP;
    let value = canvas ? canvasProgress : idle ? 0 : window.scrollY / max;
    if (!canvas && !idle && max - window.scrollY <= SNAP) value = 1;
    value = Math.min(1, Math.max(0, value));
    for (const bar of bars) {
      bar.style.setProperty('--progress', value.toFixed(4));
      bar.classList.toggle('is-idle', idle || value < 0.002);
      bar.classList.toggle('is-complete', value >= 1);
    }
  }
  if (canvas && info) {
    info.querySelectorAll('.toc-link').forEach(link => link.addEventListener('click', event => {
      event.preventDefault();
      canvas.contentWindow.postMessage({type: 'iris:canvas-section', id: decodeURIComponent(link.hash.slice(1))}, '*');
      canvas.focus();
    }));
    window.addEventListener('message', event => {
      if (event.source !== canvas.contentWindow || event.data?.type !== 'iris:canvas-progress') return;
      canvasProgress = Math.min(1, Math.max(0, Number(event.data.progress) || 0));
      updateProgress();
      info.querySelectorAll('.toc-link').forEach(link => {
        if (decodeURIComponent(link.hash.slice(1)) === event.data.section) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }

  const sections = info ? Array.from(info.querySelectorAll('.toc-link'), link => ({
    link,
    heading: document.getElementById(decodeURIComponent(link.hash.slice(1)))
  })).filter(({heading}) => heading) : [];
  let activeLink;

  let outlineOffset;
  function measureOutline() {
    outlineOffset = parseFloat(getComputedStyle(root).scrollPaddingTop) + 16;
  }

  function updateOutline() {
    if (!sections.length) return;
    let current = sections[0];
    for (const section of sections) {
      if (section.heading.getBoundingClientRect().top <= outlineOffset) current = section;
      else break;
    }
    if (window.scrollY + window.innerHeight >= root.scrollHeight - 2) current = sections[sections.length - 1];
    if (activeLink === current.link) return;
    if (activeLink) activeLink.removeAttribute('aria-current');
    current.link.setAttribute('aria-current', 'location');
    activeLink = current.link;
  }

  function onScroll() {
    if (progressQueued) return;
    progressQueued = true;
    requestAnimationFrame(() => {
      updateProgress();
      updateOutline();
    });
  }

  window.addEventListener('scroll', onScroll, {passive: true});
  window.addEventListener('resize', () => { measureOutline(); onScroll(); });
  document.addEventListener('appearance:layout', () => { measureOutline(); onScroll(); });
  measureOutline();
  updateProgress();
  updateOutline();

  function setupReveal() {
    if (!article || reduced.matches || !('IntersectionObserver' in window)) return;
    const blocks = Array.from(article.children);
    if (!blocks.length) return;

    const viewport = window.innerHeight;
    const observer = new IntersectionObserver(entries => {
      const entering = entries.filter(entry => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      entering.forEach((entry, index) => {
        const block = entry.target;
        block.style.setProperty('--reveal-delay', `${Math.min(index, 5) * 50}ms`);
        block.classList.add('is-visible');
        observer.unobserve(block);
        const finish = () => {
          block.classList.add('is-done');
          block.removeEventListener('transitionend', finish);
        };
        block.addEventListener('transitionend', finish);
      });
    }, {rootMargin: '0px 0px -8% 0px', threshold: 0.01});

    for (const block of blocks) {
      block.classList.add('reveal');
      if (block.getBoundingClientRect().top < viewport * 0.92) {
        block.classList.add('is-visible', 'is-done');
      } else {
        observer.observe(block);
      }
    }
    reduced.addEventListener('change', () => {
      if (!reduced.matches) return;
      observer.disconnect();
      for (const block of blocks) block.classList.add('is-visible', 'is-done');
    });
  }

  setupReveal();

  const tabs = info ? Array.from(info.querySelectorAll('.info-tabs [role="tab"]')) : [];
  const pages = info ? info.querySelector('.info-pages') : null;
  if (tabs.length && pages) {
    function select(index, focus) {
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
      });
      pages.dataset.page = String(index + 1);
      info.querySelectorAll('.info-page').forEach((page, i) => { page.hidden = i !== index; });
      if (focus) tabs[index].focus();
    }
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(index));
      tab.addEventListener('keydown', event => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault();
          select((index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length, true);
        }
      });
    });
    select(0);
  }
})();
