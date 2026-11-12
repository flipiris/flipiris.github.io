/*
 * 传汐引潮 —— 页面交互与滚动系统
 *
 * 设计要点:
 *   - 行为注册表: HTML 只提供 data-act="标识符", 执行体全部集中在 SECTION_ACTIONS / SCROLL_ACTIONS
 *     运行期只做查表 + 函数调用, 不再使用 new Function / with (可上严格 CSP)
 *   - 滚动帧: 单 requestAnimationFrame 合并, 帧内不读取任何布局属性
 *   - 可见性: 只有 IntersectionObserver 一个数据源 (已删除原先移动端的每帧轮询分支)
 *   - 断点: 统一由 matchMedia 提供, JS 不再直接读 window.innerWidth
 *
 * 注: 本文件使用传统 script 引入, 所有函数声明会挂到全局, index.html 的 onclick 依赖它们。
 */

let indev = false;
// 高度计数器当前值
let uiArkringHeight = 0;
// height-zero 元素相对文档顶部的位置 (用于计算坠落高度)
let heightZeroPosition = null;
let heightZeroElement = null;

// 断点均与 CSS 保持一致:
//   - 800px: Overlay 的桌面/移动形态切换 (style.css 中 #overlay-number 的媒体查询)
//   - 1000px: 桌面底栏切换为 grid 布局, #extra-div-1 也只在此断点以上显示
const MQ_MOBILE_OVERLAY = window.matchMedia('(max-width: 800px)');
const MQ_WIDE = window.matchMedia('(min-width: 1000px)');

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/*
 * UI
 */

// 桌面底部导航栏的子菜单集合 (只查询一次并缓存)
let bottomNavBars = null;
function getBottomNavBars() {
    if (!bottomNavBars) {
        bottomNavBars = document.querySelectorAll("ul[id^='desktop-navbar-']");
    }
    return bottomNavBars;
}

// 同步 aria-expanded, 让读屏软件能得知子菜单的展开状态
function syncExpandedState() {
    getBottomNavBars().forEach(navBar => {
        const trigger = navBar.closest('li[aria-expanded]') ||
            document.querySelector(`li[aria-controls="${navBar.id}"]`);
        if (trigger) trigger.setAttribute('aria-expanded', navBar.classList.contains('open') ? 'true' : 'false');
    });
}

function closeAllBottomNavBars() {
    getBottomNavBars().forEach(navBar => navBar.classList.remove("open"));
    syncExpandedState();
}

function showBottomNavBar(id) {
    const bottomNavBar = document.getElementById(id);
    if (!bottomNavBar) return;

    // 检查当前导航栏是否已打开 (已打开则本次点击是收起)
    const isOpen = bottomNavBar.classList.contains("open");

    closeAllBottomNavBars();

    if (!isOpen) {
        bottomNavBar.classList.add("open");
    }
    syncExpandedState();
}

function toggleSidebar() {
    const sideBar = document.getElementById("side-bar");
    if (sideBar) sideBar.classList.toggle("open");

    const closeSideBar = document.getElementById("close-side-bar");
    if (closeSideBar) closeSideBar.classList.toggle("open");

    // 关闭所有展开的底部导航子菜单
    closeAllBottomNavBars();
}

// 移动端顶部导航: 单个定时器, 避免为每个列表项各排一个 setTimeout
let mobileNavCloseTimer = 0;

function closeMobileNavbar() {
    const navbar = document.getElementById("mobile-navbar");
    const list = document.getElementById("mobile-navbar-list");
    if (!navbar || !list) return;

    // 没有任何选中项时无需播放关闭动画 (避免点击页面空白处也触发一次淡出)
    if (!navbar.querySelector("li.selected") && !list.querySelector("li.selected")) return;

    const items = navbar.querySelectorAll("li[id^='mobile-navbar-item-']");
    const containers = list.querySelectorAll("li[data-for^='mobile-navbar-item-']");

    list.classList.add("fadeout");
    clearTimeout(mobileNavCloseTimer);
    mobileNavCloseTimer = setTimeout(() => {
        items.forEach(item => item.classList.remove("selected"));
        containers.forEach(item => item.classList.remove("selected"));
        list.classList.remove("fadeout");
        syncMobileExpandedState(items);
    }, 150);
}

