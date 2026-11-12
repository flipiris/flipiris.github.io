# 当前接手状态（2026-11-13）

原交接的“大规模重构未开工”已经过时。本轮实施与验收已完成，所有代码在工作区，尚未 commit / push / 发布。总维护文档为根 README.md。

## 用户最新要求

- 动画和桌面鼠标交互必须保留，包括悬停展开、180ms 延迟收起、点击固定展开。
- 保留 `/misc/`，目录决定分类；「喘息印钞」是 canvas 作品。
- 平板使用 820×1180 / 1180×820，横竖屏正常；首页顶栏不要“首页”二字。
- 文学段落 `margin: 0.75em`、标题 `::after` 圆点及固定 permalink 不变。
- 五套色卡的标题层级、粗体、斜体必须易区分；既有 CSS 也统一展开声明、按职责组织。
- 当周额度剩余 1% 或以下立即停止并交接。最近一次读取为剩余 3%；用 `mcp__codex_app.get_usage_limits` 的 secondary.usedPercent 判断（剩余 = 100 - usedPercent）。

## 已实施

1. 文章迁入 `_posts/{notes,reviews,works}`；根 `default_layout: article`。主题 `sections` 是目录、标签、导航顺序及英文 URL 的唯一配置源，分类忽略 front-matter。四个原栏目保留；未分类入口、生成器、模板均保留。
2. `layout.ejs` 单实例导航和信息窗，`data-layout` 为唯一布局状态，宽屏统一 Grid + sticky；窄屏与 canvas 共用 compact.css。取消与可用高度不符的 vh 截断，不用全局 overflow-x:hidden 掩盖问题。
3. 样式分为 base/layout/navigation/pages/prose/info/presets/compact/fonts；清理覆盖式重复、旧布局名与死模板，保留动效与鼠标状态机，增加 aria-expanded。
4. 信息窗进度条用卡片同形裁切容器，填充仍为 2px；窄屏抽屉 top 与顶栏边缘一致；主题化全部可见滚动条。
5. 统计快照、字数与注释解析按生成周期缓存；before_generate 清空。reading 缓存大纲偏移、同步 hidden 页签状态。
6. MtF 样例和外观实验室的 CSS/JS 与样例同目录，不在主题设专属页眉/布局类。实验室仍检测全部布局、对齐、配色、排版。
7. 作品脚本删除动态注入初始化与旧媒体查询 API 分支，保持所有特效；完整作品 main 改为语义化 main#story-content，正文文本未改。字体工具移除无用计算、减少重复扫描、关闭字体文件。
8. 根 README.md 已合并写作、架构、行为、字体、作品来源授权和验证说明；删除主题 README 与单独的作品说明。CI 在构建前运行主题测试。
9. 最新色卡：heading-1/2/3、strong、emphasis 五种角色独立设值；修正 wanderers 覆盖全部标题的规则。正文角色两两 Lab ΔE76 ≥25，角色及常规界面文字在 paper/bg 上对比度 ≥4.5；已有作品 CSS 的 20 条单行规则也已展开。

## 有效证据

- 最新 `npm run test:theme`：63/63 通过（包含色卡区分、对比度、CSS 写法、外观预览、悬停与触屏、重复生成缓存）。日志 `/tmp/iris-tests.log`。
- 最新 `npm run build` 成功，之前也做过 clean build。日志 `/tmp/iris-build.log`。
- `/tmp/iris-final-check.cjs` 验证五篇正文、标题、作者和 permalink 保留；27 个生成页面单实例导航、ID 唯一、本地链接与资源存在。
- 字体工具已用 `/tmp/ftvenv/bin/python` 在临时目录实际生成五种 site 字体与 fonts.css，逐一核对字符覆盖，未重写仓库字体产物。
- 浏览器已检查：820×1180 / 1180×820 的首页、文章、分类、misc、诗歌、笔记无页面横向溢出；横屏目录无需内滚动；390px 长标题与 MtF 样例；1440×700 的 sticky、进度条与侧栏。
- 画布大纲实际跳到 part4-title，iframe 章节顶部约 0px，外层高亮 #part4-title，进度 0.8268；iframe 不授同源。

