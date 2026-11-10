(() => {
  const toggle = document.querySelector('#mobile-nav');
  const dialog = document.querySelector('#mobile-menu');
  const closeButton = dialog.querySelector('.close-menu');
  const wideScreen = window.matchMedia('(min-width: 861px)');

  function openMenu() {
    dialog.showModal();
    syncMenuState();
  }

  function closeMenu() {
    dialog.close();
    syncMenuState();
  }

  function syncMenuState() {
    toggle.setAttribute('aria-expanded', String(dialog.open));
    document.body.classList.toggle('nav-open', dialog.open);

    if (!dialog.open && !wideScreen.matches) {
      toggle.focus({preventScroll: true});
    }
  }

  toggle.addEventListener('click', openMenu);
  closeButton.addEventListener('click', closeMenu);

  dialog.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      closeMenu();
      return;
    }

    // 点击遮罩关闭；点击目录内部的空白处不关闭。
    if (event.target === dialog) {
      const bounds = dialog.getBoundingClientRect();
      const outside = event.clientX < bounds.left
        || event.clientX > bounds.right
        || event.clientY < bounds.top
        || event.clientY > bounds.bottom;

      if (outside) closeMenu();
    }
  });

  // 原生 dialog 负责 Esc 和焦点限制；关闭后恢复开关状态。
  dialog.addEventListener('close', syncMenuState);

  wideScreen.addEventListener('change', (event) => {
    if (event.matches && dialog.open) closeMenu();
  });
})();