function syncMobileExpandedState(items) {
    items.forEach(item => item.setAttribute('aria-expanded', item.classList.contains('selected') ? 'true' : 'false'));
}

function showMobileNavbar(id) {
    const navbar = document.getElementById("mobile-navbar");
    const list = document.getElementById("mobile-navbar-list");
    if (!navbar || !list) return;

    // 若上一次的关闭动画还在进行, 取消它
    clearTimeout(mobileNavCloseTimer);
    list.classList.remove("fadeout");

    const items = navbar.querySelectorAll("li[id^='mobile-navbar-item-']");
    const containers = list.querySelectorAll("li[data-for^='mobile-navbar-item-']");
    const clicked = document.getElementById(id);
    if (!clicked) return;

    // 单层循环移除全部选中态
    items.forEach(item => item.classList.remove("selected"));
    containers.forEach(item => item.classList.remove("selected"));

    clicked.classList.add("selected");

    const selectedItem = list.querySelector(`li[data-for="${id}"]`);
    if (selectedItem) selectedItem.classList.add("selected");

    syncMobileExpandedState(items);
}

// 点击页面其它区域关闭导航: 全局只注册一次, 避免监听器随点击次数无限累积
document.addEventListener("click", function (event) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (!target.closest("#desktop-navbar")) {
        closeAllBottomNavBars();
    }
    if (!target.closest("#mobile-navbar")) {
        closeMobileNavbar();
    }
});

// 键盘可达性: 导航项是 role="button" 的 li, 需要自己处理 Enter / Space; Esc 关闭已展开的导航
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeAllBottomNavBars();
        closeMobileNavbar();
        return;
    }

    if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") return;

    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.getAttribute("role") !== "button") return;

    event.preventDefault();
    target.click();
});

/*
 * 章节标题 / 文本特效
 */

function showTitleSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) section.classList.add("section-fade-in");
}

function textEffectChange1() {
    const nameElements = document.getElementsByClassName("effect-change");
    const changeNameAnim = ["596", "59?", "?6??", "????", "艾?#6?&", "艾#?瑟华??#", "艾瑟琳??#华斯", "艾瑟琳·华兹?斯", "艾瑟琳·华兹华斯"];

    Array.from(nameElements).forEach(el => {
        // 防重入: 正在播放的元素不重复起定时器
        if (el.dataset.nameAnimRunning === "1") return;
        el.dataset.nameAnimRunning = "1";

        let index = 0;
        const timer = setInterval(() => {
            el.textContent = changeNameAnim[index];
            index++;
            if (index >= changeNameAnim.length) {
                clearInterval(timer);
                delete el.dataset.nameAnimRunning;
                el.classList.remove("effect-change");
            }
        }, 200);
    });
}

function textEddectChange2(text1, text2) {
    const text1Element = document.getElementById("chapter-name-en");
    const text2Element = document.getElementById("chapter-name");
    if (text1Element) text1Element.textContent = text1;
    if (text2Element) text2Element.textContent = text2;
}

/*
 * Overlay (高度计数器 / 章节名 / 标签)
 */

// Overlay 动画映射表。原先散落在 overlayNumber 的 switch 里, 这里抽成数据。
const OVERLAY_ANIMATIONS = {
    "pos1": "overlay-number-pos1 1.5s ease forwards",
    "pos1-reverse": "overlay-number-pos1-reverse 1.5s ease forwards",
    "hide-instant": "overlay-number-fade-out 0s forwards",
    "show-instant": "overlay-number-fade-in 0s forwards",
    "fade-in": "overlay-number-fade-in 1.5s ease forwards",
    "fade-out": "overlay-number-fade-out 1.5s ease forwards",
    "fade-out-2": "overlay-number-fade-out-2 1s ease forwards",
    "fade-in-2": "overlay-number-fade-in-2 1s ease forwards",
    "mobile-out-fr": "overlay-number-fade-in 1.5s ease forwards",
};

