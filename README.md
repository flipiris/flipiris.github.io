# 无人野水荒湾

Hexo + Iris Paper。日常写作、样式维护与发布以本文件为准。

## 写文章：放进文件夹即可分类

```bash
npm run new -- --slug first-essay "第一篇文章"
mkdir -p source/_posts/articles
mv source/_posts/first-essay.md source/_posts/articles/
```

编辑新文件，正文写在元数据后的空行。保留生成的日期；需要固定网址时填写 `permalink`：

```yaml
---
title: 第一篇文章
date: 2026-11-12 10:00:00
permalink: first-essay/
layout: article
tags: [阅读]
---
```

分类只看 `source/_posts/` 下的目录，不读取 `categories` / `category`。移动文件即可改变分类；`layout` 只决定外观，不决定内容归属。

```text
source/_posts/
  notes/           笔记，默认 enhanced 排版
  articles/        文章
  reviews/         评论
  works/           作品，包括自由排版的 canvas
  uncategorized.md 未分类，进入 /misc/
```

主题配置 `themes/iris-paper/_config.yml` 的 `sections` 是目录分类的唯一配置源。列表顺序决定导航顺序，`folder` 同时决定英文分类地址：

```yaml
sections:
  - folder: notes
    label: 笔记
    icon: edit_note
  - folder: works
    label: 作品
    icon: palette
```

`notes/reading/book.md` 形成「笔记 → reading」分类链，地址为 `/categories/notes/reading/`。需要中文显示名时，给 `reading` 增加一条配置；配置中的分类也会进入导航。未配置的目录直接使用目录名。配置了但暂时没有文章的栏目仍有空列表页。

新文章默认以文件名生成网址。**移动已有文章之前先填写固定的 `permalink`**，这样网址不随目录变化。现有五篇内容均已固定网址。

## 选择页面外观

| 字段 | 用法 |
| --- | --- |
| `layout` | `article`：700px 阅读纸张和信息窗；`page`：800px 无纸张页面；`canvas`：最宽 1000px 的自由作品、顶栏导航和信息菜单 |
| `typography` | `standard` 标准；`enhanced` 彩色标题与强调；`literary` 两字首行缩进、段落外边距 `0.75em`；`poem` 整篇居中、诗行左对齐 |
| `palette` | `rose`（默认）、`tech`、`wanderers`、`ink`、`sepia` |
| `alignment` | 用于 `page`：`centered`（默认）让侧栏与正文整体居中；`balanced` 让正文居中、两侧保留对称栏位 |
| `author` | 省略时使用站点作者 |
| `date` / `updated` | 发布 / 更新日期；未写 `updated` 时使用文件修改时间 |
| `description` | 页面描述；省略时使用站点描述 |
| `styles` / `scripts` | 页面专属资源路径列表 |
| `canvas_base` | 完整 HTML 作品的相对素材基址，例如 `/works/scp-cn-4001/` |
| `disableNunjucks` | HTML 或脚本中有模板符号时设为 `true` |

笔记未填写 `typography` 时使用 `enhanced`；显式填写其他值即可覆盖。增强排版只改变标题、粗体和斜体的文字色，不加背景高亮。三组标题层级（h1/h4、h2/h5、h3/h6）分别使用 `--heading-1/2/3`，粗体用 `--strong`，斜体用 `--emphasis`，五种角色不互相复用颜色。各色卡独立设值；修改后需检查纸面与页面背景上的对比度，以及标题和正文强调的辨识度。

页面标题保持单一文本节点，圆点由 `.page-title::after` 生成，用 `vertical-align: bottom` 与末行对齐；行尾空间不足时圆点可以换行。不要重新包裹标题末字。

普通文章中的注释写成：

```html
<div class="note">

这里可写 Markdown，标签与正文之间留空行。

</div>
```

`article` 和画布片段会把这些内容移入信息窗的「注释」页，不计入正文字数。没有注释块时不生成页签。普通 `page` 原位显示；完整 HTML 作品保留自身结构。

局部诗歌使用 `<div class="poem">`，整篇诗歌使用 `typography: poem`。

## 独立页面与检测页

```bash
npm run page -- about
```

编辑 `source/about/index.md`，访问 `/about/`。独立页面进入最近更新，没有导航分类时进入 `/misc/`。需要固定入口时，在主题配置的 `nav_primary` 增加 `label` 和 `path`；先创建页面，再添加链接。

`/appearance/` 是外观实验室，可切换真实布局、对齐、配色与排版并复制元数据，刷新恢复默认。`/mtf/` 是页面视觉样例，HTML 和专属样式都在 `source/mtf/`，主题没有为它设专用页眉开关。二者不增加专属分类或路由类型。

## 自由作品与完整 HTML

```bash
npm run canvas -- --slug night-journey "夜行"
mkdir -p source/_posts/works
mv source/_posts/night-journey.md source/_posts/works/
```

普通 Markdown / HTML 片段可以引用专属资源：

