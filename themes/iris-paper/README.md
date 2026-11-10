# Iris Paper

运行 `npm run server` 后打开本地预览。修改 CSS 或 EJS 并保存，现有的 BrowserSync 会更新预览；修改主题配置后需重启服务。

## 从要改的区域找到文件

- 调整颜色、字体、导航位置、版心尺寸：`source/css/base.css` 顶部的变量。
- 调整左侧标识、侧栏、手机菜单：`source/css/navigation.css`。
- 调整首页列表、归档、页面留白、页脚：`source/css/pages.css`。
- 调整普通文章的文字与媒体排版：`source/css/reading.css`。
- `source/css/main.css` 只负责按顺序引入以上文件。

CSS 每条声明单独一行，各文件内按区域分节。窄屏以 860px 为界，位置变量在 `base.css` 的媒体查询内调整；显示方式在 `navigation.css` 内调整。更改断点时也需同步 `source/js/navigation.js` 中的 861px。

宽屏的标识与侧栏共享左侧轴线，正文从侧栏右侧开始。`--nav-width` 控制侧栏宽度，`--content-gap` 控制栏间距，`--layout-width` 控制超宽屏整体布局的居中范围。普通文章由 `--reading-width` 限制版心，不随屏幕无限拉宽。861–1100px 使用较窄侧栏与栏间距。

## HTML 结构

`layout/layout.ejs` 按顺序定义：

- `header.site-header`：窄屏下为横贯页面的固定顶栏，菜单在左、站点标识紧接其右。
- `nav#top-nav`：站点标识，点击返回首页；宽屏仍独立固定在左上方。
- `nav#side-nav`：其下方的宽屏目录。
- `button#mobile-nav`：仅窄屏显示的目录开关，位于顶栏最左侧，与站点标识共用顶栏背景和底边线。
- `dialog#mobile-menu`：窄屏展开的目录。
- `main#main-content`：页面内容。
- `footer.site-footer`：版权信息。

首页 `layout/index.ejs` 仅保留作品列表；列表由 `layout/_partial/post-list.ejs` 生成。先前的 `intro` 文案仍保留在主题配置中，但首页不再输出它。

## 目录层级

宽屏和手机共用 `layout/_partial/navigation.ejs`。站点链接来自主题 `_config.yml` 的 `menu`；`children` 表示下一级链接，可继续嵌套。新增链接时，先创建对应的实际页面。

文章页与普通独立页的“本页目录”从正文标题自动生成，保留标题层级；没有标题时不显示该区块。

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
