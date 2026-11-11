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

编辑 `source/about/index.md`；页面网址为 `/about/`。独立页面不会自动出现在首页文章列表。

需要导航入口时，在 `themes/iris-paper/_config.yml` 的 `menu` 列表中增加：

```yaml
  - label: 关于
    path: /about/
```

先创建实际页面，再添加链接。修改主题配置后，重启本地预览服务。

## 新建自由排版的多媒体作品（画布）

```bash
npm run canvas -- --slug night-journey "夜行"
```

编辑 `source/_posts/night-journey.md`。它会进入首页和归档，但使用 `layout: canvas`，不套标题、版心和阅读样式；无论屏幕宽窄，菜单都收进顶栏。旧的 `layout: work` 仍可使用，等同于 `canvas`。

作品可写 HTML，专属素材放在 `source/works/night-journey/`。在 front-matter 中按需添加：

```yaml
styles:
  - /works/night-journey/style.css
scripts:
  - /works/night-journey/main.js
```

只填写已经创建的资源路径。主题结构和样式文件的分工见 `themes/iris-paper/README.md`。

## 三种模板、版式与配色

| `layout` | 用途 | 特点 |
| --- | --- | --- |
| `post`（默认） | 文章 | 纸张容器、阅读进度条、信息窗、逐段浮现 |
| `page` | 独立页面 | 极简框架：无纸张、无进度条、无信息窗 |
| `canvas` | 自由作品 | 正文原样输出；无论屏幕宽窄，菜单都收进顶栏 |

在 front-matter 中调用版式与配色（均可省略）：

```yaml
typography: literary   # literary 文学创作（首行缩进、段间不留空）| poem 诗歌（整体居中、诗行左对齐）
palette: mist          # rose（默认）| mist | bamboo | sepia | ink
```

文章分类写 `categories: [文章]`；侧栏的分类为 文章、评论、作品，可在 `themes/iris-paper/_config.yml` 的 `nav_categories` 中增改。

信息窗第二页：在正文中写一个 `note` 块，内容就会出现在信息窗的「注释」页，而不会显示在正文里；没有这个块则不显示第二页。块内的 Markdown 需要与 HTML 标签之间各空一行：

```html
<div class="note">

**作者注**：这里的 Markdown 会被渲染。

</div>
```

诗歌也可以嵌在普通文章里：`<div class="poem">` 包起来的诗行会整体居中、行内左对齐。

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
