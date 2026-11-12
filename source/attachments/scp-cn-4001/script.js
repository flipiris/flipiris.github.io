let heightZeroPosition = null;
let heightZeroElement = null;
const MQ_MOBILE_OVERLAY = window.matchMedia('(max-width: 800px)');
const MQ_WIDE = window.matchMedia('(min-width: 1000px)');
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
let bottomNavBars = null;
function getBottomNavBars() {
    if (!bottomNavBars) {
        bottomNavBars = document.querySelectorAll("ul[id^='desktop-navbar-']");
    }
    return bottomNavBars;
}
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
    closeAllBottomNavBars();
}
let mobileNavCloseTimer = 0;

function closeMobileNavbar() {
    const navbar = document.getElementById("mobile-navbar");
    const list = document.getElementById("mobile-navbar-list");
    if (!navbar || !list) return;
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
    clearTimeout(mobileNavCloseTimer);
    list.classList.remove("fadeout");

    const items = navbar.querySelectorAll("li[id^='mobile-navbar-item-']");
    const containers = list.querySelectorAll("li[data-for^='mobile-navbar-item-']");
    const clicked = document.getElementById(id);
    if (!clicked) return;
    items.forEach(item => item.classList.remove("selected"));
    containers.forEach(item => item.classList.remove("selected"));

    clicked.classList.add("selected");

    const selectedItem = list.querySelector(`li[data-for="${id}"]`);
    if (selectedItem) selectedItem.classList.add("selected");

    syncMobileExpandedState(items);
}
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

function showTitleSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) section.classList.add("section-fade-in");
}

