'use strict';

function standalonePages(site) {
  return site.pages.toArray().filter(page => page.published !== false
    && (!/\.[^/]+$/.test(page.path || '') || /\.html?$/i.test(page.path)));
}

function publishedDocuments(site) {
  return site.posts.toArray().filter(page => page.published !== false)
    .concat(standalonePages(site));
}

function updateTime(page) {
  return page.updated || page.date;
}

function recentlyUpdated(site) {
  return publishedDocuments(site).sort((a, b) =>
    (updateTime(b) ? updateTime(b).valueOf() : 0) - (updateTime(a) ? updateTime(a).valueOf() : 0)
    || a.path.localeCompare(b.path));
}

module.exports = {publishedDocuments, standalonePages, updateTime, recentlyUpdated};
