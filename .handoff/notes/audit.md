# 代码勘察：问题清单

行号基于中断时的未提交工作区。规模参考（非字体代码）：

```
CSS   base 222 · navigation 417 · narrow 247 · pages 861 · reading 496 · presets 164 · mtf 196   = 2603 行
JS    navigation 191 · reading 154 · appearance 38 · canvas-bridge 27                             =  410 行
Hexo  content-blocks 87 · folder-categories 23 · navigation-data 136 · site-stats 102 · lib/documents 24 ≈ 348 行
测试  8 个文件                                                                                    ≈  830 行
模板  layout/*.ejs 共 26 个（多数 1–7 行）
```

## 1. 布局系统：平板/触屏左右滑的根源

`base.css:88-93` 用 `100vw` 手算三组自定义属性，`navigation.css` 与 `pages.css` 再据此

```css
--frame-width: min(var(--content-width), var(--frame-max-width), calc(100vw - 2*var(--nav-width) - 4*var(--layout-gutter)));
--nav-left: calc((100vw - var(--frame-width) - 2*var(--nav-width)) / 4);
--nav-axis: calc(var(--nav-left) + var(--nav-width) / 2);
--content-left: calc(var(--nav-left) + var(--nav-width) + var(--content-gap));
```

而侧栏、信息窗、顶栏全部 `position: fixed`（`navigation.css:1-20`、`reading.css:290-300`）
按上述值硬定位。`pages.css:437` 起 `.layout-page` 又**另起一套** CSS Grid 定位同一批元素。
两套系统并存 = 双倍维护 + `100vw` 在触屏（滚动条不占位）下与实际可视宽不一致 → 横向可滑。

`--sidebar-height: 85vh` / `--rail-height: 80vh`（`base.css:45-46`）与真实可用高度无关：
侧栏内容不多也要在 85vh 处被截断，用户点名「屏幕高度足够却要滚」。

## 2. CSS 里的补丁式重复

| 重复项 | 位置 |
| --- | --- |
| `.post-item` 定义两遍 | `pages.css:87` 与 `pages.css:613` |
| `.post-item a` 定义两遍 | `pages.css:106` 与 `pages.css:618` |
| `.activity-calendar` 定义两遍 | `pages.css:331` 与 `pages.css:584` |
| `.site-identity.site-identity-hero { display: grid }` 纯重复 | `pages.css:775`（前文 `:504` 已定义） |
| `.activity-months` / `.activity-months span:last-child` 覆盖 | `pages.css:463`、`pages.css:790` |
| `.info-tabs` 等分散在 reading.css 中段，与其余信息窗样式不连续 | `reading.css:403` |

`navigation.css` 尾部同样是补丁区：`:354` `.nav-tree{gap:2px}`、`:356` `.nav-tree a{padding-block:5px}`、
`:364` 又一整段强调色覆盖，与 `:95/:106` 处的原定义冲突。
`presets.css` 里 `standard`（`:96`）、`literary`（`:100`）、`enhanced`（`:102`）三套版式规则
被 sepia 配色（`:71-90`）从中间劈开，阅读顺序混乱。

## 3. 交互与 JS

- `navigation.js` 191 行维护 hover 展开 / `pinned` / `hoverOpened` / 180ms 延时收起 / WAAPI 进退场
  的状态机（`:40-165`）。而宽屏根本不需要开合（常驻），窄屏只有点击与 Esc 两种真实需求。
- `appearance.js:11-24` 用 15 行 toggle 去模拟布局切换：同时改 8 个 class + 4 个 dataset + `link.media` + `color-scheme`，
  是 `layout.ejs` 里那套「兼容类」的下游债。
- `navigation.js:29-58` `shade()` 手动做 backdrop 淡入淡出，CSS transition 可替代。

## 4. DOM 结构冗余

- 导航渲染**两遍**：`layout.ejs:71-79`（`#mobile-menu` 抽屉内）与 `layout.ejs:88-96`（`#side-nav` 侧栏内），
  同一份 `_partial/navigation.ejs` + `site-stats` + `social-links` 各输出一次。
- 信息窗同理：`top-nav` 里一个 `details.post-info`，宽屏又是同一个 `details.post-info`，
  由 `narrow.css:128` / `reading.css:290` 互相覆盖成两种形态。
- 类名叠加：`article.content.content-page.page-frame.article-page`（`_partial/content-page.ejs:1`），
  其中 `plain-page` / `article-page` / `page` / `article` / `canvas` 是历史兼容层。
- 布局名有五种（`article`/`post`/`work`/`canvas`/`page`）却只表达三种形态，
  转换逻辑散在 `content-blocks.js:57-62` 与 `layout.ejs:3-4`。
- `layout/article.ejs` 与 `layout/work.ejs`、`layout/post.ejs`、`layout/canvas.ejs` 四者内容近乎相同。

## 5. 分类配置三处重复

| 位置 | 作用 |
| --- | --- |
| 根 `_config.yml` `category_map` | 中文分类 → 英文 URL |
| 主题 `_config.yml` `folder_categories` | 目录 → 分类名 |
| 主题 `_config.yml` `nav_categories` | 侧栏顺序 + 图标 |

用户明确「今后直接用文件夹作为分类的辨识方式，不想每次填元数据」，三处应合并为一处。
`navigation-data.js:36-48` 里 `nav_sections()` 还要在两套配置间做对齐。

## 6. 性能

- `site_stats()`（`site-stats.js:34-72`）**无缓存**，每个页面渲染时被调用两次
  （`layout.ejs:76` 抽屉、`layout.ejs:92` 侧栏），每次全量遍历所有文档并 `countWords()` 重新解析 HTML。
  文档数一多就是 O(页面数 × 文档数) 的重复解析。
- `split_note()`（`content-blocks.js:20`）在 `post-info.ejs:2` 与 `post-content.ejs:1` 各解析一次同一篇正文。

## 7. UI 细节（用户点名）

| 现象 | 出处 |
| --- | --- |
| 窄屏侧栏与顶栏之间 1px 缝 | `narrow.css:89` `.mobile-menu-body { top: calc(100% + 1px) }` |
| 进度条与信息窗衔接生硬 | `reading.css:262-266` `.read-progress-rail { inset: 0 var(--nav-radius) auto; z-index: 1 }`——浮在内缩位置的一条线，不是卡片的上缘 |
| 除侧栏外滚动条未适配主题 | 只有 `navigation.css:74-90` 给 `.side-nav-content`/`.mobile-menu-body` 写了 `scrollbar-color`；`.post-info-body`（`reading.css:308`）、`pre`（`reading.css:82`）、页面根滚动条都没有 |
| 文章页滚动条被整体隐藏 | `base.css:66-72` `html.kind-post{scrollbar-width:none}` 是有意的（用进度条替代），可保留 |

## 8. 死代码 / 过度设计

- `layout/_partial/navigation-tree.ejs`（19 行，递归树）**无任何模板引用**。
- `legacy-category-urls` 生成器（`navigation-data.js:104-135`，32 行跳转页）只为未上线前的旧 URL 服务。
- `misc-index` 生成器 + `layout/misc.ejs` + `nav_misc`：「其他页面」整条链路，用户已要求撤掉。
- `presets.css` / `content-blocks.js` 里的 `wanderer` → `wanderers` 映射（`content-blocks.js:52`）同样是兼容债。
- README 里大量「兼容旧 `post` / `work`」「原 `.article-page` 保留为兼容类」的说明，都在描述本可删除的东西。
