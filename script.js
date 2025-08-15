document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const siteContainer = document.querySelector('.site-container');

    // 当切换按钮存在时，才添加事件监听
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            // 为侧边栏和主容器切换 'active' 类
            sidebar.classList.toggle('active');
        });
    }

    // 可选：点击侧边栏外部区域关闭侧边栏（在移动端体验更佳）
    document.addEventListener('click', function(event) {
        // 检查侧边栏是否为激活状态，并且点击的目标不是侧边栏或切换按钮
        if (sidebar.classList.contains('active') && !sidebar.contains(event.target) && !sidebarToggle.contains(event.target)) {
            sidebar.classList.remove('active');
        }
    });
});
