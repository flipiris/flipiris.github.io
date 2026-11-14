'use strict';

const {figureCaptions} = require('./lib/figure-captions');

hexo.extend.helper.register('figures', figureCaptions);
hexo.extend.filter.register('after_post_render', data => {
  data.content = figureCaptions(data.content);
  return data;
});

module.exports = {figureCaptions};
