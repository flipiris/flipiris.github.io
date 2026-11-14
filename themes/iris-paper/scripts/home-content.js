'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {figureCaptions} = require('./lib/figure-captions');

let homeContent;
hexo.extend.filter.register('before_generate', () => { homeContent = undefined; });
hexo.extend.helper.register('home_content', function() {
  if (homeContent !== undefined) return homeContent;
  const file = path.join(hexo.source_dir, '_data/home.md');
  homeContent = fs.existsSync(file) ? figureCaptions(hexo.render.renderSync({path: file})) : '';
  return homeContent;
});