// 处于这些状态时 Overlay 不可见, 滚动帧可直接跳过计算
const OVERLAY_HIDDEN_STATES = new Set(["hide-instant", "fade-out", "fade-out-2", "fade-out-end"]);

let overlayHidden = false;

// #final-record 的文档顶部位置, 由 measureLayout 缓存, 供滚动帧做 O(1) 判断 (不读布局)
let finalRecordTop = 0;

function getOverlayNumberEl() {
    return document.getElementById("overlay-number");
}

// 重新播放 CSS 动画: 先取消既有动画, 否则同名动画在同一帧内不会重播
function playOverlayAnimation(value) {
    const el = getOverlayNumberEl();
    if (!el) return;
    if (el.getAnimations) {
        el.getAnimations().forEach(anim => anim.cancel());
    }
    el.style.animation = value;
}

function intoFinalRecord() {
    const overlayNumber = getOverlayNumberEl();
    if (!overlayNumber) return;
    overlayNumber.removeAttribute("style");
    overlayNumber.classList.add("final-record");
    overlayNumber.classList.remove("end");
}

function outOfFinalRecord() {
    const overlayNumber = getOverlayNumberEl();
    if (!overlayNumber) return;
    overlayNumber.removeAttribute("style");
    overlayNumber.classList.add("end");
    overlayNumber.classList.remove("end-fade-out");
}

function overlayNumber(type, shouldMobile = false, onlyMobile = false) {
    // 移动端 (<=800px) 默认不显示 Overlay; onlyMobile 表示仅移动端生效
    if (!shouldMobile && MQ_MOBILE_OVERLAY.matches) return;
    if (onlyMobile && !MQ_MOBILE_OVERLAY.matches) return;

    const overlayEl = getOverlayNumberEl();
    if (!overlayEl) return;

    if (OVERLAY_HIDDEN_STATES.has(type)) overlayHidden = true;
    else overlayHidden = false;

    overlayEl.removeAttribute("style");

    if (type === "final-record") {
        intoFinalRecord();
        return;
    }
    if (type === "final-record-reverse") {
        outOfFinalRecord();
        return;
    }
    if (type === "fade-out-end") {
        overlayEl.classList.add("end-fade-out");
        return;
    }
    if (type === "fade-out-2" || type === "mobile-out-fr") {
        overlayEl.classList.remove("final-record");
    }

    const animation = OVERLAY_ANIMATIONS[type];
    if (animation) playOverlayAnimation(animation);
}

/*
 * 滚动系统
 */

window.scrollData = {
    scrollY: 0,
    scrollX: 0,
    scrollPercent: 0,
    viewportHeight: window.innerHeight,
    viewportWidth: window.innerWidth,
    documentHeight: 0,
    currentSection: null,
    previousSection: null,
    scrollVector: { x: 0, y: 0 }
};

// 惰性缓存的布局量: 只在 resize / 资源加载完成 / 内容注入后重算
const layoutMetrics = {
    documentHeight: 0,
    maxScrollTop: 1
};

