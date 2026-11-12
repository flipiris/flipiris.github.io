(() => {
  const narrowScreen = window.matchMedia('(max-width: 860px)');
  const isCompact = () => narrowScreen.matches || document.body.dataset.canvas === 'document';
  const hoverPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const backdrop = document.querySelector('.menu-backdrop');
  let backdropAnimation;
  const panels = Array.from(document.querySelectorAll('.hover-panel'), panel => ({
    panel,
    summary: panel.querySelector('summary'),
    body: panel.querySelector('.panel-body'),
    sidebar: panel.id === 'site-menu',
    targetOpen: false,
    mode: '',
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
    record.summary.setAttribute('aria-expanded', String(opening));
    record.panel.dataset.state = opening ? 'opening' : 'closing';
    record.panel.open = true;
    if (record.sidebar) shade(opening);

    const finish = () => {
      record.panel.open = opening;
      record.panel.dataset.state = opening ? 'open' : 'closed';
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
    if (!isCompact()) return;
    clearTimeout(record.closeTimer);
    record.mode = '';
    if (restoreFocus) record.summary.focus({preventScroll: true});
    if (record.panel.dataset.state === 'closed' || record.panel.dataset.state === 'closing') return;
    transition(record, false);
  }

  function open(record, hoverOpened) {
    if (!isCompact()) return;
    panels.forEach(other => {
      if (other !== record) close(other);
    });
    clearTimeout(record.closeTimer);
    record.mode = hoverOpened ? 'hover' : 'click';
    transition(record, true);
  }

  panels.forEach(record => {
    record.summary.addEventListener('click', event => {
      event.preventDefault();
      if (!isCompact()) return;
      if (record.targetOpen && record.mode === 'hover') {
        clearTimeout(record.closeTimer);
        record.mode = 'click';
      } else if (record.targetOpen) close(record);
      else open(record, false);
    });

    record.panel.addEventListener('pointerenter', event => {
      if (!isCompact() || !hoverPointer.matches || event.pointerType !== 'mouse') return;
      clearTimeout(record.closeTimer);
      if (!record.targetOpen) open(record, true);
    });

    record.panel.addEventListener('pointerleave', event => {
      if (!isCompact() || event.pointerType !== 'mouse' || record.mode === 'click') return;
      record.closeTimer = setTimeout(() => {
        if (!record.panel.matches(':focus-within')) close(record);
      }, 180);
    });

    record.panel.addEventListener('focusout', event => {
      if (isCompact() && record.mode !== 'click' && !record.panel.contains(event.relatedTarget) && !record.panel.matches(':hover')) close(record);
    });

    record.panel.addEventListener('click', event => {
      if (isCompact() && event.target.closest('a')) close(record);
    });
  });

  document.addEventListener('pointerdown', event => {
    panels.forEach(record => {
      if (!record.panel.contains(event.target)) close(record);
    });
  });

  backdrop.addEventListener('click', () => panels.filter(record => record.sidebar).forEach(record => close(record, true)));

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const opened = panels.find(record => isCompact() && (record.targetOpen || record.panel.dataset.state === 'closing'));
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
      record.mode = '';
      record.targetOpen = false;
      record.panel.dataset.state = isCompact() ? 'closed' : 'wide';
      record.panel.open = !isCompact();
      record.summary.setAttribute('aria-expanded', String(record.panel.open));
    });
    shade(false, true);
  }

  narrowScreen.addEventListener('change', syncLayout);
  document.addEventListener('appearance:layout', syncLayout);
  hoverPointer.addEventListener('change', () => panels.filter(record => record.mode === 'hover').forEach(record => close(record)));
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      panels.forEach(record => record.animation?.finish());
      backdropAnimation?.finish();
    }
  });
  syncLayout();
})();
