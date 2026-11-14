'use strict';

const {splitWarning, hasWarning} = require('./lib/content-warning');
const blocks = new Map();

hexo.extend.filter.register('before_generate', () => blocks.clear());
hexo.extend.helper.register('content_warning', function(page = {}) {
  const content = page.content || '';
  if (!blocks.has(content)) blocks.set(content, splitWarning(content));
  return {enabled: hasWarning(page), ...blocks.get(content)};
});
