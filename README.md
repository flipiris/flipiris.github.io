# flipiris

网站：<https://flipiris.github.io/> · Hexo + Iris Paper · 推送到 `main` 后由 GitHub Actions 自动发布。

## 写一篇进入首页的文章

在项目目录运行：

```bash
npm run new -- --slug first-essay "第一篇文章"
```

打开新建的 `source/_posts/first-essay.md`，在两条 `---` 之后写 Markdown 正文。中文标题可以修改；`first-essay` 决定文件名和网址 `/first-essay/`。每篇文章使用不同的 slug。

保留自动生成的 `date`，以免文章日期随构建环境或文件修改时间变化。文章会自动进入首页和归档，不用手写链接。

## 新建关于页、栏目页等独立页面

```bash
npm run page -- about
```

编辑 `source/about/index.md`；页面网址为 `/about/`。独立页面会进入「最近更新」索引；没有导航分类的页面也会进入「其他页面」。

需要导航入口时，在 `themes/iris-paper/_config.yml` 的 `nav_primary` 列表中增加：

```yaml
  - label: 关于
    path: /about/
```

先创建实际页面，再添加链接。修改主题配置后，重启本地预览服务。

## 首页文字、图片与社交链接

编辑 `source/_data/home.yml`：`image` 是首页大图地址，`image_alt` 是图片替代文字，`caption` 是图下注释，`text` 是预留的 Markdown 正文。`caption` 与 `text` 当前留空，正文每行保持两个空格缩进：

```yaml
caption: 一段图片说明
text: |
  ## 关于这个地方

  在这里写下首页正文。
```

首页站点名称在页眉中居中放大；正文后是全站概览。概览在内容区足够宽时左热力图、右统计，窄屏上下排列；全年热力图随版心缩放，不横向滚动。首页不另列最近更新。阅读统计与栏目分布位于热力图和关键数值下方，可展开查看。

在 `themes/iris-paper/_config.yml` 中填写 `social.github`、`social.x`；留空时侧栏最下方显示未启用的 GitHub / X 图标圆角方形按钮，不会跳向虚假地址。

## 元数据速查

元数据写在每篇文件开头的两条 `---` 之间。例如，一篇使用绿金配色的笔记：

```yaml
---
title: 阅读札记
date: 2026-11-12 10:00:00
updated: 2026-11-12 12:00:00
permalink: reading-notes/
author: flipiris
categories:
  - 笔记
tags:
  - 阅读
layout: article
palette: wanderers
---
```

| 字段 | 值与默认行为 |
| --- | --- |
| `title` | 页面标题；独立使用 `.page-title`，不与正文 `h1` 混用样式。canvas 不显示此标题，但浏览器标签和列表仍使用它 |
| `date` / `updated` | 发布 / 更新日期。建议明确填写；未写 `updated` 时沿用文件修改时间 |
| `permalink` | 固定网址，如 `reading-notes/`；移动文件或修改标题时仍保持此网址 |
| `author` | 省略时使用网站作者 |
| `description` | 页面描述；省略时使用网站描述 |
| `categories` | 分类链，或多条嵌套的分类链，见下节 |
| `tags` | 标签列表，彼此平行 |
| `layout` | `article` 文章纸张；`page` 极简页面；`canvas` 无纸张画布。旧 `post` / `work` 仍兼容 |
| `presentation` | 旧写法仍可用：`layout: post` 或 `article` 搭配 `presentation: canvas` 等价于 `layout: canvas` |
| `alignment` | `centered`（默认）将 page 的侧栏与正文整体居中；`balanced` 恢复正文居中、两侧对称留白的旧布局。article 使用三栏阅读布局，不受此项影响 |
| `typography` | `standard` 标准；`enhanced` 彩色标题、粗体与斜体文字变色（无背景高亮）；`literary` 首行缩进两字、段落外边距保留 `0.75em`；`poem` 整篇诗行整体居中、行内左对齐 |
| `palette` | `rose`（默认）、`tech`、`wanderers`、`ink`、`sepia`。外观实验室只显示英文 ID；原 `wanderer` 自动映射到 `wanderers` |
| `styles` / `scripts` | 页面专属 CSS / JS 路径列表，只填写真实存在的资源 |
| `canvas_base` | 完整 HTML 画布的相对素材基址，如 `/works/scp-cn-4001/` |
| `disableNunjucks` | 完整 HTML 或带模板符号的脚本建议设为 `true`，避免被 Hexo 模板引擎解释 |
| `header` | `mtf` 可调用现有主题页页眉示例，配合 `styles: [/css/mtf.css]` |