## 最终验收与后续

- 五套色卡已在外观实验室逐一查看真实增强排版；h1/h2/h3/strong/em 的浏览器计算颜色与独立角色值一致。wanderers 不再把增强标题统一覆盖成金色。
- 820→1180→820 的旋转会恢复宽屏常驻面板、关闭窄屏面板并清除遮罩；860px 使用 compact，861px 使用 Grid。视口变化后媒体事件需要一帧分发，最终 DOM 已核实为正确状态。
- 1440px 首页标题中心约 720px、只有一份导航，目录无内滚动，顶栏文本为空。浏览器 viewport 已 reset，预览 tab 已保留，已调用 completion_summary。
- 根 README.md 已覆盖新增色卡角色与 CSS 写法；当前没有已知未完成的本轮验收项。后续由用户阅览结果、决定是否提交与发布，不要擅自 push。
- 最后一次额度读取为周剩余 3%；后续若继续接手，仍遵守剩余 ≤1% 时停工交接的要求。

## 预览与现有进程

- 本机已有 4010 静态服务，浏览器可访问；本轮尝试启动时返回“端口占用”，所以本轮没有新启动成功的服务。
- 4000 是用户自己的 Hexo server，不得停止。根/主题配置改动后该服务可能需要重启才能加载配置。
- 现有 cua_repl 会话已初始化，可按其文档直接继续；若上下文被压缩，应先 rewriteDocumentation。
- 施工前六个修改文件（标题圆点、base 变量等）已保留并整合，不能整体恢复到 HEAD。

---

以下是原会话的历史交接，仅供追溯，**当前状态以上文为准**。

# 交接说明（给接手的 agent）

会话在**大规模重构开工前**被中断。此处保存了中断时的全部成果、勘察结论与施工方案。
工作区就是 `/Users/flipiris/website`，代码都在原地，未提交、未推送。

## 一、现在仓库是什么状态

`git status` 有 6 个已修改文件，**分属两批，不要混为一谈**：

| 批次 | 文件 | 内容 | 补丁 |
| --- | --- | --- | --- |
| A. 上一轮会话遗留（不是本次改动） | `themes/iris-paper/source/css/base.css` | 变量微调：`--nav-blur` 18→15px、`--sidebar-height` 75→85vh、`--motion-*` 时序、`--glass-tint` 15%、`--local-cjk` 去掉 `Noto Serif CJK SC`，并删了几段注释 | `changes/pre-existing-base-css.patch` |
| B. 本轮已完成 | `layout/_partial/page-title.ejs`、`source/css/pages.css`、`source/css/presets.css`、`README.md`、`test/page-layout.test.js` | 标题圆点改为 `::after` 方案，见下节 | `changes/title-dot.patch` |

`npm run test:theme` 当前 **54/54 通过**。没有 commit，没有 push。

## 二、批次 B 到底改了什么（唯一验收过的成果）

用户否掉了旧写法（把最后一个字包进 `<span class="title-end">` + `inline-flex`），
要求改用「标题自己的 `::after` 生成圆点，`vertical-align: bottom`」这一种写法。

- `layout/_partial/page-title.ejs`：只剩一行，`<h1 class="page-title"><%= String(title || '').trimEnd() %></h1>`；
  删掉 `Intl.Segmenter` 与 `span.title-end`，标题回到**单一文本节点**。
- `source/css/pages.css`：`.title-end` 与 `.title-end::after` 整块删除，换成
  `.page-header .page-title::after`（`inline-block` + `vertical-align: bottom` +
  `margin: 0.5em 0.25em`，行高 1.5、圆点 0.5em，于是圆心正好落在行中线）。
