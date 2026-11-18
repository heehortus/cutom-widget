/* =====================================
   Focus Card 2 Widget — Controller
   ===================================== */

(function () {
  'use strict';

  /* ── State ── */
  var nextId = 5;
  var BG_COLORS = ['#b0b8c1', '#9aa4ae', '#8a949d', '#7a848d', '#6a747d', '#5a646d'];

  var items = [
    { id: 1, title: 'Title', body: 'Description', bgColor: BG_COLORS[0], imgSrc: '' },
    { id: 2, title: 'Title', body: 'Description', bgColor: BG_COLORS[1], imgSrc: '' },
    { id: 3, title: 'Title', body: 'Description', bgColor: BG_COLORS[2], imgSrc: '' },
    { id: 4, title: 'Title', body: 'Description', bgColor: BG_COLORS[3], imgSrc: '' }
  ];

  var style = {
    cardRadius:   8,
    cardGap:      24,
    zigzag:       48,
    padding:      36,
    titleSize:    32,
    titleHex:     '#F7F7F7',
    titleOpacity: 100,
    bodySize:     20,
    bodyHex:      '#F7F7F7',
    bodyOpacity:  100,
    dimBase:      15,
    dimHover:     70
  };

  var dragSrcId = null;

  /* ── DOM refs ── */
  var wrap       = document.getElementById('fc2Wrap');
  var itemListEl = document.getElementById('fc2ItemList');

  /* ── Helpers ── */
  function esc(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

  /* ── Apply style vars ── */
  function applyStyle() {
    var titleColor = hexToRgba(style.titleHex, style.titleOpacity) || style.titleHex;
    var bodyColor  = hexToRgba(style.bodyHex,  style.bodyOpacity)  || style.bodyHex;

    wrap.style.setProperty('--cc-card-radius', style.cardRadius + 'px');
    wrap.style.setProperty('--cc-card-gap',    style.cardGap    + 'px');
    wrap.style.setProperty('--cc-zigzag',      style.zigzag     + 'px');
    wrap.style.setProperty('--cc-padding',     style.padding    + 'px');
    wrap.style.setProperty('--cc-title-size',  style.titleSize  + 'px');
    wrap.style.setProperty('--cc-body-size',   style.bodySize   + 'px');
    wrap.style.setProperty('--cc-title-color', titleColor);
    wrap.style.setProperty('--cc-body-color',  bodyColor);
    wrap.style.setProperty('--cc-dim-base',    style.dimBase  / 100);
    wrap.style.setProperty('--cc-dim-hover',   style.dimHover / 100);

    /* Swatch 업데이트 */
    document.getElementById('fc2TitleSwatch').style.background = titleColor;
    document.getElementById('fc2BodySwatch').style.background  = bodyColor;
  }

  /* ── Render widget ── */
  function renderWidget() {
    wrap.innerHTML = '';
    items.forEach(function (item) {
      var div = document.createElement('div');
      div.className = 'wg-cc__card';
      div.dataset.id = item.id;
      div.innerHTML =
        '<div class="wg-cc__img-fallback" style="background:' + escAttr(item.bgColor) + '"></div>' +
        (item.imgSrc ? '<img class="wg-cc__img" src="' + escAttr(item.imgSrc) + '" alt="">' : '') +
        '<div class="wg-cc__dim"></div>' +
        '<div class="wg-cc__top">' +
          '<p class="wg-cc__body">' + esc(item.body) + '</p>' +
        '</div>' +
        '<div class="wg-cc__text">' +
          '<h3 class="wg-cc__title">' + esc(item.title) + '</h3>' +
        '</div>';
      wrap.appendChild(div);
    });
    applyStyle();
    setupObserver();
  }

  /* ── IntersectionObserver for reveal ── */
  function setupObserver() {
    if (!('IntersectionObserver' in window)) {
      wrap.querySelectorAll('.wg-cc__card').forEach(function (c) {
        c.classList.add('is-visible');
      });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    wrap.querySelectorAll('.wg-cc__card').forEach(function (card) {
      observer.observe(card);
    });
  }

  /* ── SVG 상수 ── */
  var UPLOAD_SVG =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"' +
    ' stroke-linecap="round" stroke-linejoin="round" width="14" height="14">' +
    '<polyline points="8,10 8,3"/><polyline points="5,6 8,3 11,6"/>' +
    '<path d="M3 12v.5A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5V12"/>' +
    '</svg>';

  var DELETE_SVG =
    '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"' +
    ' stroke-linecap="round" stroke-linejoin="round" width="13" height="13">' +
    '<polyline points="1,3 13,3"/><path d="M4,3V2.5A.5.5,0,0,1,4.5,2h5A.5.5,0,0,1,10,2.5V3"/>' +
    '<rect x="2" y="3" width="10" height="9" rx="1"/>' +
    '<line x1="5" y1="6" x2="5" y2="10"/><line x1="9" y1="6" x2="9" y2="10"/></svg>';

  var DRAG_SVG =
    '<svg viewBox="0 0 8 14" fill="currentColor" width="8" height="14">' +
    '<circle cx="2" cy="2" r="1.2"/><circle cx="6" cy="2" r="1.2"/>' +
    '<circle cx="2" cy="7" r="1.2"/><circle cx="6" cy="7" r="1.2"/>' +
    '<circle cx="2" cy="12" r="1.2"/><circle cx="6" cy="12" r="1.2"/></svg>';

  /* ── Render inspector items ── */
  function renderInspectorItems() {
    itemListEl.innerHTML = '';
    items.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'inspector__card-item';
      row.dataset.id = item.id;
      row.innerHTML =
        '<span class="inspector__drag">' + DRAG_SVG + '</span>' +
        '<div class="inspector__card-fields" style="flex-direction:column;gap:4px">' +
          '<input class="inspector__card-name-input fc2-title-input" type="text"' +
            ' value="' + escAttr(item.title) + '" placeholder="타이틀">' +
          '<input class="inspector__card-name-input fc2-body-input" type="text"' +
            ' value="' + escAttr(item.body) + '" placeholder="설명">' +
          '<div style="display:flex;align-items:center;gap:6px;margin-top:2px">' +
            '<span style="font-size:11px;color:#868e96;flex-shrink:0">배경색</span>' +
            '<span class="inspector__swatch fc2-item-bg-swatch" style="background:' + escAttr(item.bgColor) + ';flex-shrink:0">' +
              '<input type="color" class="inspector__color-native fc2-item-bg-picker" value="' + escAttr(item.bgColor) + '">' +
            '</span>' +
          '</div>' +
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

      row.querySelector('.fc2-title-input').addEventListener('input', function (e) {
        item.title = e.target.value;
        var el = wrap.querySelector('.wg-cc__card[data-id="' + item.id + '"] .wg-cc__title');
        if (el) el.textContent = item.title;
      });
      row.querySelector('.fc2-body-input').addEventListener('input', function (e) {
        item.body = e.target.value;
        var el = wrap.querySelector('.wg-cc__card[data-id="' + item.id + '"] .wg-cc__body');
        if (el) el.textContent = item.body;
      });
      row.querySelector('.fc2-item-bg-picker').addEventListener('input', function (e) {
        item.bgColor = e.target.value;
        row.querySelector('.fc2-item-bg-swatch').style.background = item.bgColor;
        var el = wrap.querySelector('.wg-cc__card[data-id="' + item.id + '"] .wg-cc__img-fallback');
        if (el) el.style.background = item.bgColor;
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
            var card = wrap.querySelector('.wg-cc__card[data-id="' + item.id + '"]');
            if (card) {
              var imgEl = card.querySelector('.wg-cc__img');
              if (!imgEl) {
                imgEl = document.createElement('img');
                imgEl.className = 'wg-cc__img'; imgEl.alt = '';
                card.insertBefore(imgEl, card.querySelector('.wg-cc__dim'));
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
          var card = wrap.querySelector('.wg-cc__card[data-id="' + item.id + '"]');
          if (card) { var imgEl = card.querySelector('.wg-cc__img'); if (imgEl) imgEl.remove(); }
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
      dragSrcId = id; e.dataTransfer.effectAllowed = 'move';
      setTimeout(function () { row.classList.add('dragging'); }, 0);
    });
    row.addEventListener('dragend', function () {
      row.setAttribute('draggable', 'false');
      row.classList.remove('dragging');
      clearDragIndicators(); dragSrcId = null;
    });
    row.addEventListener('dragover', function (e) {
      e.preventDefault(); if (dragSrcId === id) return;
      clearDragIndicators();
      var mid = row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2;
      row.classList.add(e.clientY < mid ? 'drag-over-top' : 'drag-over-bottom');
    });
    row.addEventListener('drop', function (e) {
      e.preventDefault(); if (dragSrcId === null || dragSrcId === id) return;
      var mid    = row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2;
      var before = e.clientY < mid;
      var srcIdx = items.findIndex(function (it) { return it.id === dragSrcId; });
      var moved  = items.splice(srcIdx, 1)[0];
      var dstIdx = items.findIndex(function (it) { return it.id === id; });
      items.splice(before ? dstIdx : dstIdx + 1, 0, moved);
      renderWidget(); renderInspectorItems();
    });
  }
  function clearDragIndicators() {
    itemListEl.querySelectorAll('.inspector__card-item').forEach(function (r) {
      r.classList.remove('drag-over-top', 'drag-over-bottom');
    });
  }

  /* ── Add item ── */
  document.getElementById('addFc2Item').addEventListener('click', function () {
    var colorIdx = items.length % BG_COLORS.length;
    items.push({ id: nextId++, title: 'Title', body: 'Description', bgColor: BG_COLORS[colorIdx], imgSrc: '' });
    renderWidget(); renderInspectorItems();
  });

  /* ── Control helpers ── */
  function bindColor(pickerId, hexId, opacityId, swatchId, hexKey, opKey) {
    var picker = document.getElementById(pickerId);
    var hexEl  = document.getElementById(hexId);
    var opEl   = opacityId ? document.getElementById(opacityId) : null;
    picker.addEventListener('input', function () {
      style[hexKey] = picker.value.toUpperCase(); hexEl.value = style[hexKey]; applyStyle();
    });
    hexEl.addEventListener('input', function () {
      var v = hexEl.value;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) { style[hexKey] = v.toUpperCase(); picker.value = v; applyStyle(); }
    });
    if (opEl) opEl.addEventListener('input', function () { style[opKey] = clamp(opEl.value, 0, 100); applyStyle(); });
  }
  function bindNum(id, key, min, max, cb) {
    document.getElementById(id).addEventListener('input', function (e) {
      style[key] = clamp(e.target.value, min, max);
      cb ? cb() : applyStyle();
    });
  }

  /* ── Wire controls ── */
  bindNum('fc2CardRadius', 'cardRadius', 0,   80,   function () { wrap.style.setProperty('--cc-card-radius', style.cardRadius + 'px'); });
  bindNum('fc2CardGap',    'cardGap',    0,   120,  function () { wrap.style.setProperty('--cc-card-gap',    style.cardGap    + 'px'); });
  bindNum('fc2Zigzag',     'zigzag',     0,   200,  function () { wrap.style.setProperty('--cc-zigzag',      style.zigzag     + 'px'); });
  bindNum('fc2Padding',    'padding',    0,   120,  function () { wrap.style.setProperty('--cc-padding',     style.padding    + 'px'); });

  bindNum('fc2TitleSize',  'titleSize',  8,   120,  function () { wrap.style.setProperty('--cc-title-size',  style.titleSize  + 'px'); });
  bindNum('fc2BodySize',   'bodySize',   8,   60,   function () { wrap.style.setProperty('--cc-body-size',   style.bodySize   + 'px'); });

  bindColor('fc2TitlePicker', 'fc2TitleHex', 'fc2TitleOpacity', 'fc2TitleSwatch', 'titleHex', 'titleOpacity');
  bindColor('fc2BodyPicker',  'fc2BodyHex',  'fc2BodyOpacity',  'fc2BodySwatch',  'bodyHex',  'bodyOpacity');

  bindNum('fc2DimBase',  'dimBase',  0, 100, function () { wrap.style.setProperty('--cc-dim-base',  style.dimBase  / 100); });
  bindNum('fc2DimHover', 'dimHover', 0, 100, function () { wrap.style.setProperty('--cc-dim-hover', style.dimHover / 100); });

  /* ── Section collapse ── */
  document.getElementById('fc2Inspector').querySelectorAll('.inspector__sec-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () { btn.closest('.inspector__section').classList.toggle('collapsed'); });
  });

  /* ── Inspector close ── */
  document.getElementById('fc2InspectorClose').addEventListener('click', function () {
    document.getElementById('fc2Inspector').style.display = 'none';
  });

  /* ── Widget delete ── */
  document.getElementById('fc2Delete').addEventListener('click', function () {
    if (confirm('위젯을 삭제하시겠습니까?')) {
      wrap.remove();
      document.getElementById('fc2Inspector').style.display = 'none';
    }
  });

  /* ── Init ── */
  renderWidget();
  renderInspectorItems();

})();