```yaml
layout: canvas
styles: [/works/night-journey/style.css]
scripts: [/works/night-journey/main.js]
```

完整文档保存为 `.html`，不要粘入 `.md`。例如 `source/_posts/works/night-journey.html`：

```html
---
title: 夜行
date: 2026-11-12
permalink: night-journey/
layout: canvas
canvas_base: /works/night-journey/
disableNunjucks: true
---
<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><link rel="stylesheet" href="style.css"></head>
<body><h1 id="opening">开篇</h1><p>作品正文。</p></body>
</html>
```

素材放在 `source/works/night-journey/`。完整文档自行引用内部 CSS / JS，不通过外层 `styles` / `scripts` 注入。

完整 HTML 放入 sandbox iframe，不授予同源访问。主题注入 `canvas-bridge.js`，通过限定消息来源与类型的 `postMessage` 同步目录跳转、当前章节和阅读进度；作品内部的滚动不与外层文档进度混算。片段则直接使用共享正文容器。

### 「喘息印钞」的来源与维护

正文位于 `source/_posts/works/4001.html`，网址保持 `/scp-cn-4001/`，归入作品；元数据标题「喘息印钞」与内部标题「传汐引潮」分别保留。

素材目录 `source/works/scp-cn-4001/` 包括 `style.css`、`script.js`、标题与标识 SVG、四张背景 SVG，来源为 <https://mrpasserbyglyn.github.io/cxyc/>。作品内保留 OXYGENNINE × MRPASSERBY 署名与 CC BY-SA 3.0 授权说明。插画仍来自原站 `illustrations/`，外链字体仍来自 ZeoSeven，需要网络加载。

作品脚本按导航、文字特效、章节行为、布局测量、滚动帧和初始化排列。`SECTION_ACTIONS` 对应正文的 `data-act`；滚动合并到一帧，布局测量在尺寸或资源加载变化时重做。高度计数器的终章进入、退出依赖滚动方向，不要合并成同一个退出动作。作品自己的断点、动画和布局独立于主题。

## 首页、索引与统计

`source/_data/home.yml` 维护首页图片、替代文字、图注及 Markdown 介绍；站点名称与作者在根 `_config.yml`。社交地址位于主题配置 `social`；留空时显示禁用按钮。

首页保留整页居中的大标题、大图、热力图及四项概览。细项通过「阅读统计与栏目分布」展开。概览按内容宽度切换双栏和单栏，全年热力图不要求横向滚动；顶栏不显示「首页」二字。

- `/updates/`：文章、作品与独立页面，按最近修改时间排列；没有修改时间则取发布日期。
- `/archives/`：Hexo 文章归档，按发布日期排列，不包含独立页面。
- `/categories/`、`/tags/`：卡片索引；`taxonomy_per_page` 控制每页卡片数，`taxonomy_preview` 控制每卡预览篇数。完整列表按根配置 `per_page` 分页。
- `/misc/`：没有归入导航分类的文章与独立内容页，按发布日期倒序。

统计只包含本次构建中已发布的文章和独立内容页，不计索引、分页、草稿和 CSS / JS 等资源。中日韩文字逐字、其他语言逐词计数；不计代码、行号、注释块、脚本、样式和 HTML 标记。阅读时间按每分钟 300 字向上取整，单页最少 1 分钟。热力图按站点时区记录每页最近一次更新，不代表历史修订次数。

统计快照、字数和注释解析缓存在一次生成周期内复用，每次 `before_generate` 清空，预览连续修改也能更新。

## 代码从哪里读起

```text
_config.yml                        站点、网址、默认布局与分页
scaffolds/                         文章、画布、独立页和草稿模板
source/_posts/{notes,articles,reviews,works}/
source/_data/home.yml              首页内容
source/{appearance,mtf}/           检测页面及其专属 CSS / JS
source/works/                      作品素材
fonts-src/                         字体原文件，不发布
tools/build-fonts.py               字体分块与注册表生成
themes/iris-paper/
  _config.yml                      栏目、导航、社交和卡片分页
  layout/layout.ejs                站点外壳
  layout/{article,page,canvas}.ejs  三种内容布局
  layout/_partial/                 导航、信息窗、首页与索引组件
  scripts/                         分类关系、索引、统计、正文处理
  scripts/lib/documents.js         已发布内容筛选和日期排序
  source/css/                     按职责组织的样式
  source/js/                      导航、阅读及画布通信
  source/fonts/                   自托管字体分块
  test/                           单元、交互与真实构建测试
public/                            生成物，不直接编辑
```

站点外壳只有一份目录和一份信息窗：

```text
body[data-layout][data-alignment][data-palette][data-typography]
├─ header.site-header               首页标识、窄屏顶栏
├─ .site-layout
│  ├─ aside.site-rail
│  │  ├─ .rail-identity              宽屏标识
│  │  └─ details#site-menu           同一目录，宽屏常驻、窄屏抽屉
│  ├─ main#main-content
│  │  └─ article.content-page        标题、正文、可选文章页脚
│  ├─ details.post-info             仅 article / canvas
│  └─ footer.site-footer
└─ button.menu-backdrop
```

