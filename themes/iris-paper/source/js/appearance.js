(() => {
  const form = document.querySelector('.appearance-controls');
  if (!form) return;
  const body = document.body;
  const article = document.querySelector('#main-content > .article-page');
  const result = document.querySelector('#appearance-code');
  const responsive = document.querySelector('link[data-responsive]');
  const status = document.querySelector('#appearance-status');
  function apply() {
    const {palette, typography, layout, alignment} = form.elements;
    body.dataset.palette = palette.value;
    body.dataset.typography = typography.value;
    body.dataset.alignment = alignment.value;
    body.dataset.presentation = layout.value === 'canvas' ? 'canvas' : 'paper';
    body.dataset.previewLayout = layout.value;
    body.dataset.layout = layout.value;
    body.classList.toggle('layout-article', layout.value === 'article');
    body.classList.toggle('layout-canvas', layout.value === 'canvas');
    body.classList.toggle('layout-page', layout.value === 'page');
    document.querySelector('.top-nav').classList.toggle('has-post-info', layout.value !== 'page');
    body.classList.toggle('layout-post', layout.value !== 'page');
    article.querySelector('.page-header').hidden = layout.value === 'canvas';
    article.classList.toggle('page', layout.value === 'page');
    article.classList.toggle('article', layout.value === 'article');
    article.classList.toggle('canvas', layout.value === 'canvas');
    article.classList.toggle('plain-page', layout.value === 'page');
    article.classList.toggle('article-page', layout.value !== 'page');
    document.documentElement.className = document.documentElement.className.replace(/kind-\w+/, layout.value === 'page' ? 'kind-page' : 'kind-post');
    document.querySelector('meta[name="color-scheme"]').content = palette.value === 'ink' ? 'dark' : 'light';
    responsive.media = layout.value === 'canvas' ? 'all' : '(max-width: 860px)';
    result.textContent = `layout: ${layout.value}\nalignment: ${alignment.value}\ntypography: ${typography.value}\npalette: ${palette.value}`;
    status.textContent = `${palette.selectedOptions[0].textContent} · ${layout.selectedOptions[0].textContent} · ${typography.selectedOptions[0].textContent}`;
    document.dispatchEvent(new Event('appearance:layout'));
  }
  form.addEventListener('change', apply);
  form.addEventListener('reset', () => requestAnimationFrame(apply));
  apply();
})();
