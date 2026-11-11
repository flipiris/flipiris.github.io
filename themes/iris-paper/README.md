# Iris Paper

运行 `npm run server` 后打开本地预览。修改 CSS 或 EJS 并保存，现有的 BrowserSync 会更新预览；修改主题配置或 `scripts/` 中的辅助函数、生成器后需重启服务（`Control + C`，再运行 `npm run server`）。

## 从要改的区域找到文件

- 调整颜色、字体、导航位置、版心尺寸：`source/css/base.css` 顶部的变量。
- 调整左侧标识、侧栏、手机菜单：`source/css/navigation.css`。
- 调整首页列表、归档、页面留白、页脚：`source/css/pages.css`。
- 调整普通文章的文字、媒体排版与右侧信息窗：`source/css/reading.css`。
- 字体注册与字重、资源路径：`source/css/fonts.css`。
- `source/css/main.css` 只负责按顺序引入以上文件。

CSS 每条声明单独一行，各文件内按区域分节。窄屏以 860px 为界，位置变量在 `base.css` 的媒体查询内调整；导航显示方式在 `navigation.css` 内调整，信息窗显示方式在 `reading.css` 内调整。更改断点时也需同步 `source/js/navigation.js` 中的 860px。

宽屏标识以 `--nav-axis` 定位，并与 header 占位区域的纵向中心对齐；标识不使用底板或滤层，副标题在标题下方与标题右端对齐。宽屏侧栏与信息窗均常驻展开，不提供收起开关，也不响应悬停开合；侧栏与标识共用横向定位，左右浮窗均保留 `--nav-left` 留白。宽屏侧栏高度固定为 `70vh`（`--sidebar-height`），全站记录停靠底部，目录独立滚动；窄屏目录占满顶栏以下的可用高度。正文居中，浮窗到版心与到页面边缘的距离相等，窄桌面下由 `--layout-gutter` 保留最小留白。`--nav-width` 控制左右栏宽度；`--paper-width` 控制首页、归档与普通阅读页的版心总宽度，默认 750px（包含内边距），内边距由 `--paper-padding` 控制。首页沿用阅读页的宽度与内边距，但不铺纸张背景。相关布局变量在 `body` 上解析，`body.content-layout` 选择阅读版心。页面标题右侧以半透明 accent 圆点强调，不再使用上方横线。文章与独立页面的日期、斜体作者署名位于正文后的右侧。

修改色卡时只填写 RGB 通道数组，例如 `--accent: 138 80 105;`，不在变量中包裹颜色函数或加入透明度。实际使用时写 `rgb(var(--accent))` 或 `rgb(var(--accent) / 12%)`。布局间距尽量从 `--space` 派生；`--header-height` 为通栏页眉预留高度，页眉目前不设背景、边框或装饰。

归档和普通阅读页使用无边框纸张；浮窗去掉外框，以比纸张更轻的阴影提示层级。窄屏顶栏使用浅粉色半透明毛玻璃，保留一条细的 accent 下边框。窄屏信息下拉菜单的底部不越过视口 50% 高度，长内容在菜单内部滚动；下拉抽屉使用小圆角，并将阴影集中在下边缘。侧栏、宽屏信息窗及窄屏顶栏保留 backdrop 滤层；宽屏站点标识不使用滤层。

## HTML 结构

`layout/layout.ejs` 按顺序定义：

- `header.site-header`：通栏页眉占位，导航固定在其上方。
- `nav#top-nav`：站点标识与副标题，点击名称返回首页；窄屏时直接承载顶栏，目录开关在左，副标题在右，文章页右端还有信息与大纲入口。
- `nav#side-nav`：常驻的宽屏目录，内部 `.side-nav-content` 独立滚动，全站记录位于目录下方。
- `summary#mobile-nav`：仅窄屏显示的目录开关，位于 `top-nav` 内。
- `details#mobile-menu`：窄屏左侧滑出的目录，与页面左缘直接连接。
- `main#main-content`：页面内容。
- `footer.site-footer`：居中的版权信息。

首页 `layout/index.ejs` 仅保留作品列表；列表由 `layout/_partial/post-list.ejs` 生成。先前的 `intro` 文案仍保留在主题配置中，但首页不再输出它。

## 目录层级

宽屏和手机共用 `layout/_partial/navigation.ejs`。站点链接来自主题 `_config.yml` 的 `menu`；`children` 表示下一级链接，可继续嵌套。新增链接时，先创建对应的实际页面。分类入口指向自动生成的 `/categories/`，展示已有分类及文章数量；在文章 front-matter 中用 `categories` 指定分类，没有分类时展示空状态。`scripts/navigation-data.js` 同时生成“最近新增”入口：按发布日期倒序列出最多 5 篇已发布文章或独立页面，更新旧文不会改变排序；草稿和生成的索引页不计入。

全站记录由 `scripts/site-stats.js` 生成、`layout/_partial/site-stats.ejs` 展示，宽屏侧栏和手机目录共用同一口径：

- 页面数：当前构建中的已发布文章（含自由作品）加独立页面，不重复计算首页、归档、标签及分页等生成的索引页；草稿不计入。
- 正文字数：统计渲染后正文，中日韩文字逐字计数，其余语言逐词计数；不计标题元数据、代码及行号、HTML 标签、注释、脚本与样式。
- 最近更新：取上述内容中最新的更新时间，无更新时间则使用发布日期；空站点不显示此项。

普通构建由 Hexo 排除未来文章与页面；启用 `future` 配置时，它们随构建一同计入。统计逻辑可用 `node --test themes/iris-paper/test/site-stats.test.js` 检查。

普通文章（`layout: post`）在宽屏右侧常驻显示信息窗，由 `layout/_partial/post-info.ejs` 生成，不提供收起操作，也不显示总标题。信息窗宽度由 `--nav-width` 控制。信息包含本页正文字数、预计阅读时间、作者、发布日期、不同日期的更新时间，以及已有标签；本页统计复用全站正文字数口径，阅读时间按每分钟 300 字向上取整，最少显示 1 分钟。大纲从正文标题自动生成，保留标题层级，无标题时显示提示。`source/js/reading.js` 负责当前章节高亮，仅在窄屏使用原生 `details` 作为抽屉。窄屏下同一个信息窗收进顶栏，由右端信息图标向下展开，默认收起。抽屉紧接顶栏、与屏幕同宽，从右侧信息开关处向下展开；无描边，仅保留轻阴影，不占正文空间。窄屏抽屉由 `source/js/navigation.js` 控制：鼠标悬停即滑出，移出后延迟 180ms 收起；点击可固定展开，再次点击收起。触屏使用点击，键盘使用 Enter / 空格与 Esc。两个窄屏抽屉互斥，选择链接或点击外部均会收起；侧栏展开时，未覆盖区域显示毛玻璃遮罩。切换到宽屏时立即恢复常驻窗口，切回窄屏则先收起抽屉。

普通独立页和自由作品仍在导航中生成“本页目录”；没有标题时不显示该区块。

链接的高亮底层向容器内缩 `--hover-inset`，不覆盖边缘。侧栏链接使用 8px 上下内边距、高亮内缩 2px，其余链接保留默认高亮尺寸。窄屏抽屉的每次进场与退场均创建新动画，退场完成后才关闭 `details`，快速反向时从当前画面继续。系统开启“减少动态效果”时直接开合，并禁用平滑滚动。

运行 `npm run test:theme` 检查全站统计与抽屉状态：覆盖重复开合、退场完成时机、快速反向、宽窄屏切换、遮罩和减少动态效果。

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
