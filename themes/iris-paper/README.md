# Iris Paper

运行 `npm run server` 后打开本地预览。修改 CSS 或 EJS 并保存，现有的 BrowserSync 会更新预览；修改主题配置或 `scripts/` 中的辅助函数、生成器后需重启服务（`Control + C`，再运行 `npm run server`）。

## 从要改的区域找到文件

- 颜色、字体、导航位置、版心尺寸、图标样式：`source/css/base.css` 顶部的变量与末尾的 `.icon`。
- 左侧标识、侧栏、手机菜单（宽屏部分）：`source/css/navigation.css`。
- 窄屏顶栏、抽屉与信息窗下拉：`source/css/narrow.css`。
- 首页列表、归档、页面留白、页脚、进场动画：`source/css/pages.css`。
- 文章的文字、媒体排版、信息窗、阅读进度条、逐段浮现：`source/css/reading.css`。
- 页面元数据调用的版式与配色预设：`source/css/presets.css`。
- 字体注册：`source/css/fonts.css`，由 `tools/build-fonts.py` 生成，不要手工编辑。

没有 `main.css`：`layout.ejs` 逐个引入以上文件。CSS 每条声明单独一行，各文件内按区域分节，无需编译。窄屏以 860px 为界：普通页面用 `<link media="(max-width: 860px)">` 按需启用 `narrow.css`，画布模板无条件启用它。更改断点时，同步 `layout.ejs` 的 media 属性与 `source/js/navigation.js` 中的 860px。

## 图标：Google Material Symbols

