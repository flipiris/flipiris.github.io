(() => {
  const root = document.documentElement;
  const info = document.querySelector('.post-info');
  const article = document.querySelector('.article-content');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* 1. 阅读进度：按正文区域计算，写入 CSS 变量 --progress（0–1）；两条进度条共用。 */
  const bars = Array.from(document.querySelectorAll('.read-progress'));
  const articleBox = document.querySelector('.article-page');
  let progressQueued = false;

  function updateProgress() {
    progressQueued = false;
    if (!articleBox) return;
    const top = articleBox.getBoundingClientRect().top + window.scrollY;
    const span = articleBox.offsetHeight - window.innerHeight * 0.6;
    const value = span > 0 ? Math.min(1, Math.max(0, (window.scrollY - top + window.innerHeight * 0.2) / span)) : 1;
    for (const bar of bars) bar.style.setProperty('--progress', value.toFixed(4));
  }

  /* 2. 当前章节高亮。 */
  const sections = info ? Array.from(info.querySelectorAll('.toc-link'), link => ({
    link,
    heading: document.getElementById(decodeURIComponent(link.hash.slice(1)))
  })).filter(({heading}) => heading) : [];
  let activeLink;

  function updateOutline() {
    if (!sections.length) return;
    const offset = parseFloat(getComputedStyle(root).scrollPaddingTop) + 16;
    let current = sections[0];
    for (const section of sections) {
      if (section.heading.getBoundingClientRect().top <= offset) current = section;
      else break;
    }
    // 文末的短章节也能成为当前章节。
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
  window.addEventListener('resize', onScroll);
  updateProgress();
  updateOutline();

  /* 3. 逐段浮现：块级子元素进入视口时依次显现。
        首屏已可见的段落不做动画，避免打开页面时整屏闪动；
        同一批进入的段落错开 50ms，上限 250ms。 */
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
      // 已在首屏内的块直接可见（不触发过渡）。
      if (block.getBoundingClientRect().top < viewport * 0.92) {
        block.classList.add('is-visible', 'is-done');
      } else {
        observer.observe(block);
      }
    }

    // 减少动态效果被临时开启时，立即显示全部内容。
    reduced.addEventListener('change', () => {
      if (!reduced.matches) return;
      observer.disconnect();
      for (const block of blocks) block.classList.add('is-visible', 'is-done');
    });
  }

  setupReveal();

  /* 4. 信息窗页签：信息 / 注释。仅当存在注释块时才有页签。 */
  const tabs = info ? Array.from(info.querySelectorAll('.info-tabs [role="tab"]')) : [];
  const pages = info ? info.querySelector('.info-pages') : null;
  if (tabs.length && pages) {
    function select(index, focus) {
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
      });
      pages.dataset.page = String(index + 1);
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
