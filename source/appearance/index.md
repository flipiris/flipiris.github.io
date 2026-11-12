---
title: 外观实验室
layout: article
date: 2026-11-12
palette: rose
typography: standard
styles:
  - /appearance/style.css
scripts:
  - /appearance/script.js
---
<form class="appearance-controls" aria-label="外观预览">
  <label>配色<select name="palette" aria-label="配色"><option value="rose">rose</option><option value="tech">tech</option><option value="wanderers">wanderers</option><option value="ink">ink</option><option value="sepia">sepia</option></select></label>
  <label>布局<select name="layout" aria-label="布局"><option value="article">article</option><option value="page">page</option><option value="canvas">canvas</option></select></label>
  <label>排版<select name="typography" aria-label="排版"><option value="standard">标准</option><option value="enhanced">增强 · 彩色强调</option><option value="literary">文学 · 首行缩进</option><option value="poem">诗歌 · 居中诗行</option></select></label>
  <label>页面对齐<select name="alignment" aria-label="页面对齐"><option value="centered">侧栏与正文整体居中</option><option value="balanced">旧版 · 左右对称留白</option></select></label>
  <button type="reset">恢复默认</button>
</form>
<p id="appearance-status" role="status" aria-live="polite"></p>

选择后直接预览本站的真实元素。对齐选项用于 `page` 布局；下面的设置可复制到文章开头的元数据中。

<pre class="appearance-output"><code id="appearance-code">layout: article
typography: standard
palette: rose</code></pre>

# 一级标题：沿着河岸走

这里是一段普通正文。页面的标题使用独立的 `.page-title`，正文中的一级标题则保留自己的尺度与颜色。**粗体突出关键概念**，*斜体标记另一层语气*，增强排版分别用不同颜色强调二者，不加背景。

## 二级标题：让信息自然分层

标准排版适合说明和评论，文学排版让段落首行缩进，增强排版适合笔记，诗歌排版让整篇诗行整体居中。配色与排版彼此独立，可以自由组合。

### 三级标题：一小份清单

- 保持文字可读，强调只出现在需要的位置。
- [分类索引](/categories/)与[标签索引](/tags/)提供不同的阅读路径。
- 行内代码：`npm run build`。

#### 四级标题：引文

> 风停下来的时候，水面仍留着它经过的方向。

##### 五级标题：表格与代码

| 元素 | 作用 |
| --- | --- |
| 标题 | 标记内容层次 |
| 强调 | 帮助定位重点 |

```js
const palette = 'wanderers';
const typography = 'enhanced';
```

###### 六级标题：诗行

<div class="poem">

河岸没有记下脚步，<br>
只有一盏灯，<br>
在水里慢慢变长。

</div>
