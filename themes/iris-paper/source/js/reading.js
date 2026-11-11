(() => {
  const info = document.querySelector('.post-info');
  if (!info) return;

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
