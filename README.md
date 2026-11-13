# 无人野水荒湾

flipiris 的个人创作站，使用 Hexo 8 与自建主题 Iris Paper。线上地址：[flipiris.github.io](https://flipiris.github.io/)。

## 本地写作

```bash
npm ci
npm run server
```

打开 [localhost:4000](http://localhost:4000/)。修改内容、样式后会自动刷新；修改根目录或主题的 `_config.yml` 后，重启预览。

新建文章，再移进对应分类目录：

```bash
npm run new -- --slug first-essay "第一篇文章"
mkdir -p source/_posts/articles
mv source/_posts/first-essay.md source/_posts/articles/
```

在文件开头补上固定网址，后面空一行写正文：

```yaml
---
title: 第一篇文章
date: 2026-11-12 10:00:00
permalink: first-essay/
layout: article
tags: [阅读]
---
```

访问 `/first-essay/`。分类取决于文件目录，不读取 front matter 的 `categories` / `category`。

## 内容与配置放哪里

```text
_config.yml                         站点名称、网址、默认布局、分页
source/
  _posts/
    notes/                          笔记
    articles/                       文章
    reviews/                        评论
    works/                          作品与画布
    dev/                            开发文档、外观实验室
  _data/home.md                     首页介绍与配图
  attachments/<页面名>/             单页 CSS、JS、图片等素材
themes/iris-paper/
  _config.yml                       导航、分类显示名、社交链接、索引分页
  layout/                           页面模板
  scripts/                          构建时处理与索引
  source/                           通用样式、交互、字体
  test/                             主题测试
```

两份详细文档也作为文章发布：

- [参考速查](source/_posts/dev/参考速查.md)：写作字段、配置示例、画布、命令与排查；站内地址 `/reference/`。
- [代码逻辑](source/_posts/dev/代码逻辑.md)：生成链路、模板与样式职责、交互状态、测试和修改位置；站内地址 `/code-logic/`。
- [外观实验室](source/_posts/dev/外观实验室.md)：在 `/appearance-lab/` 试用布局、配色、排版与对齐。

## 调整菜单

编辑 `themes/iris-paper/_config.yml`：

- `nav_primary`：最近更新、页面一览等固定入口，按两列排列。
- `sections`：目录名、分类显示名、图标和菜单顺序。每项默认显示；加 `nav: false` 只隐藏菜单入口，不删除分类或分类页，也不把内容移入「其他页面」。
- `nav_misc`：收录未归入任何已配置分类的文章与独立页。
- `social`：支持 `github`、`wikidot`、`x`、`bangumi`，紧贴全站信息下方，以一道分割线分隔；空值显示禁用按钮。SCP 基金会与 Bangumi 使用本地官方图标。
- `taxonomy_per_page` / `taxonomy_preview`：分类、标签索引每页卡片数与每卡预览篇数。

例如，为开发文章保留分类而不占菜单高度：

```yaml
sections:
  - folder: dev
    label: 开发
    icon: code
    nav: false
```

这是单项示例，添加到现有 `sections` 列表，不要替换其他栏目。未在 `sections` 声明的子目录仍会自动形成分类，但不会自动增加菜单入口。

### 搜索与昼夜模式

宽屏时，搜索和昼夜按钮居中位于菜单顶部，并与索引入口以分割线分隔；860px 及以下移至顶栏右侧，在信息按钮左边。没有信息按钮的页面靠右排列。完整 HTML 画布始终使用顶栏工具。

- 点击搜索或按 `Ctrl / ⌘ K`，可查标题、标签与全文；空格分隔的关键词需要同时命中。关闭按钮、Esc 或点击弹窗外均可退出。
- 搜索索引由构建生成，首次打开时加载，不依赖外部搜索服务；已发布文章、作品和独立内容页参与搜索，草稿、附件和自动索引页不参与。
- 模式按「跟随系统 → 日间 → 夜间」循环，默认跟随系统；图标分别为自动亮度、太阳和月亮，并记住选择。系统模式实时响应系统外观变化；夜间使用 `ink`，日间保留页面亮色配色（原本为 `ink` 时使用默认亮色）。不改写文章元数据或完整 HTML 作品内部配色。

## 选择内容布局

| 布局 | 用途与效果 |
| --- | --- |
| `article` | 普通文章；700px 阅读纸张、标题、信息窗和文章页脚 |
| `page` | 独立页与索引；800px 无纸张页面，无信息窗和文章页脚 |
| `canvas` + Markdown | 800px 最简正文容器，无标题和文章页脚，保留信息窗 |
| `canvas` + 完整 HTML | sandbox iframe；窄屏隐藏页脚并铺满顶栏以下，宽屏保留紧凑页脚；目录与信息使用抽屉 |

配色 `palette` 与排版 `typography` 独立选择。笔记在未指定排版时使用 `enhanced`。完整 HTML 作品用 `.html` 保存，素材放在 `source/attachments/`，示例见参考速查。

## 检查与发布

```bash
npm run test:theme
npm run build
```

`public/` 是生成结果，`db.json` 是本地缓存，都不提交。移动、删除内容或修改生成规则后，使用 `npm run clean && npm run build` 清除旧产物。

本地检查通过后提交并推送 `main`，由 [Publish website](https://github.com/flipiris/flipiris.github.io/actions) 构建、发布到 GitHub Pages。build 与 deploy 两个任务均成功才算发布完成；不要使用 `hexo deploy`。

如推送超时且本机代理正在运行，可临时使用 `git -c http.proxy=http://127.0.0.1:7897 push`，不要改永久 Git 配置。

## 维护约定

主题通用能力放在主题目录；单页资源放在 `source/attachments/<页面名>/`，通过 `styles` / `scripts` 引用。JS、CSS、EJS 不添加解释性注释；页面 HTML 可保留分块目录注释。复杂机制集中写入代码逻辑文档，功能改动配套更新测试与说明。