// section 行为注册表: HTML 的 data-act 只作为 key
const SECTION_ACTIONS = {
    "gt-intro": { onShow: () => textEddectChange2('Part 01 / ', 'The Forgotten') },
    "briefing": { onShow: () => overlayNumber('fade-in') },
    "part1-title": {
        onShow: () => { showTitleSection('part1-title'); overlayNumber('pos1'); },
        onLeave: () => overlayNumber('pos1-reverse')
    },
    "part2-title": {
        onShow: () => {
            showTitleSection('part2-title');
            overlayNumber('pos1');
            textEddectChange2('Part 02 / ', 'Binary Stars');
        },
        onLeave: () => overlayNumber('pos1-reverse')
    },
    "part3-title": {
        onShow: () => {
            showTitleSection('part3-title');
            overlayNumber('pos1');
            textEddectChange2('Part 03 / ', 'Falling Tides');
        },
        onLeave: () => overlayNumber('pos1-reverse')
    },
    "part4-title": {
        onShow: () => {
            showTitleSection('part4-title');
            overlayNumber('pos1');
            textEddectChange2('Part 04 / ', 'PHOENIX');
        },
        onLeave: () => overlayNumber('pos1-reverse')
    },
    "part5-title": {
        onShow: () => {
            showTitleSection('part5-title');
            textEddectChange2('Ending Part / ', 'Gaze Into');
        }
    },
    // 全屏插画: 进入时隐藏 Overlay, 离开时恢复
    "illustration": { onShow: () => overlayNumber('fade-out', true), onLeave: () => overlayNumber('fade-in', true) },
    "name-effect": { onShow: () => textEffectChange1() },
    "record-out": {
        onShow: () => {
            overlayNumber('fade-out-2');
            const el = getOverlayNumberEl();
            if (el) el.classList.remove('final-record');
        },
        onLeave: () => overlayNumber('fade-in-2')
    },
    "final-record": {
        onShow: () => overlayNumber('final-record', true),
        // 离开 #final-record 有两个方向, 含义完全相反:
        //   向下 -> 交给 #height-zero 的 onShow 进入 .end 状态 (移动端则直接收回)
        //   向上 -> 必须在这里退出全屏大数字模式, 否则计数器会一直保持全屏大数字
        onLeave: () => {
            if (window.scrollData.scrollVector.y <= 0) exitFinalRecordMode();
            else overlayNumber('mobile-out-fr', true, true);
        }
    },
    "height-zero": {
        onShow: () => outOfFinalRecord(),
        onLeave: () => overlayNumber('fade-out-end', true)
    }
};

// 滚动帧回调注册表: 每帧直接调用
const SCROLL_ACTIONS = {
    overlay: () => updateOverlay()
};

// 绑定结果: Map<Element, handlers> 与 [Function]
const sectionHandlers = new Map();
const scrollActions = [];

function bindActions() {
    sectionHandlers.clear();
    scrollActions.length = 0;

    document.querySelectorAll('[data-act]').forEach(el => {
        const key = el.getAttribute('data-act');
        if (!key) return;

        const scrollFn = SCROLL_ACTIONS[key];
        if (scrollFn) {
            scrollActions.push(scrollFn);
            return;
        }

        const handlers = SECTION_ACTIONS[key];
        if (handlers) sectionHandlers.set(el, handlers);
    });
}

function runSectionAction(element, kind) {
    const handlers = sectionHandlers.get(element);
    const fn = handlers && handlers[kind];
    if (!fn) return;
    try {
        fn();
    } catch (error) {
        console.error(`Error executing ${kind} action:`, error);
    }
}

/*
 * 布局量测量
 */

function measureLayout() {
    const documentHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight
    );

    layoutMetrics.documentHeight = documentHeight;
    layoutMetrics.maxScrollTop = Math.max(1, documentHeight - window.innerHeight);

    const finalRecordEl = document.getElementById("final-record");
    finalRecordTop = finalRecordEl ? finalRecordEl.getBoundingClientRect().top + window.scrollY : 0;

    window.scrollData.documentHeight = documentHeight;
    window.scrollData.viewportHeight = window.innerHeight;
    window.scrollData.viewportWidth = window.innerWidth;
}

// 退出"全屏大数字"模式。
// 向下离开 #final-record 时由 #height-zero 的 onShow 接管 (进入 .end 状态), 所以这里只用于向上离开。
function exitFinalRecordMode() {
    if (MQ_MOBILE_OVERLAY.matches) overlayNumber('mobile-out-fr', true, true);
    else overlayNumber('fade-out-2');
}