`typography` 省略时通常使用标准排版；「笔记」（包括兼容的旧「随笔」）自动使用 `enhanced`。显式写 `typography: standard` 可关闭增强排版。标题、段落、引用、列表、表格与代码的基础样式在所有 `.article-content` 中共用。

外观实验室不设侧栏专属入口，可以直接访问 [外观实验室](http://localhost:4000/appearance/)，直接预览配色、布局、对齐与排版的组合，并复制对应元数据。预览只影响当前展示页；刷新后恢复默认。

## 用子目录管理文章与子分类

**可以。准确的文件夹名是 `source/_posts/`，其中可以继续建立子目录。** Hexo 原生支持递归读取，但不会自动把目录变成分类；本主题已加入目录默认分类：仅当文章没有填写有效的 `categories` / `category` 时，按相对目录生成一条分类链。

```text
source/_posts/
  notes/
    reading/
      a-book.md
  works/
    a-poem.md
```

在主题 `_config.yml` 的 `folder_categories` 中配置目录名：

```yaml
folder_categories:
  notes: 笔记
  reading: 阅读
  works: 作品
```

这样，`notes/reading/a-book.md` 在没有显式分类时归入「笔记 → 阅读」；已有 `categories: [评论]` 的文章移动到该目录后仍归入「评论」。`npm run new` 的默认文章模板预填了「文章」，需要使用目录默认分类时删去这项。没有映射的目录直接以目录名作为分类名。

在根目录 `_config.yml` 的 `category_map` 中为分类配置英文 URL：

```yaml
category_map:
  笔记: notes
  阅读: reading
  文章: articles
  评论: reviews
  作品: works
```

「笔记 → 阅读」的地址就是 `/categories/notes/reading/`。新增中文分类也应补一项英文映射；每个分类层级的 slug 应有辨识度，避免相同路径。

不用子目录也能直接指定子分类。一维列表表示**父子链**，不是多个平级分类：

```yaml
categories:
  - 笔记
  - 阅读
```

若要同时归入两个平级栏目，使用两条嵌套列表：

```yaml
categories:
  - [笔记, 阅读]
  - [评论]
```

旧分类名「随笔」会统一为「笔记」。原来的中文分类入口会跳到英文地址。移动已有文章前，建议先给它填写固定的 `permalink`，避免文件路径参与 slug 后造成网址变化。

分类与标签索引以卡片列出页面；每页默认 8 张卡片，每卡预览 6 篇。主题配置 `taxonomy_per_page`、`taxonomy_preview` 可修改这两个值；点击卡片的查看入口进入完整列表，完整分类 / 标签列表使用 Hexo 的分页（默认每页 10 篇）。

## 新建自由排版的多媒体作品（画布）

```bash
npm run canvas -- --slug night-journey "夜行"
```

新文件位于 `source/_posts/night-journey.md`，使用同一套文章元信息与渲染：

```yaml
layout: canvas
styles:
  - /works/night-journey/style.css
scripts:
  - /works/night-journey/main.js
```

所有页面的 `main-content` 最宽 1000px，画布同样遵守。画布不显示页面标题、不铺纸张；所有屏幕使用顶栏目录与信息下拉菜单。顶栏、目录抽屉与信息菜单统一采用中性灰阶玻璃，不叠加配色染色；开关未激活时减淡，激活后恢复清晰。普通 Markdown / HTML 片段仍放在共享的 `.article-content` 中，可用专属样式自由排版。

**完整的 HTML 文档请存成 `.html`，不要直接粘进 `.md`。** 在 `.html` 文件开头保留 YAML 元数据，正文从 `<!doctype html>` / `<html>` 开始：

```yaml
---
title: 多媒体作品
permalink: multimedia-work/
layout: canvas
canvas_base: /works/multimedia-work/
disableNunjucks: true
---
```

完整文档自动放入隔离的 iframe，内部 CSS / JS 不会污染站点。相对素材放到对应 `source/works/multimedia-work/` 中；文档内部 CSS / JS 应由其自身 `head` / `body` 引用，而不是外层的 `styles` / `scripts`。外层信息窗的目录与阅读进度会同步到作品。该 iframe 允许作品脚本和用户主动打开链接，不授予同源访问；需要登录、同源存储等权限的独立应用应另行部署。

`scp-cn-4001/` 的原文件已经改为 `source/_posts/4001.html`，补齐原站的 CSS、JS 与 SVG 素材，保留原有正文和署名。插画与字体仍从文档中原有的外部地址加载，访问它们需要网络。

## 正文中的注释与诗歌

文章（包括普通画布片段）的 `note` 块移到信息窗的「注释」页；没有该块就不显示页签。块内 Markdown 与 HTML 标签之间各留一空行：

```html
<div class="note">

**作者注**：这段内容出现在信息窗里。

</div>
```

只有 `article` / `canvas`（兼容旧 `post`）提供信息窗口；首页、索引和普通 `page` 不提供。普通 `page` 的注释块原位显示，side-nav 只放站点导航。完整 HTML 作品在隔离框架中保留自己的内容和注释结构。

把诗歌嵌入普通文章时，可使用 `<div class="poem">`；它将整个诗块居中、诗行左对齐。`typography: poem` 则作用于整篇正文。

## 本地预览

```bash
npm run server
```

打开 <http://localhost:4000/>。保持终端运行，修改文章或样式并保存后，预览会自动更新。按 `Control + C` 停止服务。

## 发布：检查、提交、同步

先检查本地构建：

```bash
npm run build
```

然后在 VS Code 的“源代码管理”中查看改动，将本次要公开的文件暂存，填写提交说明，点击“提交”，再点击“同步更改”或“推送”。

推送会触发 [Publish website](https://github.com/flipiris/flipiris.github.io/actions)。等 `build` 和 `deploy` 都成功后，再刷新正式网站。提交完成不等于部署完成。

也可以用终端：

```bash
git status --short
git add source themes scaffolds tools fonts-src package.json package-lock.json _config.yml .github .gitignore README.md
git commit -m "发布新文章"
git push
```

提交说明改成这次实际修改的内容。如需删除文件，也应在 VS Code 中暂存对应的删除。

如果推送连接超时，保持 Clash Verge 运行，改用临时代理：

```bash
git -c http.proxy=http://127.0.0.1:7897 push
```

不必重复登录，不用运行 `hexo deploy`，也不要提交 `public/`、`node_modules/` 和缓存文件。

## 尚未公开的草稿

```bash
npm run draft -- --slug unfinished "未完成的文章"
npm run server -- --draft
```

草稿位于 `source/_drafts/`，默认不构建到正式网站，也已加入 Git 忽略规则。此目录中的未跟踪草稿不会随普通提交上传；公开仓库里已经提交过的内容不能靠忽略规则隐藏。

准备公开时，先停止草稿预览，再运行：

```bash
npx hexo publish unfinished
```

文章会移入 `source/_posts/`。检查标题、日期和正文后，再按上面的步骤提交与推送。

## 网站组织结构

```text
_config.yml                    网站名称、网址、英文分类映射、分页
scaffolds/                     新建文章、页面、画布与草稿的模板
source/
  _posts/                      文章与作品；允许子目录和目录默认分类
  _data/home.yml               首页图片、图注、预留 Markdown 正文
  appearance/index.md          外观实验室；没有专属侧栏入口
  mtf/index.md                 独立页面与定制页眉示例
  works/                       作品 CSS、JS、SVG 等素材
themes/iris-paper/
  _config.yml                  导航、社交链接、目录分类、卡片分页
  layout/                      EJS 页面模板
    layout.ejs                 站点外壳：页眉、导航、main、页脚
    page.ejs / article.ejs      页面与文章；canvas 复用文章组件
    _partial/                  内容外壳、首页、列表、导航、信息窗等共享组件
  scripts/                     分类、索引、统计与元数据辅助逻辑
  source/css/                  基础、导航、页面、阅读、配色、窄屏样式
  source/js/                   导航抽屉、阅读交互、外观预览、画布通信
  source/fonts/                自托管字体
  test/                        模板、构建和交互测试
public/                        Hexo 生成的发布文件，不直接编辑
```

- `/`：大标题、图片与图注、预留正文、紧凑的全站概览。首页没有独立的最近更新列表。
- `/updates/`：文章、作品与独立页面的最近更新索引。
- `/archives/`：页面一览入口，当前由 Hexo 的文章归档生成，按文章发布日期排列。
- `/categories/`、`/tags/`：分类与标签卡片索引；卡片链接到可分页的内容列表。
- `/categories/notes/`、`/categories/articles/`、`/categories/reviews/`、`/categories/works/`：笔记、文章、评论、作品栏目。
- `/misc/`：没有归入导航分类的文章与独立页面。
- `/appearance/`：配色、布局与排版预览；`/mtf/` 是独立主题页示例。
- 各篇文章使用自身 `permalink`，与分类目录分开。

## 页面内的 HTML 结构

所有页面复用同一站点外壳。首页与普通 page 的 article 均为 800px，和 side-nav 作为 `.site-layout` 中的相邻网格列整体居中。首页标题独立相对整个页面居中。`main-content` 最宽 1000px；article 阅读纸张仍为 700px。窄屏把同一套导航放入顶栏抽屉。

```text
body[data-layout="article" | "page" | "canvas"]
├─ a.skip-link
├─ header.site-header
│  ├─ .site-identity-hero                  仅首页，整页居中
│  └─ nav#top-nav
│     ├─ details#mobile-menu               窄屏 / canvas 的目录抽屉
│     ├─ .site-identity
│     └─ details.post-info                 仅 article / canvas
├─ button.menu-backdrop
└─ .site-layout
   ├─ nav#side-nav
   │  └─ .side-nav-panel
   │     ├─ .side-nav-content              站点导航
   │     ├─ .site-stats
   │     └─ .social-links
   ├─ main#main-content                    最大 1000px
   │  └─ article.content.page / .article / .canvas
   │     ├─ header.page-header > h1.page-title
   │     ├─ .article-content 或索引内容
   │     └─ footer.article-footer          仅 article / canvas
   └─ footer.site-footer
```

文章使用 `article.content.article`，普通页面与索引使用 `article.content.page`，画布使用 `article.content.canvas`；原 `.article-page` / `.plain-page` 保留为兼容类。首页与 canvas 都不在正文中输出 `.page-header`；首页标题位于站点页眉，canvas 的标题只留在元数据和列表中。

**正文与索引：** 普通内容在 `.article-content` 内；列表使用 `.post-list > .post-item`，分类 / 标签卡片使用 `.taxonomy-grid > .taxonomy-card`，分页使用 `.pagination`。页面标题仅通过 `.page-title` 设置样式，与正文的 `h1` 分离。

**首页：** `.home-page` 内依次为 `.home-image`（图片与 `figcaption`）、`.home-intro.article-content`（预留正文）、`.home-section`（全站概览）。概览中 `.home-overview` 放热力图和四项关键数值；其后的 `.overview-details` 放可展开的细致统计，不占用右侧关键数值栏。

**画布：** `layout: canvas` 复用 article 结构，用 `data-presentation="canvas"` 改变相同元素的样式。HTML 片段直接放入 `.article-content`；完整 HTML 文档放入 `iframe.canvas-document`，通过 `canvas-bridge.js` 同步目录和阅读进度。
