'use strict';

const IMAGE_PARAGRAPH = /<p>\s*(<img\b[^>]*>)\s*<\/p>/g;
const IMAGE_TITLE = /\s+title="([^"]*)"/;

function figureCaptions(content) {
  return String(content || '').replace(IMAGE_PARAGRAPH, (paragraph, image) => {
    const title = IMAGE_TITLE.exec(image);
    const caption = title ? title[1].trim() : '';
    if (!caption) return paragraph;
    return `<figure>${image.replace(IMAGE_TITLE, '')}<figcaption>${caption}</figcaption></figure>`;
  });
}

module.exports = {figureCaptions};
