'use strict';

const {escapeHTML} = require('hexo-util');

hexo.extend.helper.register('canvas_document', function(content, base, bridge) {
  const html = String(content || '');
  if (!/<html[\s>]/i.test(html)) return '';
  const escaped = escapeHTML(String(base || ''));
  const prepared = escaped ? html.replace(/<head([^>]*)>/i, '<head$1><base href="' + escaped + '">') : html;
  const script = '<script src="' + escapeHTML(String(bridge || '/js/canvas-bridge.js')) + '"></script>';
  return prepared.replace(/<\/body>/i, script + '</body>');
});