`data-layout` 是布局的唯一状态，不再同时维护多套布局 class。宽屏由同一 Grid 定义栏位和宽度，侧栏与信息窗用 sticky；窄屏与 canvas 共用 `compact.css`。目录和信息窗按真实可用视口高度限制，只有确实放不下时才滚动。

CSS 阅读顺序：`base.css`（变量、基础元素、滚动条）→ `layout.css`（骨架、尺寸、首页标识）→ `navigation.css`（导航组件与指针反馈）→ `pages.css`（标题、索引与首页概览）→ `prose.css`（正文与浮现）→ `info.css`（信息窗、页签、进度条）→ `presets.css`（排版与配色）。`compact.css` 在窄屏按媒体条件启用，canvas 则始终启用；`fonts.css` 是生成物。

CSS 每条声明独立一行，规则之间留空行；同一组件的基础、状态和响应式规则按职责归位，不在文件尾部叠加修补。生成的字体注册表仍由工具维护。

普通页面的断点为 **860px**。修改时同步外壳的 stylesheet media、`navigation.js` 的 matchMedia 及外观实验室的 media 切换。画布模式不以屏幕宽度决定导航形态。

桌面鼠标保留悬停展开、移出延迟 180ms 收起、点击固定展开和高亮反馈；触屏点击开合。抽屉互斥，支持外部点击、链接选择和 Esc 关闭；Esc 返回开关焦点。每次动画可从当前画面反向继续，退场结束才关闭 details。减少动态效果时直接完成状态切换。

正文保留逐段浮现，首屏直接显示；进度按真实滚动距离计算，底部 24px 内吸附到 100%，不可滚动时隐藏。宽屏进度贴合信息窗上缘，窄屏贴合顶栏下缘。文章根滚动条继续隐藏，其他可见滚动条跟随配色。

## 字体与图标

本地字体回退列表在 `base.css` 的 `--local-cjk`；正文和界面分别使用 `--serif`、`--UI-font`。`font-display: swap` 保证字体加载期间文字可读，字体替换可能引起行尾重排。

字体分为常用字 `core`、站内额外字符 `site` 和每 4096 码点一块的 `uXXXX`，由 `unicode-range` 按需加载。新增生僻字后：

```bash
python3 -m venv /tmp/ftvenv
/tmp/ftvenv/bin/pip install fonttools brotli   # 首次安装
/tmp/ftvenv/bin/python tools/build-fonts.py --site
```

不带参数会完整重建；`--css` 只生成注册表；传入 `GenRyu` 等名称片段只重建匹配字体的 core 和码位块。原字体目录和输出目录固定在脚本顶部，不要手工编辑 `fonts.css`。

Material Symbols Outlined 是自托管图标子集。模板调用 `_partial/icon` 并传入 `name`。新增图标需从 Google Fonts 取得包含全部所需名称的新版子集，覆盖 `MaterialSymbolsOutlined.woff2`；图标名列表按字母排序。其注册使用 `font-display: block`，避免连字名称短暂露出。

## 预览、测试与发布

```bash
npm run server          # http://localhost:4000/，修改后自动更新
npm run test:theme      # 含真实 Hexo 构建、分类、缓存及交互测试
npm run build           # 输出到 public/
```

修改主题配置后重启预览。移动文件、删除旧模板或改生成规则后，使用 `npm run clean && npm run build` 清除旧产物。

布局验收使用桌面、矮屏、手机，以及 **820×1180 / 1180×820** 平板竖横屏。检查首页、长文章、分类和未分类索引、画布与检测页：页面不横向溢出；足够高时目录无需内滚动；低屏和长大纲仍可到达末项；旋转后面板状态正确；主题、页签、动画、目录跳转与进度同步可用。文学段落 `0.75em`、三种宽度上限和标题圆点是固定排版约定。

发布前查看 diff 并运行测试和构建，再自行提交、推送到 `main`。GitHub Actions 的 [Publish website](https://github.com/flipiris/flipiris.github.io/actions) 会构建并发布到 <https://flipiris.github.io/>；build 和 deploy 都成功才表示部署完成。无需运行 `hexo deploy`，不要提交 `public/`、`node_modules/` 或 `db.json`。

如推送连接超时且本机代理正在运行，可用 `git -c http.proxy=http://127.0.0.1:7897 push`，不更改永久 Git 配置。

## 草稿

```bash
npm run draft -- --slug unfinished "未完成的文章"
npm run server -- --draft
```

草稿位于 `source/_drafts/`，默认不发布且已忽略未跟踪文件；已经提交的内容不会因忽略规则变成私密。准备公开时停止草稿预览，执行 `npx hexo publish unfinished`，再把文章移入对应栏目目录，检查日期和 permalink 后发布。
