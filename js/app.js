/* =====================================
   App — Widget Loader & Switcher
   ===================================== */

(function () {
  'use strict';

  /* ── Widget registry ─────────────────── */
  var WIDGETS = [
    { id: 'card',                file: 'widgets/list-card.html',           js: 'js/list-card.js',            css: 'css/list-card.css' },
    { id: 'banner',              file: 'widgets/banner-card.html',         js: 'js/banner-card.js',          css: 'css/banner-card.css' },
    { id: 'faq',                 file: 'widgets/faq.html',                 js: 'js/faq.js',                  css: 'css/faq.css' },
    { id: 'dynamic-card',        file: 'widgets/dynamic-card.html',        js: 'js/dynamic-card.js',         css: 'css/dynamic-card.css' },
    { id: 'timeline',            file: 'widgets/timeline.html',            js: 'js/timeline.js',             css: 'css/timeline.css' },
    { id: 'horizon-scroll-card', file: 'widgets/horizon-scroll-card.html', js: 'js/horizon-scroll-card.js',  css: 'css/horizon-scroll-card.css' },
    { id: 'focus-card',          file: 'widgets/focus-card.html',          js: 'js/focus-card.js',           css: 'css/focus-card.css' },
    { id: 'focus-card-2',        file: 'widgets/focus-card-2.html',        js: 'js/focus-card-2.js',         css: 'css/focus-card-2.css' },
    { id: 'image-faq',           file: 'widgets/image-faq.html',           js: 'js/image-faq.js',            css: 'css/image-faq.css' },
    { id: 'map',                 file: 'widgets/map.html',                 js: 'js/map.js',                  css: 'css/map.css' },
    { id: 'value-card',          file: 'widgets/value-card.html',          js: 'js/value-card.js',           css: 'css/value-card.css' },
    { id: 'hero-main-slide',     file: 'widgets/hero-main-slide.html',     js: 'js/hero-main-slide.js',      css: 'css/hero-main-slide.css' },
    { id: 'slide-card',          file: 'widgets/slide-card.html',          js: 'js/slide-card.js',           css: 'css/slide-card.css' },
    { id: 'logo-marquee',        file: 'widgets/logo-marquee.html',        js: 'js/logo-marquee.js',         css: 'css/logo-marquee.css' }
  ];

  /* ── CSS loader ─────────────────────── */
  function loadCSS(href) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  /* ── JS loader (sequential) ──────────── */
  function loadScript(src) {
    return new Promise(function (resolve) {
      var script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      document.body.appendChild(script);
    });
  }

  /* ── Fetch widget HTML and inject into #widgetViews ── */
  function fetchWidget(w) {
    return fetch(w.file)
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');

        var view = document.createElement('div');
        view.className = 'widget-view';
        view.id = 'view-' + w.id;

        var main = doc.querySelector('.editor__canvas');
        var aside = doc.querySelector('.inspector');
        if (main)  view.appendChild(document.adoptNode(main));
        if (aside) view.appendChild(document.adoptNode(aside));

        document.getElementById('widgetViews').appendChild(view);
        loadCSS(w.css);
      });
  }

  /* ── Load all widgets, then run each widget's JS in order ── */
  function loadAllWidgets() {
    Promise.all(WIDGETS.map(fetchWidget))
      .then(function () {
        /* Activate first widget view */
        var firstView = document.querySelector('.widget-view');
        if (firstView) firstView.classList.add('active');

        /* Load widget JS files sequentially */
        return WIDGETS.reduce(function (chain, w) {
          return chain.then(function () { return loadScript(w.js); });
        }, Promise.resolve());
      });
  }

  /* ── Nav switcher ───────────────────── */
  function initNav() {
    document.querySelectorAll('.widget-nav__item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.dataset.widget;

        document.querySelectorAll('.widget-nav__item').forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });

        document.querySelectorAll('.widget-view').forEach(function (v) {
          v.classList.toggle('active', v.id === 'view-' + target);
        });
      });
    });
  }

  /* ── Mobile Nav Toggle ───────────── */
  function initNavToggle() {
    var nav     = document.getElementById('widgetNav');
    var overlay = document.getElementById('navOverlay');
    var openBtn = document.getElementById('navOpenBtn');
    var closeBtn = document.getElementById('navToggle');

    function openNav() {
      nav.classList.add('open');
      overlay.classList.add('visible');
      openBtn.classList.add('hidden');
    }

    function closeNav() {
      nav.classList.remove('open');
      overlay.classList.remove('visible');
      openBtn.classList.remove('hidden');
    }

    openBtn.addEventListener('click', openNav);
    closeBtn.addEventListener('click', closeNav);
    overlay.addEventListener('click', closeNav);

    /* PC: start with nav open */
    if (window.innerWidth > 640) {
      nav.classList.add('open');
      openBtn.classList.add('hidden');
    }
  }

  /* ── Mobile Inspector Reopen ─────── */
  function initMobileInspector() {
    var openBtn = document.getElementById('inspectorOpenBtn');
    if (!openBtn) return;

    /* Intercept .inspector__close clicks in capture phase on mobile.
       This runs before widget-specific bubble-phase handlers,
       preventing display:none and instead letting us manage open/close. */
    document.addEventListener('click', function (e) {
      var closeBtn = e.target.closest('.inspector__close');
      if (!closeBtn) return;

      e.stopImmediatePropagation();

      var inspector = closeBtn.closest('.inspector');
      if (inspector) {
        inspector.classList.add('inspector--hidden');
        openBtn.classList.add('visible');
      }
    }, true /* capture */);

    /* Reopen the active inspector */
    openBtn.addEventListener('click', function () {
      var activeView = document.querySelector('.widget-view.active');
      if (!activeView) return;
      var inspector = activeView.querySelector('.inspector');
      if (inspector) {
        inspector.classList.remove('inspector--hidden');
        openBtn.classList.remove('visible');
      }
    });

    /* When switching widgets on mobile, reset inspector visibility */
    document.querySelectorAll('.widget-nav__item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openBtn.classList.remove('visible');
        var target = btn.dataset.widget;
        var inspector = document.querySelector('#view-' + target + ' .inspector');
        if (inspector) inspector.classList.remove('inspector--hidden');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initNavToggle();
    initMobileInspector();
    loadAllWidgets();
  });

})();