// 兜底: #final-record 只可能在上方, 一旦视口整个落在它上方, 就说明已经离开了那个区域。
// 原先只有 #record-out 的 onShow 负责退出该状态, 快速滚动 / 拖动滚动条跳过中间 section 时
// 会漏掉那次回调, 计数器就会一直卡在全屏大数字上。
function guardFinalRecordState() {
    const el = getOverlayNumberEl();
    if (!el || !el.classList.contains("final-record")) return;
    if (finalRecordTop <= 0) return;
    if (window.scrollY + window.innerHeight < finalRecordTop) exitFinalRecordMode();
}

// 更新 height-zero 元素的位置信息
function updateHeightZeroPosition() {
    heightZeroElement = document.getElementById("height-zero");
    if (heightZeroElement) {
        // 用 rect + scrollY 而非 offsetTop, 不受 offsetParent 影响
        heightZeroPosition = heightZeroElement.getBoundingClientRect().top + window.scrollY;
    } else {
        heightZeroPosition = null;
    }
}

const remeasure = debounce(function () {
    measureLayout();
    updateHeightZeroPosition();
}, 120);

/*
 * Overlay 高度计数器
 */

// 复用同一个格式化实例, 避免每帧新建 Intl 对象
const numberFormatter = new Intl.NumberFormat();
let lastHeightValue = -1;

function updateOverlay() {
    // Overlay 不可见时直接跳过 (原先移动端隐藏后仍在每帧计算并写 DOM)
    if (overlayHidden) return;

    const heightNumber = document.getElementById("height-number");
    if (!heightNumber) return;

    let value;
    if (heightZeroPosition !== null) {
        const scrollDiff = Math.max(0, heightZeroPosition - window.scrollY);
        const scrollRatio = Math.min(1, scrollDiff / heightZeroPosition);
        value = Math.round(2300000 * scrollRatio);
    } else {
        value = Math.round(2300000 * (1 - window.scrollData.scrollPercent / 100));
    }

    if (value === lastHeightValue) return;
    lastHeightValue = value;
    uiArkringHeight = value;
    heightNumber.textContent = numberFormatter.format(value);
}

/*
 * 可见性观察
 */

// Element -> 文档坐标下的底边位置
const visibleSections = new Map();
const shownElements = new Set();
let sectionObserver = null;

function handleSectionVisibility(entries) {
    for (const entry of entries) {
        const section = entry.target;

        if (entry.isIntersecting) {
            visibleSections.set(section, entry.boundingClientRect.bottom + window.scrollY);
            shownElements.add(section);
        } else {
            visibleSections.delete(section);
            if (shownElements.has(section)) {
                shownElements.delete(section);
                runSectionAction(section, 'onLeave');
            }
        }
    }

    // 取最下面的可见 section 作为当前 section
    let current = null;
    let maxBottom = -Infinity;
    for (const [section, bottom] of visibleSections) {
        if (bottom > maxBottom) {
            maxBottom = bottom;
            current = section;
        }
    }

    if (current !== window.scrollData.currentSection) {
        window.scrollData.previousSection = window.scrollData.currentSection;
        window.scrollData.currentSection = current;
        if (current) runSectionAction(current, 'onShow');
    }
}

function initSectionObserver() {
    const options = {
        root: null,
        // 移动端使用负 margin 提前触发
        rootMargin: MQ_MOBILE_OVERLAY.matches ? '-10% 0px -10% 0px' : '0px',
        threshold: MQ_MOBILE_OVERLAY.matches ? 0.05 : 0.1
    };

    sectionObserver = new IntersectionObserver(handleSectionVisibility, options);
    document.querySelectorAll('section').forEach(section => sectionObserver.observe(section));
}

function rebuildSectionObserver() {
    if (sectionObserver) sectionObserver.disconnect();
    initSectionObserver();
}

/*
 * 滚动帧
 */

let ticking = false;
let lastScrollX = 0;
let lastScrollY = 0;
let lastScrollTime = 0;