图标使用 [Material Symbols](https://fonts.google.com/icons) Outlined，自托管为只含所用图标的子集 `source/fonts/MaterialSymbolsOutlined.woff2`（约 6 KB，可变字重 100–700 与填充轴）。用法：`<%- partial('_partial/icon', {name: 'article'}) %>`，`name` 即 Material Symbols 的图标名。窄屏顶栏的目录按钮使用 `side_navigation`。

添加新图标需重新下载子集：访问
`https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,100..700,0..1,0&icon_names=article,forum,...&display=block`
（把 `icon_names` 换成按字母排序的全部所需图标名），从返回的 CSS 取出 `.woff2` 地址，覆盖保存为 `source/fonts/MaterialSymbolsOutlined.woff2`。

## 字体与渲染速度

原始字体（共约 90 MB）放在站点根目录的 `fonts-src/`，不进入发布产物。`tools/build-fonts.py` 把每种字体切成：

- `*-core.woff2`：一级常用字、标点、拉丁字母（约 1.4 MB），几乎所有页面只需下载它；
- `*-site.woff2`：站内文章实际用到、但不在 core 里的字（通常几十 KB）；
- `*-uXXXX.woff2`：其余字形按码位每 4096 个一块，仅当页面出现对应生僻字时才下载。

`fonts.css` 用 `unicode-range` 声明这些分块，浏览器只取页面用到的部分。新增文章含有新的生僻字后运行：

```bash
python3 -m venv /tmp/ftvenv && /tmp/ftvenv/bin/pip install fonttools brotli   # 仅首次
/tmp/ftvenv/bin/python tools/build-fonts.py --site
```

约 1 秒重建 site 档并刷新 `fonts.css`。完整重建（`tools/build-fonts.py`）约 5 分钟。`layout.ejs` 预加载图标字体和 core 档；图标字体使用 `font-display: block`，避免图标名短暂显示为文字。

其他渲染优化：界面使用 `text-rendering: optimizeSpeed`，仅正文与标题使用 `optimizeLegibility`；动画只使用 `opacity` / `transform`；过渡只列出具体属性；`will-change` 只在逐段浮现期间设置，结束后释放。

## 三种模板

`layout.ejs` 按 `page.layout` 得到模板种类 `kind`，写入 `<html class="kind-…">` 与 `<body class="layout-…">`：

- 文章 `post`：`layout/post.ejs`。纸张容器、信息窗（宽屏常驻右栏，窄屏收进顶栏）、阅读进度条、逐段浮现。
- 页面 `page`：`layout/page.ejs`。无纸张、无信息窗、无进度条；侧栏仍显示「本页目录」。
- 画布 `canvas`（旧名称 `work` 等价）：`layout/canvas.ejs`。正文原样输出，不加页脚，无论屏幕宽度，菜单都由顶栏收起。作品可使用 `--content-left` 和 `--page-top` 自行避让。

首页、归档、分类、标签索引等生成页使用与页面模板相同的极简框架（归档带纸张）。

## 版式与配色预设

在页面 front-matter 中设置，由 `layout.ejs` 写成 `<body data-typography data-palette>`；名称由 `scripts/content-blocks.js` 校验，未知名称会退回默认并在构建时给出警告。

- `typography`：`literary` 文学创作（首行缩进 2em，段间不留空）、`poem` 诗歌（整篇以 `fit-content` 取最长诗行宽度，再由 `margin-inline: auto` 居中，诗行左对齐，不使用 padding 凑位置）、`essay` 随笔（左对齐、不缩进）。
- `palette`：`rose`（默认）、`mist`、`bamboo`、`sepia`、`ink`（深色）。预设只覆盖 `base.css` 的色卡变量（RGB 通道），所以所有组件自动跟随。

新增预设：在 `presets.css` 添加 `body[data-palette="名称"]` 或 `[data-typography="名称"]` 规则，并把名称加入 `scripts/content-blocks.js` 顶部的列表；`npm run test:theme` 会检查两处是否一致。

## 侧栏结构

自上而下：页面一览、标签索引；带图标的分类（文章、评论、作品，附文章数）；最近新增；全站信息。分类由 `_config.yml` 的 `nav_primary` / `nav_categories` 配置，分类尚无文章时仍生成一个空页面。页面模板的「本页目录」位于分类之后。

## 信息窗

第一页：正文字数与阅读时间并为同一行的两列；作者、发布与更新时间、标签照旧。可选的第二页「注释」：正文中的 `<div class="note">…</div>` 被取出放在这里，不再显示在正文，且不计入字数；没有该块则没有页签。页签可用方向键切换。大纲保持在两页之下，不随页签变化。

## 阅读进度与逐段浮现（仅文章）

文章页隐藏浏览器滚动条（`html.kind-post`），改用一条 2px 的横向细进度条，进度写入 CSS 变量 `--progress`：宽屏位于信息窗上缘，窄屏位于顶栏下缘。

正文的每个块级子元素在进入视口时依次浮现（同批错开 50ms，最多 250ms）。首屏已可见的段落不做动画；未执行脚本、或系统开启「减少动态效果」时，全部内容直接显示。

## HTML 结构

`layout/layout.ejs` 按顺序定义：

- `header.site-header`：通栏页眉占位，导航固定在其上方。
- `nav#top-nav`：站点标识与副标题，点击名称返回首页；窄屏时直接承载顶栏，目录开关在左，副标题在右，文章页右端还有信息与大纲入口。
- `nav#side-nav`：常驻的宽屏目录，内部 `.side-nav-content` 独立滚动，全站信息位于目录下方。
- `summary#mobile-nav`：仅窄屏显示的目录开关，位于 `top-nav` 内。
- `details#mobile-menu`：窄屏左侧滑出的目录，与页面左缘直接连接。
- `main#main-content`：页面内容。
- `footer.site-footer`：居中的版权信息。

首页 `layout/index.ejs` 仅保留作品列表；列表由 `layout/_partial/post-list.ejs` 生成。先前的 `intro` 文案仍保留在主题配置中，但首页不再输出它。

## 目录层级

宽屏和手机共用 `layout/_partial/navigation.ejs`。站点链接来自主题 `_config.yml` 的 `menu`；`children` 表示下一级链接，可继续嵌套。新增链接时，先创建对应的实际页面。分类入口指向自动生成的 `/categories/`，展示已有分类及文章数量；在文章 front-matter 中用 `categories` 指定分类，没有分类时展示空状态。`scripts/navigation-data.js` 同时生成“最近新增”入口：按发布日期倒序列出最多 5 篇已发布文章或独立页面，更新旧文不会改变排序；草稿和生成的索引页不计入。

全站信息由 `scripts/site-stats.js` 生成、`layout/_partial/site-stats.ejs` 展示，宽屏侧栏和手机目录共用同一口径：

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

`main` 不设版心，不裁切内容。首页、文章与页面模板通过 `.page-frame` 选择受限宽度。

多媒体作品使用 `layout: canvas`（旧名称 `work` 仍可用），正文直接插入 `main`，不添加文章标题或阅读样式。可在 front-matter 声明作品专属资源：

```yaml
---
title: 作品名称
layout: canvas
styles:
  - /works/example/style.css
scripts:
  - /works/example/main.js
---
```

资源放在网站 `source/works/example/` 下。作品使用独立类名组织样式；固定顶栏会覆盖画布上缘，作品可使用 `--content-left` 和 `--page-top` 自行避让。完全独立的 HTML 文档使用 Hexo 的 `layout: false`。

`npm run build` 生成静态网站到 `public/`。不要直接编辑生成文件。
