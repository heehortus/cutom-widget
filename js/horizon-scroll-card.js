/* =====================================
   Horizon Scroll Card Widget — Controller
   ===================================== */

(function () {
  'use strict';

  /* ── State ── */
  var nextId = 4;
  var items = [
    { id: 1, title: 'Title', desc: 'Description', imgSrc: '' },
    { id: 2, title: 'Title', desc: 'Description', imgSrc: '' },
    { id: 3, title: 'Title', desc: 'Description', imgSrc: '' }
  ];

  var style = {
    autoplay:            true,
    interval:            4000,
    slideSpeed:          500,
    hoverZoom:           true,
    ratio:               '4-3',
    cardRadius:          12,
    titleSize:           32,
    titleLetter:         -6,
    titleLine:           1.1,
    titleWeight:         700,
    titleHex:            '#ffffff',
    titleOpacity:        100,
    descSize:            16,
    descLetter:          -2,
    descLine:            1.55,
    descWeight:          500,
    descHex:             '#ffffff',
    descOpacity:         100,
    overlayHex:          '#000000',
    overlayColorOpacity: 100,
    overlayOpacity:      60,
    dotHex:              '#e1e1e1',
    dotOpacity:          100,
    dotActiveHex:        '#3e673e',
    dotActiveOpacity:    100,
    cardBgHex:           '#f4eee7'
  };

  var dragSrcId  = null;
  var dragState  = { active: false, startX: 0, prevTranslate: 0 };

  /* ── Widget DOM refs ── */
  var root       = document.getElementById('horizonScrollCard');
  var itemListEl = document.getElementById('hscItemList');

  /* ── Helpers ── */
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  function escAttr(str) {
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function clamp(val, min, max) {
    return Math.min(max, Math.max(min, parseFloat(val) || min));
  }
  function hexToRgba(hex, opacity) {
    var h = hex.replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return 'rgba(' +
      parseInt(h.slice(0, 2), 16) + ',' +
      parseInt(h.slice(2, 4), 16) + ',' +
      parseInt(h.slice(4, 6), 16) + ',' +
      (opacity / 100) + ')';
  }

  /* ── Apply style vars to widget ── */
  function applyStyle() {
    var titleColor      = hexToRgba(style.titleHex,      style.titleOpacity)        || style.titleHex;
    var descColor       = hexToRgba(style.descHex,       style.descOpacity)         || style.descHex;
    var overlayColor    = hexToRgba(style.overlayHex,    style.overlayColorOpacity) || style.overlayHex;
    var dotColor        = hexToRgba(style.dotHex,        style.dotOpacity)          || style.dotHex;
    var dotActiveColor  = hexToRgba(style.dotActiveHex,  style.dotActiveOpacity)    || style.dotActiveHex;

    root.style.setProperty('--color-title',      titleColor);
    root.style.setProperty('--color-desc',       descColor);
    root.style.setProperty('--color-overlay',    overlayColor);
    root.style.setProperty('--color-dot',        dotColor);
    root.style.setProperty('--color-dot-active', dotActiveColor);
    root.style.setProperty('--card-radius',      style.cardRadius + 'px');
    root.style.setProperty('--title-size',       style.titleSize + 'px');
    root.style.setProperty('--title-letter',     style.titleLetter);
    root.style.setProperty('--title-line',       style.titleLine);
    root.style.setProperty('--title-weight',     style.titleWeight);
    root.style.setProperty('--desc-size',        style.descSize + 'px');
    root.style.setProperty('--desc-letter',      style.descLetter);
    root.style.setProperty('--desc-line',        style.descLine);
    root.style.setProperty('--desc-weight',      style.descWeight);
    root.style.setProperty('--overlay-opacity',  style.overlayOpacity / 100);
    root.style.setProperty('--slide-speed',      style.slideSpeed + 'ms');
    root.style.setProperty('--card-bg',          style.cardBgHex);

    root.setAttribute('data-ratio',      style.ratio);
    root.setAttribute('data-hover-zoom', String(style.hoverZoom));

    /* Swatch 업데이트 */
    document.getElementById('hscCardBgSwatch').style.background    = style.cardBgHex;
    document.getElementById('hscTitleSwatch').style.background     = titleColor;
    document.getElementById('hscDescSwatch').style.background      = descColor;
    document.getElementById('hscOverlaySwatch').style.background   = overlayColor;
    document.getElementById('hscDotSwatch').style.background       = dotColor;
    document.getElementById('hscDotActiveSwatch').style.background = dotActiveColor;
  }

  /* ── Render: widget cards ── */
  function renderWidget() {
    var viewport = root.querySelector('[data-viewport]');
    if (slider.observer) { slider.observer.disconnect(); slider.observer = null; }
    if (slider.resizeObserver) { slider.resizeObserver.disconnect(); }

    var track = root.querySelector('[data-track]');
    track.innerHTML = '';

    items.forEach(function (item) {
      var li = document.createElement('li');
      li.className = 'iw-dir__card';
      li.setAttribute('data-card', '');
      li.dataset.id = item.id;
      li.innerHTML =
        '<div class="iw-dir__media">' +
          (item.imgSrc
            ? '<img src="' + escAttr(item.imgSrc) + '" alt="" aria-hidden="true"' +
              ' style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;">'
            : '<div class="iw-dir__placeholder" aria-hidden="true">' +
              '<span class="iw-dir__placeholder-mark">IMAGE</span>' +
              '</div>') +
          '<div class="iw-dir__overlay" aria-hidden="true"></div>' +
        '</div>' +
        '<div class="iw-dir__text">' +
          '<div class="iw-dir__title editor-content">' + esc(item.title) + '</div>' +
          '<div class="iw-dir__desc editor-content">'  + esc(item.desc)  + '</div>' +
        '</div>';
      track.appendChild(li);
    });

    applyStyle();
    slider.init();
  }

  /* ── Slider ── */
  var slider = {
    activeIndex:    0,
    timerId:        null,
    observer:       null,
    resizeObserver: null,

    init: function () {
      var self       = this;
      var viewport   = root.querySelector('[data-viewport]');
      var track      = root.querySelector('[data-track]');
      var pagination = root.querySelector('[data-pagination]');
      var cards      = track.querySelectorAll('[data-card]');

      if (!viewport || !track || cards.length === 0) return;

      self.activeIndex = 0;
      self.buildDots(pagination, cards);
      self.render(viewport, track, cards, pagination);
      self.startAutoplay(track, cards, viewport, pagination);

      root.addEventListener('focusin',  function () { self.stopAutoplay(); });
      root.addEventListener('focusout', function () { self.startAutoplay(track, cards, viewport, pagination); });

      if (self.resizeObserver) self.resizeObserver.disconnect();
      self.resizeObserver = new ResizeObserver(function () {
        self.render(viewport, track, cards, pagination);
      });
      self.resizeObserver.observe(viewport);

      self.setupHoverScroll(viewport, track, cards, pagination);
      self.setupDrag(track, viewport, cards, pagination);
    },

    normalizeIndex: function (index, total) {
      if (total === 0) return 0;
      if (index < 0) return total - 1;
      if (index >= total) return 0;
      return index;
    },

    buildDots: function (pagination, cards) {
      if (!pagination) return;
      pagination.innerHTML = '';
      if (cards.length < 2) { pagination.setAttribute('hidden', ''); return; }
      pagination.removeAttribute('hidden');

      var self = this;
      for (var i = 0; i < cards.length; i++) {
        (function (idx) {
          var dot = document.createElement('button');
          dot.className = 'iw-dir__dot';
          dot.type = 'button';
          dot.setAttribute('data-index', String(idx));
          dot.setAttribute('data-state', idx === self.activeIndex ? 'active' : 'inactive');
          dot.setAttribute('aria-label', (idx + 1) + '번째 슬라이드로 이동');
          dot.setAttribute('aria-current', idx === self.activeIndex ? 'true' : 'false');
          dot.addEventListener('click', function () {
            var viewport   = root.querySelector('[data-viewport]');
            var track      = root.querySelector('[data-track]');
            var cards      = track.querySelectorAll('[data-card]');
            var pagination = root.querySelector('[data-pagination]');
            self.goTo(idx, viewport, track, cards, pagination);
            self.startAutoplay(track, cards, viewport, pagination);
          });
          pagination.appendChild(dot);
        })(i);
      }
    },

    updateDots: function (pagination, cards) {
      var self = this;
      if (!pagination) return;
      pagination.querySelectorAll('.iw-dir__dot').forEach(function (dot, i) {
        var active = i === self.activeIndex;
        dot.setAttribute('data-state', active ? 'active' : 'inactive');
        dot.setAttribute('aria-current', active ? 'true' : 'false');
      });
    },

    render: function (viewport, track, cards, pagination) {
      var target = cards[this.activeIndex];
      if (!target) return;
      var centerOffset = (viewport.offsetWidth - target.offsetWidth) / 2;
      var shift = target.offsetLeft - centerOffset;
      track.style.transform = 'translateX(' + (-shift) + 'px)';
      root.setAttribute('data-active', String(this.activeIndex));
      this.updateDots(pagination, cards);
    },

    goTo: function (index, viewport, track, cards, pagination) {
      this.activeIndex = this.normalizeIndex(index, cards.length);
      this.render(viewport, track, cards, pagination);
    },

    stopAutoplay: function () {
      if (this.timerId === null) return;
      clearInterval(this.timerId);
      this.timerId = null;
    },

    startAutoplay: function (track, cards, viewport, pagination) {
      var self = this;
      self.stopAutoplay();
      if (!style.autoplay || cards.length < 2) return;
      self.timerId = setInterval(function () {
        self.goTo(self.activeIndex + 1, viewport, track, cards, pagination);
      }, style.interval);
    },

    setupDrag: function (track, viewport, cards, pagination) {
      var self = this;

      track.addEventListener('mousedown', function (e) {
        if (e.button !== 0) return;
        var matrix = new DOMMatrix(getComputedStyle(track).transform);
        dragState.active        = true;
        dragState.startX        = e.clientX;
        dragState.prevTranslate = matrix.m41;
        track.classList.add('is-dragging');
        self.stopAutoplay();
        e.preventDefault();
      });
    },

    setupHoverScroll: function (viewport, track, cards, pagination) {
      var self = this;
      if (cards.length < 2) return;

      var DWELL_MS = 500;
      var hoverTimer = null;

      /* 기존 zone 제거 후 재생성 */
      viewport.querySelectorAll('.iw-dir__hover-zone').forEach(function (z) { z.remove(); });

      var prevZone = document.createElement('div');
      prevZone.className = 'iw-dir__hover-zone iw-dir__hover-zone--prev';
      prevZone.setAttribute('aria-hidden', 'true');

      var nextZone = document.createElement('div');
      nextZone.className = 'iw-dir__hover-zone iw-dir__hover-zone--next';
      nextZone.setAttribute('aria-hidden', 'true');

      viewport.style.position = 'relative';
      viewport.appendChild(prevZone);
      viewport.appendChild(nextZone);

      function clearTimer() { clearTimeout(hoverTimer); hoverTimer = null; }

      prevZone.addEventListener('mouseenter', function () {
        clearTimer();
        hoverTimer = setTimeout(function () {
          self.goTo(self.activeIndex - 1, viewport, track, cards, pagination);
          self.startAutoplay(track, cards, viewport, pagination);
        }, DWELL_MS);
      });
      prevZone.addEventListener('mouseleave', clearTimer);

      nextZone.addEventListener('mouseenter', function () {
        clearTimer();
        hoverTimer = setTimeout(function () {
          self.goTo(self.activeIndex + 1, viewport, track, cards, pagination);
          self.startAutoplay(track, cards, viewport, pagination);
        }, DWELL_MS);
      });
      nextZone.addEventListener('mouseleave', clearTimer);
    }
  };

  /* ── Render: inspector item list ── */
  var UPLOAD_SVG =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"' +
    ' stroke-linecap="round" stroke-linejoin="round" width="14" height="14">' +
    '<polyline points="8,10 8,3"/><polyline points="5,6 8,3 11,6"/>' +
    '<path d="M3 12v.5A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5V12"/>' +
    '</svg>';

  var DELETE_SVG =
    '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"' +
    ' stroke-linecap="round" stroke-linejoin="round" width="13" height="13">' +
    '<polyline points="1,3 13,3"/>' +
    '<path d="M4,3V2.5A.5.5,0,0,1,4.5,2h5A.5.5,0,0,1,10,2.5V3"/>' +
    '<rect x="2" y="3" width="10" height="9" rx="1"/>' +
    '<line x1="5" y1="6" x2="5" y2="10"/>' +
    '<line x1="9" y1="6" x2="9" y2="10"/>' +
    '</svg>';

  var DRAG_SVG =
    '<svg viewBox="0 0 8 14" fill="currentColor" width="8" height="14">' +
    '<circle cx="2" cy="2" r="1.2"/><circle cx="6" cy="2" r="1.2"/>' +
    '<circle cx="2" cy="7" r="1.2"/><circle cx="6" cy="7" r="1.2"/>' +
    '<circle cx="2" cy="12" r="1.2"/><circle cx="6" cy="12" r="1.2"/>' +
    '</svg>';

  function renderInspectorItems() {
    itemListEl.innerHTML = '';

    items.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'inspector__card-item';
      row.dataset.id = item.id;
      row.innerHTML =
        '<span class="inspector__drag">' + DRAG_SVG + '</span>' +
        '<div class="inspector__card-fields" style="flex-direction:column;gap:4px">' +
          '<input class="inspector__card-name-input hsc-title-input" type="text"' +
            ' value="' + escAttr(item.title) + '" placeholder="제목">' +
          '<input class="inspector__card-name-input hsc-desc-input" type="text"' +
            ' value="' + escAttr(item.desc) + '" placeholder="설명">' +
          '<div style="display:flex;align-items:center;gap:6px;margin-top:2px">' +
            '<span style="font-size:11px;color:#868e96;flex-shrink:0">이미지</span>' +
            '<div class="inspector__img-upload' + (item.imgSrc ? ' inspector__img-upload--filled' : '') + '">' +
              '<div class="inspector__img-thumb' + (item.imgSrc ? ' inspector__img-thumb--filled' : '') + '">' +
                (item.imgSrc ? '<img src="' + escAttr(item.imgSrc) + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">' : UPLOAD_SVG) +
              '</div>' +
              '<button class="inspector__img-clear" type="button" title="이미지 제거">&#x2715;</button>' +
              '<input type="file" accept="image/*" style="display:none">' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<button class="inspector__card-delete" type="button" aria-label="삭제">' + DELETE_SVG + '</button>';

      row.querySelector('.hsc-title-input').addEventListener('input', function (e) {
        item.title = e.target.value;
        var el = root.querySelector('.iw-dir__card[data-id="' + item.id + '"] .iw-dir__title');
        if (el) el.textContent = item.title;
      });

      row.querySelector('.hsc-desc-input').addEventListener('input', function (e) {
        item.desc = e.target.value;
        var el = root.querySelector('.iw-dir__card[data-id="' + item.id + '"] .iw-dir__desc');
        if (el) el.textContent = item.desc;
      });
      /* 이미지 업로드 */
      (function () {
        var uploadWrap = row.querySelector('.inspector__img-upload');
        var thumb      = row.querySelector('.inspector__img-thumb');
        var clearBtn   = row.querySelector('.inspector__img-clear');
        var fileInput  = row.querySelector('input[type="file"]');
        thumb.addEventListener('click', function () { fileInput.click(); });
        fileInput.addEventListener('change', function (e) {
          var file = e.target.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = function (ev) {
            item.imgSrc = ev.target.result;
            var mediaEl = root.querySelector('.iw-dir__card[data-id="' + item.id + '"] .iw-dir__media');
            if (mediaEl) {
              var placeholder = mediaEl.querySelector('.iw-dir__placeholder');
              if (placeholder) placeholder.remove();
              var imgEl = mediaEl.querySelector('img');
              if (!imgEl) {
                imgEl = document.createElement('img');
                imgEl.alt = ''; imgEl.setAttribute('aria-hidden', 'true');
                imgEl.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;';
                mediaEl.insertBefore(imgEl, mediaEl.firstChild);
              }
              imgEl.src = item.imgSrc;
            }
            thumb.innerHTML = '<img src="' + item.imgSrc + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">';
            thumb.classList.add('inspector__img-thumb--filled');
            uploadWrap.classList.add('inspector__img-upload--filled');
            fileInput.value = '';
          };
          reader.readAsDataURL(file);
        });
        clearBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          item.imgSrc = '';
          var mediaEl = root.querySelector('.iw-dir__card[data-id="' + item.id + '"] .iw-dir__media');
          if (mediaEl) {
            var imgEl = mediaEl.querySelector('img');
            if (imgEl) imgEl.remove();
            if (!mediaEl.querySelector('.iw-dir__placeholder')) {
              var ph = document.createElement('div');
              ph.className = 'iw-dir__placeholder'; ph.setAttribute('aria-hidden', 'true');
              ph.innerHTML = '<span class="iw-dir__placeholder-mark">IMAGE</span>';
              mediaEl.insertBefore(ph, mediaEl.firstChild);
            }
          }
          thumb.innerHTML = UPLOAD_SVG;
          thumb.classList.remove('inspector__img-thumb--filled');
          uploadWrap.classList.remove('inspector__img-upload--filled');
          fileInput.value = '';
        });
      })();
      row.querySelector('.inspector__card-delete').addEventListener('click', function () {
        if (items.length <= 1) return;
        items = items.filter(function (it) { return it.id !== item.id; });
        renderWidget();
        renderInspectorItems();
      });

      setupDragDrop(row, item.id);
      itemListEl.appendChild(row);
    });
  }

  /* ── Drag & drop ── */
  function setupDragDrop(row, id) {
    var handle = row.querySelector('.inspector__drag');
    handle.addEventListener('mousedown', function () { row.setAttribute('draggable', 'true'); });

    row.addEventListener('dragstart', function (e) {
      dragSrcId = id;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(function () { row.classList.add('dragging'); }, 0);
    });
    row.addEventListener('dragend', function () {
      row.setAttribute('draggable', 'false');
      row.classList.remove('dragging');
      clearDragIndicators();
      dragSrcId = null;
    });
    row.addEventListener('dragover', function (e) {
      e.preventDefault();
      if (dragSrcId === id) return;
      clearDragIndicators();
      var mid = row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2;
      row.classList.add(e.clientY < mid ? 'drag-over-top' : 'drag-over-bottom');
    });
    row.addEventListener('drop', function (e) {
      e.preventDefault();
      if (dragSrcId === null || dragSrcId === id) return;
      var mid    = row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2;
      var before = e.clientY < mid;
      var srcIdx = items.findIndex(function (it) { return it.id === dragSrcId; });
      var moved  = items.splice(srcIdx, 1)[0];
      var dstIdx = items.findIndex(function (it) { return it.id === id; });
      items.splice(before ? dstIdx : dstIdx + 1, 0, moved);
      renderWidget();
      renderInspectorItems();
    });
  }

  function clearDragIndicators() {
    itemListEl.querySelectorAll('.inspector__card-item').forEach(function (r) {
      r.classList.remove('drag-over-top', 'drag-over-bottom');
    });
  }

  /* ── Add item ── */
  document.getElementById('addHscItem').addEventListener('click', function () {
    items.push({ id: nextId++, title: 'Title', desc: 'Description', imgSrc: '' });
    renderWidget();
    renderInspectorItems();
  });

  /* ── Color control helper ── */
  function bindColor(pickerId, hexId, opacityId, swatchId, hexKey, opKey) {
    var picker  = document.getElementById(pickerId);
    var hexEl   = document.getElementById(hexId);
    var opEl    = document.getElementById(opacityId);
    var swatch  = document.getElementById(swatchId);

    picker.addEventListener('input', function () {
      style[hexKey] = picker.value.toUpperCase();
      hexEl.value = style[hexKey];
      applyStyle();
    });
    hexEl.addEventListener('input', function () {
      var v = hexEl.value;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        style[hexKey] = v.toUpperCase();
        picker.value  = v;
        applyStyle();
      }
    });
    if (opEl) {
      opEl.addEventListener('input', function () {
        style[opKey] = clamp(opEl.value, 0, 100);
        applyStyle();
      });
    }
  }

  /* ── Number control helper ── */
  function bindNum(id, key, min, max, onChange) {
    document.getElementById(id).addEventListener('input', function (e) {
      style[key] = clamp(e.target.value, min, max);
      if (onChange) onChange();
      else applyStyle();
    });
  }

  /* ── Wire up controls ── */

  /* 재생 */
  document.getElementById('hscAutoplay').addEventListener('change', function (e) {
    style.autoplay = e.target.checked;
    var viewport   = root.querySelector('[data-viewport]');
    var track      = root.querySelector('[data-track]');
    var cards      = track.querySelectorAll('[data-card]');
    var pagination = root.querySelector('[data-pagination]');
    slider.startAutoplay(track, cards, viewport, pagination);
  });
  bindNum('hscInterval',   'interval',   500, 30000);
  bindNum('hscSlideSpeed', 'slideSpeed', 100, 3000, function () {
    root.style.setProperty('--slide-speed', style.slideSpeed + 'ms');
  });
  document.getElementById('hscHoverZoom').addEventListener('change', function (e) {
    style.hoverZoom = e.target.checked;
    root.setAttribute('data-hover-zoom', String(style.hoverZoom));
  });

  /* 카드 배경색 (opacity 없음) */
  (function () {
    var picker = document.getElementById('hscCardBgPicker');
    var hexEl  = document.getElementById('hscCardBgHex');
    var swatch = document.getElementById('hscCardBgSwatch');
    picker.addEventListener('input', function () {
      style.cardBgHex = picker.value.toUpperCase();
      hexEl.value = style.cardBgHex;
      swatch.style.background = style.cardBgHex;
      root.style.setProperty('--card-bg', style.cardBgHex);
    });
    hexEl.addEventListener('input', function () {
      var v = hexEl.value;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        style.cardBgHex = v.toUpperCase();
        picker.value = v;
        swatch.style.background = style.cardBgHex;
        root.style.setProperty('--card-bg', style.cardBgHex);
      }
    });
  })();

  /* 레이아웃 */
  document.getElementById('hscRatio').addEventListener('change', function (e) {
    style.ratio = e.target.value;
    root.setAttribute('data-ratio', style.ratio);
  });
  bindNum('hscCardRadius', 'cardRadius', 0, 80, function () {
    root.style.setProperty('--card-radius', style.cardRadius + 'px');
  });

  /* 텍스트 */
  bindNum('hscTitleSize',   'titleSize',   8,   120, function () { root.style.setProperty('--title-size',   style.titleSize   + 'px'); });
  bindNum('hscTitleLetter', 'titleLetter', -20, 20,  function () { root.style.setProperty('--title-letter', style.titleLetter); });
  bindNum('hscTitleLine',   'titleLine',   0.8, 3,   function () { root.style.setProperty('--title-line',   style.titleLine); });
  bindNum('hscTitleWeight', 'titleWeight', 100, 900, function () { root.style.setProperty('--title-weight', style.titleWeight); });
  bindColor('hscTitlePicker', 'hscTitleHex', 'hscTitleOpacity', 'hscTitleSwatch', 'titleHex', 'titleOpacity');

  bindNum('hscDescSize',   'descSize',   8,   60,  function () { root.style.setProperty('--desc-size',   style.descSize   + 'px'); });
  bindNum('hscDescLetter', 'descLetter', -20, 20,  function () { root.style.setProperty('--desc-letter', style.descLetter); });
  bindNum('hscDescLine',   'descLine',   0.8, 3,   function () { root.style.setProperty('--desc-line',   style.descLine); });
  bindNum('hscDescWeight', 'descWeight', 100, 900, function () { root.style.setProperty('--desc-weight', style.descWeight); });
  bindColor('hscDescPicker', 'hscDescHex', 'hscDescOpacity', 'hscDescSwatch', 'descHex', 'descOpacity');

  /* 컬러 */
  bindColor('hscOverlayPicker', 'hscOverlayHex', 'hscOverlayColorOpacity', 'hscOverlaySwatch', 'overlayHex', 'overlayColorOpacity');
  bindNum('hscOverlayOpacity', 'overlayOpacity', 0, 100, function () {
    root.style.setProperty('--overlay-opacity', style.overlayOpacity / 100);
  });
  bindColor('hscDotPicker',       'hscDotHex',       'hscDotOpacity',       'hscDotSwatch',       'dotHex',       'dotOpacity');
  bindColor('hscDotActivePicker', 'hscDotActiveHex', 'hscDotActiveOpacity', 'hscDotActiveSwatch', 'dotActiveHex', 'dotActiveOpacity');

  /* ── Section collapse ── */
  document.getElementById('horizonScrollCardInspector').querySelectorAll('.inspector__sec-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.closest('.inspector__section').classList.toggle('collapsed');
    });
  });

  /* ── Inspector close ── */
  document.getElementById('horizonScrollCardInspectorClose').addEventListener('click', function () {
    document.getElementById('horizonScrollCardInspector').style.display = 'none';
  });

  /* ── Widget delete ── */
  document.getElementById('horizonScrollCardDelete').addEventListener('click', function () {
    if (confirm('위젯을 삭제하시겠습니까?')) {
      root.remove();
      document.getElementById('horizonScrollCardInspector').style.display = 'none';
    }
  });

  /* ── 드래그 document 핸들러 (한 번만 등록) ── */
  document.addEventListener('mousemove', function (e) {
    if (!dragState.active) return;
    var track = root.querySelector('[data-track]');
    if (!track) return;
    var delta = e.clientX - dragState.startX;
    track.style.transform = 'translateX(' + (dragState.prevTranslate + delta) + 'px)';
  });

  document.addEventListener('mouseup', function (e) {
    if (!dragState.active) return;
    dragState.active = false;

    var viewport   = root.querySelector('[data-viewport]');
    var track      = root.querySelector('[data-track]');
    if (!track) return;
    var cards      = track.querySelectorAll('[data-card]');
    var pagination = root.querySelector('[data-pagination]');

    track.classList.remove('is-dragging');

    var delta = e.clientX - dragState.startX;
    if (Math.abs(delta) > 50) {
      slider.goTo(delta < 0 ? slider.activeIndex + 1 : slider.activeIndex - 1, viewport, track, cards, pagination);
    } else {
      slider.render(viewport, track, cards, pagination);
    }
    slider.startAutoplay(track, cards, viewport, pagination);
  });

  /* ── Init ── */
  renderWidget();
  renderInspectorItems();

})();
