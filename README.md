# 无人野水荒湾

个人创作站，Hexo 8 + 自建主题 Iris Paper。线上地址 <https://flipiris.github.io/>，本地预览 <http://localhost:4000/>。

这一份是入口文档：说明站点怎么用、内容放在哪、发布前做什么。更细的字段与命令见 [参考速查](docs/reference.md)，模板、脚本与样式如何协作见 [代码逻辑](docs/code-logic.md)。

## 开始

```bash
npm install
npm run server      # http://localhost:4000/，修改后自动刷新
npm run test:theme  # 主题测试，含真实 Hexo 构建
npm run build       # 输出到 public/
```

修改根 `_config.yml` 或主题 `_config.yml` 后重启预览。移动文件、改生成规则或删除旧模板后，用 `npm run clean && npm run build` 清除旧产物。

## 内容放在哪

```text
source/
  _posts/                 文章与作品，目录即分类
    notes/                笔记，未指定排版时使用 enhanced
    articles/             文章
    reviews/              评论
    works/                作品，含 canvas
  _data/home.md           首页介绍与配图
  appearance/index.md     外观实验室页面
  attachments/            单页资源与作品素材，按页面分目录
    home/home.css
    appearance/style.css
    appearance/script.js
    scp-cn-4001/
```

`source/_posts/` 下的目录决定分类，front matter 里的 `categories` / `category` 不参与归类。目录与显示名、图标、导航顺序的对应关系只写在主题 `_config.yml` 的 `sections` 里：

```yaml
sections:
  - folder: notes
    label: 笔记
    icon: edit_note
  - folder: works
    label: 作品
    icon: palette
```

`notes/reading/book.md` 会形成「笔记 → reading」分类链，地址是 `/categories/notes/reading/`。没有归入导航分类的文章与独立页会进入 `/misc/`。

`source/attachments/` 是发布到 `/attachments/` 的附件目录，不是分类，也不是文章目录。名字与 `source/_posts/works/` 的「作品」分类刻意区分开。

## 写一篇

```bash
npm run new -- --slug first-essay "第一篇文章"
mkdir -p source/_posts/articles
mv source/_posts/first-essay.md source/_posts/articles/
```

编辑文件，在元数据后空一行写正文。建议始终填写固定网址，之后移动目录也不会改变链接：

```yaml
---
title: 第一篇文章
date: 2026-11-12 10:00:00
permalink: first-essay/
layout: article
tags: [阅读]
---
```

新建独立页面用 `npm run page -- about`，文件在 `source/about/index.md`，访问 `/about/`。新页面会进入最近更新；没有导航分类时进入 `/misc/`。需要固定入口时，在主题配置的 `nav_primary` 增加 `label` 与 `path`。

网址使用干净的静态路径：根 `_config.yml` 已关闭 `pretty_urls.trailing_index` 与 `trailing_html`，`permalink: appearance/` 生成 `/appearance/`，不再出现 `/appearance/index.html` 或 `/appearance.html`。

## 布局与画布

| `layout` | 外观 | 标题 | 信息窗 | 文章页脚 | 站点页脚 |
| --- | --- | --- | --- | --- | --- |
| `article` | 700px 阅读纸张 | 有 | 有 | 有 | 有 |
| `page` | 800px 无纸张页面 | 有 | 无 | 无 | 有 |
| `canvas`（Markdown） | 800px 最简容器 | 无 | 有 | 无 | 有 |
| `canvas`（完整 HTML） | 顶栏 + 铺满剩余空间 | 无 | 有（顶栏抽屉） | 无 | 有 |

`canvas` 的具体形态由源文件决定：`.md` 片段进入 800px 容器；以 `<html` 开头的完整文档进入 sandbox iframe，外层保留顶栏与 `site-footer`，iframe 铺满两者之间的全部空间。

### Markdown 画布

```yaml
---
title: 夜行
date: 2026-11-12
permalink: night-journey/
layout: canvas
typography: literary
---
正文从这里开始。
```

需要页面专属 CSS / JS 时放在 `source/attachments/night-journey/`，在元数据里引用：

```yaml
styles: [/attachments/night-journey/style.css]
scripts: [/attachments/night-journey/main.js]
```

### 完整 HTML 画布

完整文档保存为 `.html`，不要粘进 `.md`。正文从 `<html` 开始，主题会为它注入素材基址与 `canvas-bridge.js`：

```yaml
---
title: 夜行
date: 2026-11-12
permalink: night-journey/
layout: canvas
canvas_base: /attachments/night-journey/
disableNunjucks: true
---
<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><link rel="stylesheet" href="style.css"></head>
<body><h1 id="opening">开篇</h1><p>作品正文。</p></body>
</html>
```

作品自己的 CSS / JS 继续用相对路径引用，`canvas_base` 负责让这些路径在 iframe 里解析到 `/attachments/night-journey/`。完整文档在 sandbox iframe 中运行，不授予同源访问。顶栏左侧的目录与右侧的信息窗以抽屉形式打开。

「传汐引潮」是现有示例：正文在 `source/_posts/works/4001.html`，网址保持 `/scp-cn-4001/`，素材在 `source/attachments/scp-cn-4001/`，外部插画与字体仍需联网。

## 首页与索引

- 首页介绍与配图在 `source/_data/home.md`，图片的 `title` 会变成图注，首图宽屏靠右浮动。
- `/updates/` 按最近修改时间列出文章、作品与独立页面。
- `/archives/` 是按发布日期的文章归档。
- `/categories/`、`/tags/` 是卡片索引，分页数量由主题配置的 `taxonomy_per_page` 与 `taxonomy_preview` 控制。
- `/misc/` 收录没有归入导航分类的内容页。
- `/appearance/` 是外观实验室，可切换真实布局、对齐、配色与排版，并复制元数据。

## 资源与附件

主题通用样式在 `themes/iris-paper/source/css/`；只服务单个页面的资源统一放在 `source/attachments/`：

- `attachments/home/home.css`：只在首页加载。
- `attachments/appearance/style.css`、`attachments/appearance/script.js`：外观实验室。
- `attachments/scp-cn-4001/`：作品素材。

页面专属 CSS / JS 通过元数据 `styles` / `scripts` 引用；完整 HTML 作品自行在文档里引用。不要把单页样式再塞回主题的 `css/` 目录。

## 代码约定

代码文件不写解释性注释。页面 HTML 可以在分块处保留目录性质的注释，例如「导航元素」「主内容区域」，方便定位；不要写与维护无关的说明性长注释。

主题代码的分层、生成器与测试说明集中在 [代码逻辑](docs/code-logic.md)。注释之外的维护规则、字段和常见操作见 [参考速查](docs/reference.md)。

## 发布

```bash
npm run test:theme
npm run build
git status
```

确认测试与构建通过、`public/` 与 `db.json` 没有进入提交后，再提交并推送 `main`。GitHub Actions 的 [Publish website](https://github.com/flipiris/flipiris.github.io/actions) 会构建并发布到 <https://flipiris.github.io/>；build 与 deploy 都成功才算部署完成。不要运行 `hexo deploy`。

如推送连接超时且本机代理正在运行，可用 `git -c http.proxy=http://127.0.0.1:7897 push`，不要改永久 Git 配置。