function revealCharacterName() {
    const nameElements = document.getElementsByClassName("effect-change");
    const changeNameAnim = ["596", "59?", "?6??", "????", "艾?#6?&", "艾#?瑟华??#", "艾瑟琳??#华斯", "艾瑟琳·华兹?斯", "艾瑟琳·华兹华斯"];

    Array.from(nameElements).forEach(el => {
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

function setChapterTitle(text1, text2) {
    const text1Element = document.getElementById("chapter-name-en");
    const text2Element = document.getElementById("chapter-name");
    if (text1Element) text1Element.textContent = text1;
    if (text2Element) text2Element.textContent = text2;
}
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
const OVERLAY_HIDDEN_STATES = new Set(["hide-instant", "fade-out", "fade-out-2", "fade-out-end"]);

let overlayHidden = false;
let finalRecordTop = 0;

function getOverlayNumberEl() {
    return document.getElementById("overlay-number");
}
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
const layoutMetrics = {
    documentHeight: 0,
    maxScrollTop: 1
};
const SECTION_ACTIONS = {
    "gt-intro": { onShow: () => setChapterTitle('Part 01 / ', 'The Forgotten') },
    "briefing": { onShow: () => overlayNumber('fade-in') },
    "part1-title": {
        onShow: () => { showTitleSection('part1-title'); overlayNumber('pos1'); },
        onLeave: () => overlayNumber('pos1-reverse')
    },
    "part2-title": {
        onShow: () => {
            showTitleSection('part2-title');
            overlayNumber('pos1');
            setChapterTitle('Part 02 / ', 'Binary Stars');
        },
        onLeave: () => overlayNumber('pos1-reverse')
    },
    "part3-title": {
        onShow: () => {
            showTitleSection('part3-title');
            overlayNumber('pos1');
            setChapterTitle('Part 03 / ', 'Falling Tides');
        },
        onLeave: () => overlayNumber('pos1-reverse')
    },
    "part4-title": {
        onShow: () => {
            showTitleSection('part4-title');
            overlayNumber('pos1');
            setChapterTitle('Part 04 / ', 'PHOENIX');
        },
        onLeave: () => overlayNumber('pos1-reverse')
    },
    "part5-title": {
        onShow: () => {
            showTitleSection('part5-title');
            setChapterTitle('Ending Part / ', 'Gaze Into');
        }
    },
    "illustration": { onShow: () => overlayNumber('fade-out', true), onLeave: () => overlayNumber('fade-in', true) },
    "name-effect": { onShow: () => revealCharacterName() },
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
const SCROLL_ACTIONS = {
    overlay: () => updateOverlay()
};
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
function exitFinalRecordMode() {
    if (MQ_MOBILE_OVERLAY.matches) overlayNumber('mobile-out-fr', true, true);
    else overlayNumber('fade-out-2');
}
function guardFinalRecordState() {
    const el = getOverlayNumberEl();
    if (!el || !el.classList.contains("final-record")) return;
    if (finalRecordTop <= 0) return;
    if (window.scrollY + window.innerHeight < finalRecordTop) exitFinalRecordMode();
}
function updateHeightZeroPosition() {
    heightZeroElement = document.getElementById("height-zero");
    if (heightZeroElement) {
        heightZeroPosition = heightZeroElement.getBoundingClientRect().top + window.scrollY;
    } else {
        heightZeroPosition = null;
    }
}

const remeasure = debounce(function () {
    measureLayout();
    updateHeightZeroPosition();
}, 120);
const numberFormatter = new Intl.NumberFormat();
let lastHeightValue = -1;

function updateOverlay() {
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
    heightNumber.textContent = numberFormatter.format(value);
}
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
        vectorX = ((scrollX - lastScrollX) / deltaTime) * 0.7 + window.scrollData.scrollVector.x * 0.3;
        vectorY = ((scrollY - lastScrollY) / deltaTime) * 0.7 + window.scrollData.scrollVector.y * 0.3;
    }

    lastScrollX = scrollX;
    lastScrollY = scrollY;
    lastScrollTime = now;
    const data = window.scrollData;
    data.scrollY = scrollY;
    data.scrollX = scrollX;
    data.scrollPercent = Math.min((scrollY / layoutMetrics.maxScrollTop) * 100, 100);
    data.scrollVector.x = vectorX;
    data.scrollVector.y = vectorY;
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
function initScrollSystem() {
    bindActions();
    measureLayout();
    updateHeightZeroPosition();
    initSectionObserver();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', remeasure);
    const onBreakpointChange = () => {
        rebuildSectionObserver();
        remeasure();
    };
    MQ_MOBILE_OVERLAY.addEventListener('change', onBreakpointChange);

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

let uuidCounter = 0;
function randomId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        try {
            return window.crypto.randomUUID();
        } catch (e) {
            }
    }
    uuidCounter++;
    return `${Date.now().toString(36)}-${uuidCounter.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
function generateModalID(modalElement) {
    const modalIDElement = modalElement && modalElement.querySelector('p:first-child');
    if (!modalIDElement) return;
    modalIDElement.textContent += randomId();
}
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
function togglePageSource() {
    const sourceCodeDiv = document.getElementById("source-code");
    if (!sourceCodeDiv) return;

    const isHidden = sourceCodeDiv.style.display !== "block";
    sourceCodeDiv.style.display = isHidden ? "block" : "none";

    if (isHidden) {
        const content = document.getElementById("source-code-content");
        if (content) {
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

document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
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
    document.querySelectorAll("div#mobile-navbar-list>ul>li>ul").forEach(list => {
        list.querySelectorAll("li>a").forEach((item, index) => {
            item.style.animationDelay = `${index * 0.02 + Math.random() * 0.25}s`;
        });
    });
    const debug = urlParams.get("debug") === "true";
    updateHeightZeroPosition();

    initModalIDs();

    if (!debug) {
        const contentContainer = document.getElementById("content-container");
        if (contentContainer) contentContainer.style.animation = "fade-in 2s ease-in-out";
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
    if (!MQ_MOBILE_OVERLAY.matches) {
        overlayNumber('hide-instant');
    }

    initScrollSystem();
});
