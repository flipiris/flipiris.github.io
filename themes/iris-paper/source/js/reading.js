(() => {
  const info = document.querySelector('.post-info');
  if (!info) return;

  const narrowScreen = window.matchMedia('(max-width: 860px)');
  const summary = info.querySelector('summary');

  // 同一个 details：宽屏浮窗，窄屏顶栏抽屉。
  if (narrowScreen.matches) info.open = false;
  narrowScreen.addEventListener('change', event => {
    info.open = !event.matches;
  });

  document.querySelector('#mobile-nav').addEventListener('click', () => {
    if (narrowScreen.matches) info.open = false;
  });

  document.addEventListener('pointerdown', event => {
    if (narrowScreen.matches && info.open && !info.contains(event.target)) info.open = false;
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && narrowScreen.matches && info.open) {
      info.open = false;
      summary.focus({preventScroll: true});
    }
  });

  info.addEventListener('click', event => {
    if (narrowScreen.matches && event.target.closest('.toc-link')) {
      info.open = false;
      summary.focus({preventScroll: true});
    }
  });

  const sections = Array.from(info.querySelectorAll('.toc-link'), (link) => ({
    link,
    heading: document.getElementById(decodeURIComponent(link.hash.slice(1)))
  })).filter(({heading}) => heading);
  if (!sections.length) return;

  let scheduled = false;
  let activeLink;

  function updateOutline() {
    scheduled = false;
    const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) + 16;
    let current = sections[0];
    for (const section of sections) {
      if (section.heading.getBoundingClientRect().top <= offset) current = section;
      else break;
    }

    // 文末的短章节也能成为当前章节。
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      current = sections[sections.length - 1];
    }
    if (activeLink === current.link) return;
    if (activeLink) activeLink.removeAttribute('aria-current');
    current.link.setAttribute('aria-current', 'location');
    activeLink = current.link;
  }

  function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updateOutline);
  }

  window.addEventListener('scroll', scheduleUpdate, {passive: true});
  window.addEventListener('resize', scheduleUpdate);
  updateOutline();
})();
