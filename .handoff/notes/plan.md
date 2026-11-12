# 重构方案（未执行）

用户原话要点（第 3 条消息）：

> 审阅全部代码及其逻辑，优化现有代码品味与效率、代码文件的条理与层次、页面的 html 结构，
> 减少多余的交互与多余的滑动（如 side-nav 在许多屏幕高度足够的情况下受其自身高度限制而需要用户滑动以阅览全部内容）。
> 最终代码简洁、高效、清晰、便于维护，不要过多使用代码注释，而应最终形成一份总的文档。
> 不要修改我明确要求的排版需求如文学排版时的段间距。网站尚未上线，可以大刀阔斧。
> 今后用文件夹作为分类的辨识方式。「喘息印钞」应作为布局特殊的「作品」而非「其他页面」。
> mtf 展示页与外观实验室只是调试页，不需要新分类栏与专门的 url 类。
> 打磨 UI：进度条与信息窗衔接、窄屏侧栏与顶栏的 1px 空隙、除侧栏外滚动条适配主题、宽屏在平板触屏上可左右滑。

## 一、必须保住的东西（改坏了就是回归）

1. **文学排版段间距 `0.75em`**（`presets.css:100` `[data-typography="literary"] .article-content p { margin: 0.75em }`）——
   用户点名不许动。
2. 标题圆点用 `::after` 方案（本轮成果，`pages.css:50`）。
3. 三档阅读宽度：article 纸张 700px、page 800px、`#main-content` 上限 1000px。
4. 首页视觉：页眉居中大标题、大图、全站概览（热力图 + 四项数值 + 可展开细节）。
5. 五套配色（rose / tech / wanderers / ink / sepia）与四套版式（standard / enhanced / literary / poem）。
6. `.html` 完整文档走 sandbox iframe + `canvas-bridge.js` 同步目录与进度。
7. 所有现有 permalink 不变（`scp-cn-4001/`、`scherzo/`、`why-Takopi-fails/`、`once-upon-a-life-as-cat/`、`pool-fictional/`）。

## 二、目标结构

### 分类：目录即分类

- `source/_posts/works/`、`reviews/`、`notes/` 三个目录决定分类，front-matter 的 `categories` 由目录覆盖，
  用户今后不必再填。
- 三处配置合并为**一处**（主题 `_config.yml` 的 sections 列表：目录名 / 显示名 / 图标 / 顺序），
  分类 URL 与 `category_map` 由它派生。
- 删除：`nav_misc` + `/misc/` 生成器 + `layout/misc.ejs`；
  删除 `legacy-category-urls` 生成器（32 行旧 URL 跳转）；删除 `wanderer`→`wanderers` 与「随笔」→「笔记」的历史归一。

### 内容归类调整

| 文件 | 动作 |
| --- | --- |
| `source/_posts/4001.html`（喘息印钞） | 迁入 `source/_posts/works/`，`layout: post` + `presentation: canvas` → 只写 `layout: canvas`。它就是「布局特殊的作品」 |
| `source/_posts/调笑令.md`、`九尾猫漫游录.md` | 迁入 `works/`，删掉 `categories` |
| `source/_posts/蓄水池：叙事作品.md` | 迁入 `notes/`，删掉 `categories` |
| `source/_posts/耳光响亮……塌陷.md` | 迁入 `reviews/`，删掉 `categories` |
| `source/mtf/index.md`、`source/appearance/index.md` | **保留在原地**，不建分类、不进导航；`header: mtf` 与 `mtf.css` 这套专属页眉按用户意思可以撤（待确认） |

### 布局：五种名字收敛为三种

`article`（纸张 + 信息窗）/ `page`（无纸张）/ `canvas`（通栏 + iframe）。
删除 `post` / `work` / `presentation` / `article-page` / `plain-page` 等全部兼容层；
`page_layout()` 与 `_partial/content-page.ejs` 里的分支随之消失。