function scrollFrame() {
    ticking = false;

    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const now = performance.now();
    const deltaTime = lastScrollTime > 0 ? now - lastScrollTime : 0;

    let vectorX = 0;
    let vectorY = 0;
    if (deltaTime > 0) {
        // 平滑因子, 减少速度波动
        vectorX = ((scrollX - lastScrollX) / deltaTime) * 0.7 + window.scrollData.scrollVector.x * 0.3;
        vectorY = ((scrollY - lastScrollY) / deltaTime) * 0.7 + window.scrollData.scrollVector.y * 0.3;
    }

    lastScrollX = scrollX;
    lastScrollY = scrollY;
    lastScrollTime = now;

    // 原地赋值, 避免每帧重建对象
    const data = window.scrollData;
    data.scrollY = scrollY;
    data.scrollX = scrollX;
    data.scrollPercent = Math.min((scrollY / layoutMetrics.maxScrollTop) * 100, 100);
    data.scrollVector.x = vectorX;
    data.scrollVector.y = vectorY;

    // 状态兜底: 只在确实处于全屏大数字模式时才做判断, 正常情况下一次 classList.contains 即返回
    guardFinalRecordState();

    for (let i = 0; i < scrollActions.length; i++) {
        scrollActions[i]();
    }
}

function handleScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(scrollFrame);
}

/*
 * 初始化
 */

// 正文可能由 html_content.js 注入 (Wikidot 附件的体积限制 workaround),
// 因此要等 section 真正存在后再绑定, 否则会观察到 0 个 section。
function whenSectionsReady(callback) {
    if (document.querySelector('section')) {
        callback();
        return;
    }

    const container = document.querySelector('main-content') || document.getElementById('content-container');
    if (!container) {
        callback();
        return;
    }

    let done = false;
    const finish = () => {
        if (done) return;
        done = true;
        observer.disconnect();
        callback();
    };

    const observer = new MutationObserver(() => {
        if (document.querySelector('section')) finish();
    });
    observer.observe(container, { childList: true, subtree: true });

    // 兜底: 3 秒后无论如何初始化一次
    setTimeout(finish, 3000);
}

function initScrollSystem() {
    bindActions();
    measureLayout();
    updateHeightZeroPosition();
    initSectionObserver();

    window.addEventListener('scroll', handleScroll, { passive: true });

    // 普通 resize 只更新缓存的布局量, 不再拆装 Observer
    window.addEventListener('resize', remeasure);

    // 只有跨越断点时才需要用新的 rootMargin/threshold 重建 Observer
    const onBreakpointChange = () => {
        rebuildSectionObserver();
        remeasure();
    };
    if (MQ_MOBILE_OVERLAY.addEventListener) {
        MQ_MOBILE_OVERLAY.addEventListener('change', onBreakpointChange);
    } else {
        MQ_MOBILE_OVERLAY.addListener(onBreakpointChange);
    }

    // 图片、字体加载完成后布局会位移, 需要重新测量
    window.addEventListener('load', remeasure);
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(remeasure);
    }
    document.querySelectorAll('img').forEach(img => {
        if (!img.complete) {
            img.addEventListener('load', remeasure, { once: true });
            img.addEventListener('error', remeasure, { once: true });
        }
    });

    scrollFrame();
}

/*
 * 其它功能
 */

