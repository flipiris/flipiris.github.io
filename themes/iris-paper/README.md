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

没有 `main.css`：`layout.ejs` 逐个引入以上文件。CSS 每条声明单独一行，各文件内按区域分节，无需编译。窄屏以 860px 为界：普通页面用 `<link media="(max-width: 860px)">` 按需启用 `narrow.css`，canvas 展示模式无条件启用它。更改断点时，同步 `layout.ejs` 的 media 属性与 `source/js/navigation.js` 中的 860px。

## 图标：Google Material Symbols

图标使用 [Material Symbols](https://fonts.google.com/icons) Outlined，自托管为只含所用图标的子集 `source/fonts/MaterialSymbolsOutlined.woff2`（约 6 KB，可变字重 100–700 与填充轴）。用法：`<%- partial('_partial/icon', {name: 'article'}) %>`，`name` 即 Material Symbols 的图标名。窄屏顶栏的目录按钮使用 `side_navigation`。

添加新图标需重新下载子集：访问
`https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,100..700,0..1,0&icon_names=article,forum,...&display=block`
（把 `icon_names` 换成按字母排序的全部所需图标名），从返回的 CSS 取出 `.woff2` 地址，覆盖保存为 `source/fonts/MaterialSymbolsOutlined.woff2`。

## 字体回退

`--UI-font` 与 `--serif` 的末尾追加了 `--local-cjk`：`Songti SC`（macOS）、`STSong`、思源宋体（`Source Han Serif SC`、`Noto Serif CJK SC`、`Noto Serif SC`）、`Songti TC`、`SimSun`、`PMingLiU`。网络字体尚未到达或加载失败时，浏览器直接用这些本机字体，字体到位后再替换，不会出现空白文字。要增删本机字体，只改 `base.css` 里的 `--local-cjk` 一行。

注意：回退字体与网络字体的字形宽度不同，替换时行尾可能轻微重排；`font-display: swap` 保证文字始终可见。

## 站点标识色

站点名称使用 `--brand`（默认酒红 `114 30 52`），窄屏顶栏的目录按钮使用 `--accent`。每套配色预设各自给出一个 `--brand`，与它的 `--accent` 协调。

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

## 共享内容结构与选项

使用选项与写作示例以根目录 `README.md` 的「元数据速查」为准。

`layout.ejs` 统一输出站点框架与元数据。所有布局（包括 canvas）的 `main-content` 最大宽度为 1000px，首页与 page 统一使用 `.site-layout` 网格：side-nav 和 main 是相邻列，800px 的 `article.content.page` 与侧栏整体居中；首页大标题独立相对整页居中。article 仍使用 700px 阅读纸张，canvas 可用到 1000px。`page` / `article` 共用 `_partial/content-page.ejs`，基础元素为 `.content-page.page-frame`、`.page-header`、`.page-title`、`.article-content`；`.plain-page` / `.article-page` 是兼容既有样式的布局修饰类。首页、归档、分类、标签、更新与其他页面复用 `page`。正文样式的选择器始终限定在 `.article-content`，页面标题仅用 `.page-title`。

- `page` 默认让侧栏与正文作为一组居中，`alignment: balanced` 保留原来的对称三栏轴线。不提供信息窗口，也不把大纲放进 side-nav。
- `article` 保留阅读纸张、信息窗和阅读脚本。`layout: canvas` 改为宽幅无纸张且不输出页面标题，元信息仍在顶栏下拉菜单中。旧 `layout: post` / `work` 保留兼容入口。
- `page_style` 校验排版、配色；笔记默认 enhanced，显式元数据优先。CSS 预设放在 `presets.css`，合法名称放在 `scripts/content-blocks.js`。
- 完整 HTML 作品由 `_partial/post-content.ejs` 输出到不授予同源权限的 sandbox iframe；`canvas-bridge.js` 与外层 `reading.js` 用限定消息类型及消息来源的 `postMessage` 同步目录与真实阅读进度。`.html` 源文件让 Hexo 跳过 Markdown 解析。
- canvas 的顶栏、目录与信息下拉菜单局部覆盖为中性灰阶，正文配色不受影响。按钮使用 `data-state`、焦点和悬停表达激活状态。

导航、索引与分类：`scripts/navigation-data.js`。分类路径使用 Hexo 的 `category_map`，空分类同样遵守映射；中文旧地址生成跳转页。`folder-categories.js` 在 `before_generate` 中读取原始元数据，经 Hexo `setCategories` 设置目录默认分类；显式分类优先，旧「随笔」归一为「笔记」。

分类/标签索引共用 `_partial/taxonomy-cards.ejs`；服务端分页按卡片数量拆分，卡片内只预览配置数量的文章，完整分类/标签列表使用原生分页。侧栏入口和社交地址在主题 `_config.yml`。

首页图片、图注与空白正文位于 `source/_data/home.yml`，结构在 `_partial/home.ejs`。站点标识复用 `_partial/site-identity.ejs`，首页移到页眉。概览采用内容容器查询，达到 680px 时双栏；热力图始终压缩到可用宽度，详细统计位于两者下方的 disclosure，不挤入关键数值栏。首页不单列最近更新，完整更新记录仍在 `/updates/`。统计口径及最近更新时间规则见下文。

## 标题强调点

`_partial/page-title.ejs` 用语义化 `<h1 class="page-title">`，保留标题的正常行内换行，只将末尾一个完整字形放进 `.title-end`。该元素使用 `inline-flex; align-items: center`，`::after` 生成圆点。因此圆点紧跟末字、与末行垂直居中，且不会单独换行或跑到标题区域的最右侧。`Intl.Segmenter` 保证组合 emoji 不被拆开。

## 页眉主题示例

`source/mtf/index.md` 是「其他页面」中的 MtF 展示页。它使用 `layout: page` 与 `header: mtf`；`layout.ejs` 在既有 `header.site-header` 中输出 `_partial/mtf-header.ejs`，用 `source/css/mtf.css` 实现蓝、粉、白色带与圆形图案。页眉留在文档顶部，导航继续浮在上方，正文通过页面专属 `--page-top` 避让。标题、章节入口与内容可分别在该 partial、Markdown 和专属样式中修改。

## 信息窗

第一页：正文字数与阅读时间并为同一行的两列；作者、发布与更新时间、标签照旧。可选的第二页「注释」：正文中的 `<div class="note">…</div>` 被取出放在这里，不再显示在正文，且不计入字数；没有该块则没有页签。页签可用方向键切换。大纲保持在两页之下，不随页签变化。

## 阅读进度与逐段浮现（仅文章）

文章页隐藏浏览器滚动条（`html.kind-post`），改用一条 2px 的横向细进度条，进度写入 CSS 变量 `--progress`：宽屏位于信息窗上缘，窄屏位于顶栏下缘。进度 = `scrollY ÷ (文档高度 − 视口高度)`，与文末留白无关，所以滚到底必然为 100%；离底 24px 以内吸附为 100%，避免触控板惯性停在末端前一点点。填充条从淡到浓渐变，前端带一个亮点，滚到底时亮点收起、整条定格；还在页首（或页面短到无法滚动）时整条淡出。

正文的每个块级子元素在进入视口时依次浮现（同批错开 50ms，最多 250ms）。首屏已可见的段落不做动画；未执行脚本、或系统开启「减少动态效果」时，全部内容直接显示。

## HTML 结构

`layout/layout.ejs` 按顺序定义：

- `header.site-header`：通栏页眉占位，导航固定在其上方。
- `nav#top-nav`：站点标识与副标题，点击名称返回首页；窄屏时目录开关在左，信息与大纲入口在右。
- `nav#side-nav`：位于 `.site-layout` 内的宽屏目录，内部 `.side-nav-content` 独立滚动，全站信息位于目录下方。
- `summary#mobile-nav`：仅窄屏显示的目录开关，位于 `top-nav` 内。
- `details#mobile-menu`：窄屏左侧滑出的目录，与页面左缘直接连接。
- `main#main-content`：页面内容。
- `footer.site-footer`：位于 `.site-layout` 内，与正文同列的版权信息。

## 目录层级

宽屏和手机共用 `layout/_partial/navigation.ejs`。站点入口来自主题 `_config.yml` 的 `nav_primary`、`nav_categories` 与 `nav_misc`。共用的索引和导航数据位于 `scripts/navigation-data.js`，内容页筛选与更新时间排序复用 `scripts/lib/documents.js`。

全站信息由 `scripts/site-stats.js` 生成、`layout/_partial/site-stats.ejs` 展示，宽屏侧栏和手机目录共用同一口径：

- 页面数：当前构建中的已发布文章（含自由作品）加独立内容页（不计 CSS、脚本等资源），不重复计算首页、归档、标签及分页等生成的索引页；草稿不计入。
- 正文字数：统计渲染后正文，中日韩文字逐字计数，其余语言逐词计数；不计标题元数据、代码及行号、HTML 标签、注释、脚本与样式。
- 最近更新：取上述内容中最新的更新时间，无更新时间则使用发布日期；空站点不显示此项。

普通构建由 Hexo 排除未来文章与页面；启用 `future` 配置时，它们随构建一同计入。统计逻辑可用 `node --test themes/iris-paper/test/site-stats.test.js` 检查。

普通文章（`layout: article`，兼容 `post`）在宽屏右侧常驻显示信息窗，由 `layout/_partial/post-info.ejs` 生成，不提供收起操作，也不显示总标题。信息窗宽度由 `--nav-width` 控制。信息包含本页正文字数、预计阅读时间、作者、发布日期、不同日期的更新时间，以及已有标签；本页统计复用全站正文字数口径，阅读时间按每分钟 300 字向上取整，最少显示 1 分钟。大纲从正文标题自动生成，保留标题层级，无标题时显示提示。`source/js/reading.js` 负责当前章节高亮，仅在窄屏使用原生 `details` 作为抽屉。窄屏下同一个信息窗收进顶栏，由右端信息图标向下展开，默认收起。抽屉紧接顶栏、与屏幕同宽，从右侧信息开关处向下展开；无描边，仅保留轻阴影，不占正文空间。窄屏抽屉由 `source/js/navigation.js` 控制：鼠标悬停即滑出，移出后延迟 180ms 收起；点击可固定展开，再次点击收起。触屏使用点击，键盘使用 Enter / 空格与 Esc。两个窄屏抽屉互斥，选择链接或点击外部均会收起；侧栏展开时，未覆盖区域显示毛玻璃遮罩。切换到宽屏时立即恢复常驻窗口，切回窄屏则先收起抽屉。

信息窗口仅用于 article / canvas；首页、索引与普通 page 不输出它。side-nav 只放站点导航。

链接的高亮底层向容器内缩 `--hover-inset`，不覆盖边缘。侧栏链接使用 8px 上下内边距、高亮内缩 2px，其余链接保留默认高亮尺寸。窄屏抽屉的每次进场与退场均创建新动画，退场完成后才关闭 `details`，快速反向时从当前画面继续。系统开启“减少动态效果”时直接开合，并禁用平滑滚动。

运行 `npm run test:theme` 检查全站统计与抽屉状态：覆盖重复开合、退场完成时机、快速反向、宽窄屏切换、遮罩和减少动态效果。

网站名称仍由网站根目录 `_config.yml` 的 `title` 决定。

## 自由内容画布

完整 HTML 作品的维护与元数据示例见根目录 README。`docs/scp-cn-4001.md` 记录该作品的素材来源与外部依赖；不要直接编辑生成的 `public/`。

`npm run build` 生成静态网站到 `public/`。不要直接编辑生成文件。

公开布局 ID 为 `article` / `page` / `canvas`；公开配色 ID 为 `rose` / `tech` / `wanderers` / `ink` / `sepia`。增强排版使用独立的 `--strong` / `--emphasis` 文字色，不绘制背景；标题层级复用这组区分明显的色相。
