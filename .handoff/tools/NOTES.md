# 临时脚本（均未跑通，接手请先修）

沙箱下无头 Chrome 起不干净：浏览器级 WS 能连，page 级 createTarget/attachToTarget 挂住，
Chrome stderr 刷 `sandbox initialization failed` / `GPU process exited` / `Network service crashed`。

- cdp.mjs       无头 Chrome CDP 封装：page({width,height}) → goto / eval / shot / click / key / resize
- baseline.mjs  改动前后对照截图，8 组用例（首页/文章/索引/画布 × 1440x900, 1440x700, 768x1024, 390x844）
- dbg.mjs       只验证 Chrome 能否启动与 /json/new 是否返回 target

用法（修好后）：node .handoff/tools/baseline.mjs before  → /tmp/shots/before-*.png

备选方案（优先）：
  npm i --prefix /tmp/shotenv puppeteer    # 不进仓库依赖
或直接用用户的 hexo server (:4000) 手动验收。