### DOM：导航与信息窗各只渲染一次

现在同一份导航在 `#mobile-menu` 和 `#side-nav` 里各输出一遍，信息窗也是 `details` 双份。
目标：**单实例**，靠 CSS 在宽/窄之间切换形态（宽屏常驻吸附，窄屏变抽屉），
抽屉用 `aria-expanded` + CSS transition 取代 WAAPI 状态机（预计 `navigation.js` 191 → 约 60 行）。

### 布局引擎：fixed + 100vw 手算 → 一套 CSS Grid

宽屏用 grid 三列（侧栏 / 正文 / 信息窗），`position: sticky` 取代 `position: fixed`，
彻底去掉 `--nav-axis` / `--nav-left` / `--content-left` 这一族 `100vw` 计算，横向滑动问题随之消失。
高度改为 `min(内容高, 100dvh - 上下留白)`：只在真的放不下时才出现滚动条。

### CSS 分文件

按「职责」切，不再按历史追加顺序：

```
base.css        变量、reset、字体、滚动条（含全站主题化滚动条）
layout.css      站点骨架、网格、页眉页脚、首页框架
nav.css         导航树、侧栏、抽屉、社交与全站信息
info.css        信息窗、进度条、页签、大纲
prose.css       正文排版 + 阅读进度 + 逐段浮现
pages.css       标题、列表、分类卡片、分页、首页概览
presets.css     配色与版式预设
fonts.css       生成物，不动
```

### JS 收敛

- `navigation.js`：只保留 开关 / Esc / 点击外部 / 焦点回归。
- `appearance.js`：删掉模拟布局的 15 行（改为只切换 palette / typography）。
- `reading.js`：保留进度、大纲高亮、逐段浮现、页签；去掉重复的 `getComputedStyle` 调用。
- `site_stats()` 加构建期缓存；`split_note()` 每页只解析一次。

### 文档

根 `README.md` + 主题 `README.md` + `themes/iris-paper/docs/scp-cn-4001.md` → **合并成一份总文档**
（写作流程、元数据、目录分类、画布作品、结构约定、构建测试）。
代码里只保留「非显而易见」的注释（例如 `::after` 圆点的居中算式、`overflow: clip` 的必要性）。

## 三、施工顺序（建议）

1. **先修截图工具**（见 `README.md` 第五节），拍下改动前基线：`/`、`/scherzo/`、`/categories/`、`/scp-cn-4001/`
   在 1440×900 / 1440×700 / 768×1024 / 390×844 四档的样子。
2. 内容搬家 + 分类单一化（数据层，风险最低，跑 `npm run build` 就能验）。
3. 布局引擎换成 Grid（CSS 层，最伤筋动骨；改完逐档比对基线）。
4. DOM 单实例化 + JS 收敛（`layout.ejs` 与 `navigation.js` 同时改）。
5. UI 细节三件套：1px 缝、进度条上缘、全站滚动条主题化。
6. 清理死代码、删兼容层、清注释。
7. 合并文档；跑 `npm run test:theme`（现有 8 个测试文件里，`build-integration` / `navigation` /
   `page-layout` 会因 DOM 与类名变化需要重写，`site-stats` / `content-blocks` / `folder-categories` /
   `navigation-data` 主要改断言的输入路径）。

## 四、开工前需要用户确认

1. `4001.html` 落盘位置改为 `source/_posts/works/4001.html`、`layout` 只留 `canvas`——可以吗？
2. 删掉 `/misc/` 整条链路（导航里的「其他页面」、`misc.ejs`、`misc-index` 生成器）——确认？
3. mtf 页的 `header: mtf` 专属页眉 + `mtf.css` 是否撤掉？（用户说它只是调试页，不必为它搭基础设施）
4. 截图工具：允许往 `/tmp` 装一份 puppeteer（不进仓库依赖），还是接受「改完由用户自己在浏览器里验收」？
