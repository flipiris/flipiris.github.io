(() => {
  const root = document.documentElement;
  const modeButton = document.querySelector('#mode-toggle');
  const dialog = document.querySelector('#site-search');
  const searchButton = document.querySelector('#search-toggle');
  const input = document.querySelector('#search-input');
  const status = document.querySelector('#search-status');
  const results = document.querySelector('#search-results');
  const retry = document.querySelector('#search-retry');
  let documents;
  let loading;

  const modes = ['system', 'light', 'dark'];
  const modeNames = {system: '跟随系统', light: '日间', dark: '夜间'};
  const modeIcons = {system: 'brightness_auto', light: 'light_mode', dark: 'dark_mode'};

  function nextMode() {
    return modes[(modes.indexOf(root.dataset.modePreference) + 1) % modes.length];
  }

  function syncMode() {
    const preference = root.dataset.modePreference;
    const label = `显示模式：${modeNames[preference]}；切换至${modeNames[nextMode()]}`;
    modeButton.setAttribute('aria-label', label);
    modeButton.title = label;
    modeButton.querySelector('.icon').textContent = modeIcons[preference];
  }

  modeButton.addEventListener('click', () => window.irisTheme.setPreference(nextMode()));
  document.addEventListener('theme:change', syncMode);
  document.addEventListener('appearance:layout', () => window.irisTheme.previewPalette(document.body.dataset.palette));
  syncMode();

  const normalize = value => value.normalize('NFKC').toLocaleLowerCase();

  function render() {
    results.replaceChildren();
    const terms = normalize(input.value).trim().split(/\s+/).filter(Boolean);
    if (!terms.length) {
      status.textContent = '输入关键词，搜索标题、标签或正文。';
      return;
    }
    if (!documents) return;
    const matches = documents.map(item => {
      const title = normalize(item.title);
      const tags = normalize(item.tags.join(' '));
      const text = normalize(item.text);
      const all = `${title} ${tags} ${text}`;
      return {item, score: terms.every(term => all.includes(term))
        ? terms.reduce((score, term) => score + (title.includes(term) ? 10 : 0) + (tags.includes(term) ? 5 : 0) + (text.includes(term) ? 1 : 0), 0)
        : 0};
    }).filter(match => match.score).sort((a, b) => b.score - a.score || a.item.url.localeCompare(b.item.url));
    status.textContent = matches.length ? `找到 ${matches.length} 个页面` : '没有找到匹配的页面，试试其他关键词。';
    for (const {item} of matches) {
      const li = document.createElement('li');
      const link = document.createElement('a');
      const title = document.createElement('h3');
      const excerpt = document.createElement('p');
      link.href = item.url;
      title.textContent = item.title;
      const position = normalize(item.text).indexOf(terms[0]);
      const start = Math.max(0, position - 36);
      excerpt.textContent = `${start ? '…' : ''}${item.text.slice(start, start + 160)}${item.text.length > start + 160 ? '…' : ''}`;
      link.append(title, excerpt);
      li.append(link);
      results.append(li);
    }
  }

  function loadIndex() {
    if (documents) return Promise.resolve();
    if (loading) return loading;
    retry.hidden = true;
    status.textContent = '正在加载搜索索引…';
    loading = fetch(dialog.dataset.index).then(response => {
      if (!response.ok) throw new Error('search-index');
      return response.json();
    }).then(data => {
      documents = data;
      render();
    }).catch(() => {
      status.textContent = '搜索索引加载失败，请重试。';
      retry.hidden = false;
    }).finally(() => { loading = undefined; });
    return loading;
  }

  function openSearch() {
    if (dialog.open) return;
    document.dispatchEvent(new Event('site:search'));
    dialog.showModal();
    searchButton.setAttribute('aria-expanded', 'true');
    document.body.classList.add('search-open');
    input.focus();
    if (documents) render();
    else loadIndex();
  }

  searchButton.addEventListener('click', openSearch);
  document.querySelector('#search-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('search-open');
    searchButton.setAttribute('aria-expanded', 'false');
    searchButton.focus({preventScroll: true});
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.querySelector('form').addEventListener('submit', event => { event.preventDefault(); render(); });
  input.addEventListener('input', render);
  retry.addEventListener('click', loadIndex);
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openSearch();
    }
  });
})();
