'use strict';

function pageLayout(page) {
  return ['article', 'canvas'].includes(page.layout) ? page.layout : 'page';
}
hexo.extend.helper.register('page_layout', pageLayout);