- `source/css/presets.css`：wanderers 配色的选择器同步为 `body[data-palette="wanderers"] .page-header .page-title::after`。
- `test/page-layout.test.js`：原「最后一个字单独成 span」的两条断言，改为「h1 没有子元素 + 转义 + 新 CSS 规则」。
- `README.md`（主题内）：对应说明改写。

已知取舍（用户已接受）：圆点与末字之间没有 no-break 约束，标题排满一行时圆点可能单独落到下一行。
截图验证：**没有做**。原因见第五节。

## 三、大重构：已勘察完毕，方案已定，一行没写

用户第 3 条消息要求：全面审阅代码，优化代码品味与效率、文件条理与层次、HTML 结构；
砍掉多余交互与多余滚动；少写注释、最终只留一份总文档；**不动文学排版的段间距**；
并明确「网站未上线，可以大刀阔斧」。

- 逐行读完并定位到的具体问题 → `notes/audit.md`（全部带 `文件:行号`）
- 施工方案、改造后的目标结构、待用户确认项 → `notes/plan.md`

**接手时请先读这两份，再决定是从头施工还是只挑其中几项。**

## 四、工具与本地环境

```bash
cd /Users/flipiris/website
npm run build        # 生成 public/
./.handoff/tools/serve.sh   # 起 http://127.0.0.1:4010 静态服务（已在跑，PID 见下）
npm run test:theme   # 主题测试（54 项）
npm run server       # Hexo 预览，端口 4000
```

中断时仍有进程在跑，若接手发现端口占用，先关掉：

- `python3 -m http.server 4010 --bind 127.0.0.1 --directory public`（本会话启动的静态服务）
- 端口 4000 上另有一个 `hexo server`（**不是本会话启动的**，是用户自己的，别乱杀）

`tools/` 里是本会话自写的临时脚本，**都还不能用**，见下节：

- `cdp.mjs`：无头 Chrome CDP 封装（截图 / 量尺寸 / 点击）
- `baseline.mjs`：改动前后对照截图脚本，输出到 `/tmp/shots/`
- `dbg.mjs`：排查 Chrome 启动用

## 五、卡住的点：截图工具没跑通

环境里没有 puppeteer / playwright。自写 CDP 脚本时：

- 浏览器级 WebSocket（`/json/version`）能连上；
- **page 级 `Target.createTarget` / `Target.attachToTarget` 会挂住**；
- Chrome 侧 stderr 刷屏 `sandbox initialization failed` / `GPU process exited unexpectedly` /
  `Network service crashed`，`/json/new` 偶尔能返回 target 但页面不响应。

结论：在这台机器的沙箱约束下，无头 Chrome 起不干净。拍照之前**先修工具或换方案**：

1. 首选：往仓库外装一份（`npm i --prefix /tmp/shotenv puppeteer`），不改仓库依赖；
2. 或者直接用用户自己的 `hexo server`（:4000）+ 用户手动截图确认；
3. 不要在没建立对照基线的情况下动大手术——这次重构会大面积改布局，没有基线无法自证没改坏。

## 六、目录内容

```
.handoff/
├─ README.md                       本文件
├─ changes/
│  ├─ title-dot.patch              本轮成果（相对 HEAD）
│  ├─ title-dot.stat.txt
│  └─ pre-existing-base-css.patch  上一轮会话遗留的 base.css 改动
├─ notes/
│  ├─ audit.md                     代码勘察：问题清单（带行号）
│  └─ plan.md                      重构方案 / 目标结构 / 待确认项
└─ tools/
   ├─ cdp.mjs / baseline.mjs / dbg.mjs   截图工具（未跑通）
   └─ serve.sh                          起 4010 静态服务
```

清理方式：全部工作回到 `themes/` 源码前，直接 `rm -rf .handoff` 即可（它是未跟踪目录，
不影响 `git status` 之外的任何东西；如果不想让它出现在 `git status` 里，可自行加进 `.gitignore`）。
