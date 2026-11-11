(() => {
  const narrowScreen = window.matchMedia('(max-width: 860px)');
  const hoverPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const backdrop = document.querySelector('.menu-backdrop');
  let backdropAnimation;
  const panels = Array.from(document.querySelectorAll('.hover-panel'), panel => ({
    panel,
    summary: panel.querySelector('summary'),
    body: panel.querySelector('.panel-body'),
    sidebar: panel.id === 'mobile-menu',
    state: 'closed',
    targetOpen: false,
    hoverOpened: false,
    pinned: false,
    animation: undefined,
    closeTimer: undefined
  }));

  function motion() {
    const style = getComputedStyle(document.documentElement);
    return {
      duration: reducedMotion.matches ? 0 : parseFloat(style.getPropertyValue('--motion-base')),
      easing: style.getPropertyValue('--ease-out').trim(),
      fill: 'both'
    };
  }

  function shade(show, immediate = false) {
    const opacity = backdrop.hidden ? '0' : getComputedStyle(backdrop).opacity;
    backdropAnimation?.cancel();
    backdropAnimation = undefined;
    document.body.classList.toggle('nav-open', show);
    if (immediate || reducedMotion.matches) {
      backdrop.hidden = !show;
      backdrop.style.opacity = show ? '1' : '';
      return;
    }
    if (!show && backdrop.hidden) return;
    backdrop.hidden = false;
    const animation = backdrop.animate([{opacity}, {opacity: show ? 1 : 0}], motion());
    backdropAnimation = animation;
    animation.finished.then(() => {
      if (backdropAnimation !== animation) return;
      backdropAnimation = undefined;
      backdrop.hidden = !show;
      backdrop.style.opacity = show ? '1' : '';
      animation.cancel();
    }, () => {});
  }

  function transition(record, opening) {
    // details 关闭后会立即隐藏正文，不能靠 [open] 的单次 CSS 动画完成退场。
    // 每次开合创建新动画；快速反向时从当前画面继续，不复用已结束的动画。
    const end = {opacity: 1, transform: 'none', clipPath: 'inset(0)'};
    const start = record.sidebar
      ? {opacity: 0, transform: 'translateX(-100%)', clipPath: 'inset(0)'}
      : {opacity: 0, transform: 'translateY(-8px)', clipPath: 'inset(0 0 100% 0)'};
    let from = opening ? start : end;
    if (record.animation) {
      const style = getComputedStyle(record.body);
      from = {opacity: style.opacity, transform: style.transform, clipPath: style.clipPath};
      record.animation.cancel();
    }
    record.animation = undefined;
    record.targetOpen = opening;
    record.state = opening ? 'opening' : 'closing';
    record.panel.dataset.state = record.state;
    record.panel.open = true;
    if (record.sidebar) shade(opening);

    const finish = () => {
      record.panel.open = opening;
      record.state = opening ? 'open' : 'closed';
      record.panel.dataset.state = record.state;
    };
    if (reducedMotion.matches) {
      finish();
      return;
    }
    const animation = record.body.animate([from, opening ? end : start], motion());
    record.animation = animation;
    animation.finished.then(() => {
      if (record.animation !== animation) return;
      record.animation = undefined;
      finish();
      animation.cancel();
    }, () => {});
  }

  function close(record, restoreFocus = false) {
    if (!narrowScreen.matches) return;
    clearTimeout(record.closeTimer);
    record.hoverOpened = false;
    record.pinned = false;
    if (restoreFocus) record.summary.focus({preventScroll: true});
    if (record.state === 'closed' || record.state === 'closing') return;
    transition(record, false);
  }

  function open(record, hoverOpened) {
    if (!narrowScreen.matches) return;
    panels.forEach(other => {
      if (other !== record) close(other);
    });
    clearTimeout(record.closeTimer);
    record.hoverOpened = hoverOpened;
    record.pinned = !hoverOpened;
    transition(record, true);
  }

  panels.forEach(record => {
    record.summary.addEventListener('click', event => {
      event.preventDefault();
      if (!narrowScreen.matches) return;
      if (record.targetOpen && record.hoverOpened) {
        clearTimeout(record.closeTimer);
        record.hoverOpened = false;
        record.pinned = true;
      } else if (record.targetOpen) close(record);
      else open(record, false);
    });

    record.panel.addEventListener('pointerenter', event => {
      if (!narrowScreen.matches || !hoverPointer.matches || event.pointerType !== 'mouse') return;
      clearTimeout(record.closeTimer);
      if (!record.targetOpen) open(record, true);
    });

    record.panel.addEventListener('pointerleave', event => {
      if (!narrowScreen.matches || event.pointerType !== 'mouse' || record.pinned) return;
      record.closeTimer = setTimeout(() => {
        if (!record.panel.matches(':focus-within')) close(record);
      }, 180);
    });

    record.panel.addEventListener('focusout', event => {
      if (narrowScreen.matches && !record.pinned && !record.panel.contains(event.relatedTarget) && !record.panel.matches(':hover')) close(record);
    });

    record.panel.addEventListener('click', event => {
      if (narrowScreen.matches && event.target.closest('a')) close(record);
    });
  });

  document.addEventListener('pointerdown', event => {
    if (!narrowScreen.matches) return;
    panels.forEach(record => {
      if (!record.panel.contains(event.target)) close(record);
    });
  });

  backdrop.addEventListener('click', () => panels.filter(record => record.sidebar).forEach(record => close(record, true)));

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !narrowScreen.matches) return;
    const opened = panels.find(record => record.targetOpen || record.state === 'closing');
    if (opened) {
      event.preventDefault();
      close(opened, true);
    }
  });

  function syncLayout() {
    panels.forEach(record => {
      clearTimeout(record.closeTimer);
      record.animation?.cancel();
      record.animation = undefined;
      record.hoverOpened = false;
      record.pinned = false;
      record.targetOpen = false;
      record.state = narrowScreen.matches ? 'closed' : 'wide';
      record.panel.dataset.state = record.state;
      // 宽屏信息窗常驻展开；侧栏本身是静态 nav，不参与抽屉状态。
      record.panel.open = !narrowScreen.matches && !record.sidebar;
    });
    shade(false, true);
  }

  narrowScreen.addEventListener('change', syncLayout);
  hoverPointer.addEventListener('change', () => panels.filter(record => record.hoverOpened).forEach(record => close(record)));
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      panels.forEach(record => record.animation?.finish());
      backdropAnimation?.finish();
    }
  });
  syncLayout();
})();
