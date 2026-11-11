# Iris Paper

运行 `npm run server` 后打开本地预览。修改 CSS 或 EJS 并保存，现有的 BrowserSync 会更新预览；修改主题配置后需重启服务。

## 从要改的区域找到文件

- 调整颜色、字体、导航位置、版心尺寸：`source/css/base.css` 顶部的变量。
- 调整左侧标识、侧栏、手机菜单：`source/css/navigation.css`。
- 调整首页列表、归档、页面留白、页脚：`source/css/pages.css`。
- 调整普通文章的文字、媒体排版与右侧信息窗：`source/css/reading.css`。
- `source/css/main.css` 只负责按顺序引入以上文件。

CSS 每条声明单独一行，各文件内按区域分节。窄屏以 860px 为界，位置变量在 `base.css` 的媒体查询内调整；导航显示方式在 `navigation.css` 内调整，信息窗显示方式在 `reading.css` 内调整。更改断点时也需同步 `source/js/navigation.js` 中的 861px 和 `source/js/reading.js` 中的 860px。

宽屏的标识与侧栏由同一个 Grid 排列，侧栏高度为 `80vh`；极矮窗口下限制在可见范围内，内容独立滚动。正文两侧预留等宽栏位，始终保持居中。`--nav-width` 控制左右栏宽度，`--content-gap` 控制栏间距，两者随视口宽度平滑缩小；`--layout-width` 控制超宽屏整体布局的居中范围。普通文章由 `--reading-width` 限制版心，不随屏幕无限拉宽。

## HTML 结构

`layout/layout.ejs` 按顺序定义：

- `header.site-header`：宽屏下为固定的纵向 Grid，包含站点标识与侧栏；窄屏改为横向 Grid 顶栏，菜单在左、站点标识紧接其右。
- `nav#top-nav`：站点标识与副标题，点击名称返回首页。
- `nav#side-nav`：标识下方的宽屏目录，内部 `.side-nav-content` 独立滚动。
- `button#mobile-nav`：仅窄屏显示的目录开关，位于顶栏最左侧，与站点标识共用顶栏背景和底边线。
- `dialog#mobile-menu`：窄屏展开的目录。
- `main#main-content`：页面内容。
- `footer.site-footer`：居中的版权信息。

首页 `layout/index.ejs` 仅保留作品列表；列表由 `layout/_partial/post-list.ejs` 生成。先前的 `intro` 文案仍保留在主题配置中，但首页不再输出它。

## 目录层级

宽屏和手机共用 `layout/_partial/navigation.ejs`。站点链接来自主题 `_config.yml` 的 `menu`；`children` 表示下一级链接，可继续嵌套。新增链接时，先创建对应的实际页面。

普通文章（`layout: post`）在右侧显示可收起的“信息与大纲”，由 `layout/_partial/post-info.ejs` 生成。它与左栏等宽，收放不改变正文位置。信息包含作者、发布日期、不同日期的更新时间，以及已有标签；大纲从正文标题自动生成，保留标题层级，无标题时显示提示。`source/js/reading.js` 负责当前章节高亮，原生 `details` 支持键盘收放。窄屏下信息窗移到文章标题下方，默认收起。

普通独立页和自由作品仍在导航中生成“本页目录”；没有标题时不显示该区块。

链接高亮、页面进入、手机菜单和信息窗使用短过渡；支持的浏览器会平滑收放信息窗，其余使用原生行为。系统开启“减少动态效果”时禁用动画与平滑滚动。

网站名称仍由网站根目录 `_config.yml` 的 `title` 决定。

## 自由内容画布

`main` 不设版心，不裁切内容。首页与普通文章通过 `.page-frame` 选择受限宽度。

多媒体作品使用 `layout: work`，正文直接插入 `main`，不添加文章标题或阅读样式。可在 front-matter 声明作品专属资源：

```yaml
---
title: 作品名称
layout: work
styles:
  - /works/example/style.css
scripts:
  - /works/example/main.js
---
```

资源放在网站 `source/works/example/` 下。作品使用独立类名组织样式；固定导航会覆盖画布左上区域，作品可使用 `--content-left` 和 `--page-top` 自行避让。完全独立的 HTML 文档使用 Hexo 的 `layout: false`。

`npm run build` 生成静态网站到 `public/`。不要直接编辑生成文件。