let uuidCounter = 0;
function randomId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        try {
            return window.crypto.randomUUID();
        } catch (e) {
            /* 非安全上下文会抛错, 走下面的降级 */
        }
    }
    uuidCounter++;
    return `${Date.now().toString(36)}-${uuidCounter.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// 生成模态框ID
function generateModalID(modalElement) {
    const modalIDElement = modalElement && modalElement.querySelector('p:first-child');
    if (!modalIDElement) return;
    modalIDElement.textContent += randomId();
}

// 档案框的 ID 只在临近可见时才生成, 避免启动时对 208 个元素同步写 DOM
function initModalIDs() {
    const modals = document.querySelectorAll(".modal");
    const observer = new IntersectionObserver((entries, obs) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            generateModalID(entry.target);
            obs.unobserve(entry.target);
        }
    }, { rootMargin: '400% 0px' });

    modals.forEach(modal => observer.observe(modal));
}

let pageSourceCache = null;

// 显示页面自己的源代码
function togglePageSource() {
    const sourceCodeDiv = document.getElementById("source-code");
    if (!sourceCodeDiv) return;

    const isHidden = sourceCodeDiv.style.display !== "block";
    sourceCodeDiv.style.display = isHidden ? "block" : "none";

    if (isHidden) {
        const content = document.getElementById("source-code-content");
        if (content) {
            // 序列化整棵 DOM 代价很高, 只做一次并缓存
            if (pageSourceCache === null) {
                pageSourceCache = document.documentElement.outerHTML;
            }
            content.textContent = pageSourceCache;
        }
    }

    const buttonElement = document.getElementById("wikidot-source-button");
    if (buttonElement) {
        buttonElement.textContent = isHidden ? "隐藏源码" : "查看源码";
    }
}

/*
 * DOMContentLoaded
 */

document.addEventListener("DOMContentLoaded", function () {
    // 接受iframe URL传参
    const urlParams = new URLSearchParams(window.location.search);

    // 底栏链接同步
    const pagename = urlParams.get("pagename");
    if (pagename) {
        const editButton = document.getElementById("wikidot-edit-button");
        if (editButton) {
            editButton.setAttribute("href", `https://scp-wiki-cn.wikidot.com/${pagename}/edit/true/norender/true`);
        }
    }
    const pageforum = urlParams.get("forumid");
    if (pageforum) {
        const forumButton = document.getElementById("wikidot-forum-button");
        if (forumButton) {
            forumButton.setAttribute("href", `https://scp-wiki-cn.wikidot.com/forum/${pageforum}`);
        }
    }

    // 初始化顶部导航栏的动画延迟
    // 注意: 原先这里写的是 Math.random(0, 0.2), 该函数不接受参数, 实际会得到 0~1 的随机不透明度,
    // 导致导航项随机接近全透明。这里改为只随机动画延迟, 不透明度交给 CSS。
    document.querySelectorAll("div#mobile-navbar-list>ul>li>ul").forEach(list => {
        list.querySelectorAll("li>a").forEach((item, index) => {
            item.style.animationDelay = `${index * 0.02 + Math.random() * 0.25}s`;
        });
    });

    // 调试模式
    const debug = urlParams.get("debug") === "true" || indev;

    // 初始化height-zero元素的位置信息
    updateHeightZeroPosition();

    initModalIDs();

    if (!debug) {
        // 实装时的设置
        // 页面底色现在由 CSS 提供在根元素上 (html), 这里不再操作 html 的 backgroundColor:
        // 原先"先置透明、2 秒后置回深色"的做法在 #content-container 变透明后会露出底下的 iframe。
        const contentContainer = document.getElementById("content-container");
        if (contentContainer) contentContainer.style.animation = "fade-in 2s ease-in-out";

        // 装饰背景层与正文一起淡入, 保持原有观感
        const bgDeco = document.getElementById("bg-deco");
        if (bgDeco) bgDeco.style.animation = "fade-in 2s ease-in-out";

        const desktopNavbar = document.getElementById("desktop-navbar");
        if (desktopNavbar) desktopNavbar.style.animation = "nav-fade-in 1.5s ease-in-out 0.25s forwards";

        if (MQ_WIDE.matches) {
            const extraDiv = document.getElementById("extra-div-1");
            if (extraDiv) extraDiv.style.animation = "nav-fade-in-2 1.2s ease-in-out 0.5s forwards";
        }

        const mobileNavbar = document.getElementById("mobile-navbar");
        if (mobileNavbar) mobileNavbar.style.animation = "topnav-fade-in 1s ease-in-out 0.25s forwards";
    }

    // 桌面端默认先隐藏 Overlay, 滚动到第一章时再淡入
    if (!MQ_MOBILE_OVERLAY.matches) {
        overlayNumber('hide-instant');
    }

    whenSectionsReady(initScrollSystem);
});
