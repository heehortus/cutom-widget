/* =====================================
   Focus Card Widget — Controller
   ===================================== */

(function () {
  'use strict';

  /* ── State ── */
  var nextId = 4;
  var BG_COLORS = ['#b0b8c1', '#9aa4ae', '#8a949d', '#7a848d', '#6a747d', '#5a646d'];

  var items = [
    { id: 1, title: 'Please Enter Card Title', subtitle: 'Please Enter Card Sub-Title.', btnLabel: 'View More', bgColor: BG_COLORS[0], imgSrc: '' },
    { id: 2, title: 'Please Enter Card Title', subtitle: 'Please Enter Card Sub-Title.', btnLabel: 'View More', bgColor: BG_COLORS[1], imgSrc: '' },
    { id: 3, title: 'Please Enter Card Title', subtitle: 'Please Enter Card Sub-Title.', btnLabel: 'View More', bgColor: BG_COLORS[2], imgSrc: '' }
  ];

  var style = {
    btnOnOff:              true,
    titleSize:             24,
    subtitleSize:          16,
    titleGap:              4,
    cardRadius:            8,
    cardHeight:            480,
    titleHex:              '#ffffff',
    titleOpacity:          100,
    subtitleHex:           '#ffffff',
    subtitleOpacity:       100,
    dimHex:                '#000000',
    dimOpacity:            40,
    btnBgHex:              '#ffffff',
    btnBgOpacity:          100,
    btnLabelSize:          14,
    btnLabelWeight:        600,
    btnLabelColorHex:      '#111111',
    btnLabelColorOpacity:  100,
    btnLabelSpacing:       0,
    btnGap:                8,
    hoverShadowHex:        '#000000',
    hoverShadowOpacity:    30
  };

  var dragSrcId = null;

  /* ── Detail panel ── */
  var currentDetailItem = null;
  var detailEl = null;

  /* ── DOM refs ── */
  var wrap       = document.getElementById('focusCardWrap');
  var listEl     = document.getElementById('focusCardList');
  var itemListEl = document.getElementById('fcItemList');

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
    var titleColor       = hexToRgba(style.titleHex,         style.titleOpacity)         || style.titleHex;
    var subtitleColor    = hexToRgba(style.subtitleHex,      style.subtitleOpacity)      || style.subtitleHex;
    var dimColor         = hexToRgba(style.dimHex,           style.dimOpacity)           || style.dimHex;
    var btnBgColor       = hexToRgba(style.btnBgHex,         style.btnBgOpacity)         || style.btnBgHex;
    var btnLabelColor    = hexToRgba(style.btnLabelColorHex, style.btnLabelColorOpacity) || style.btnLabelColorHex;
    var hoverShadowColor = hexToRgba(style.hoverShadowHex,   style.hoverShadowOpacity)   || style.hoverShadowHex;

    wrap.style.setProperty('--card-title-size',    style.titleSize    + 'px');
    wrap.style.setProperty('--card-subtitle-size', style.subtitleSize + 'px');
    wrap.style.setProperty('--card-title-gap',     style.titleGap     + 'px');
    wrap.style.setProperty('--card-radius',        style.cardRadius   + 'px');
    wrap.style.setProperty('--card-height',        style.cardHeight   + 'px');
    wrap.style.setProperty('--color-title',        titleColor);
    wrap.style.setProperty('--color-subtitle',     subtitleColor);
    wrap.style.setProperty('--color-dim',          dimColor);
    wrap.style.setProperty('--color-btn-bg',       btnBgColor);
    wrap.style.setProperty('--btn-gap',            style.btnGap       + 'px');
    wrap.style.setProperty('--btn-label-size',     style.btnLabelSize + 'px');
    wrap.style.setProperty('--btn-label-weight',   style.btnLabelWeight);
    wrap.style.setProperty('--btn-label-color',    btnLabelColor);
    wrap.style.setProperty('--btn-label-spacing',  style.btnLabelSpacing + 'px');
    wrap.style.setProperty('--card-hover-shadow',  '0 20px 40px ' + hoverShadowColor);
    wrap.setAttribute('data-btn', String(style.btnOnOff));

    document.getElementById('fcTitleSwatch').style.background       = titleColor;
    document.getElementById('fcSubtitleSwatch').style.background    = subtitleColor;
    document.getElementById('fcDimSwatch').style.background         = dimColor;
    document.getElementById('fcBtnBgSwatch').style.background       = btnBgColor;
    document.getElementById('fcBtnLabelColorSwatch').style.background = btnLabelColor;
    document.getElementById('fcHoverShadowSwatch').style.background = hoverShadowColor;
  }

  /* ── Render widget ── */
  function renderWidget() {
    listEl.innerHTML = '';
    items.forEach(function (item) {
      var div = document.createElement('div');
      div.className = 'flex-card-item';
      div.dataset.id = item.id;
      div.innerHTML =
        '<a href="#" class="flex-card-link">' +
          '<div class="flex-card-inner">' +
            '<div class="flex-card-bg" style="background:' + escAttr(item.bgColor) + '">' +
              (item.imgSrc ? '<img src="' + escAttr(item.imgSrc) + '" alt="">' : '') +
            '</div>' +
            '<div class="flex-card-content">' +
              '<div class="flex-card-text-zone">' +
                '<div class="flex-card-badge" data-badge="false"></div>' +
                '<h3 class="flex-card-title">'  + esc(item.title)    + '</h3>' +
                '<p  class="flex-card-desc">'   + esc(item.subtitle) + '</p>' +
              '</div>' +
              '<div class="flex-card-circle-btn">' +
                '<span class="flex-card-btn-label">' + esc(item.btnLabel) + '</span>' +
                '<span class="flex-card-btn-icon"></span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</a>';
      listEl.appendChild(div);
    });
    applyStyle();
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

  var ARROW_SVG =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"' +
    ' stroke-linecap="round" stroke-linejoin="round" width="12" height="12">' +
    '<polyline points="6,3 10,8 6,13"/></svg>';

  /* ── Detail panel ── */
  function createDetailPanel() {
    var inspectorEl = document.getElementById('focusCardInspector');
    var panel = document.createElement('div');
    panel.className = 'inspector__detail';
    panel.innerHTML =
      '<div class="inspector__detail-head">' +
        '<button class="inspector__detail-back" type="button">' +
          '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"' +
          ' stroke-linecap="round" stroke-linejoin="round" width="11" height="11">' +
          '<polyline points="10,3 4,8 10,13"/></svg>' +
          '카드 아이템' +
        '</button>' +
        '<button class="inspector__detail-close" type="button">&#x2715;</button>' +
      '</div>' +
      '<div class="inspector__detail-body" id="fcDetailBody"></div>';
    inspectorEl.appendChild(panel);

    panel.querySelector('.inspector__detail-back').addEventListener('click', function () {
      panel.classList.remove('open');
      currentDetailItem = null;
    });
    panel.querySelector('.inspector__detail-close').addEventListener('click', function () {
      panel.classList.remove('open');
      currentDetailItem = null;
      var closeBtn = inspectorEl.querySelector('.inspector__close');
      if (closeBtn) closeBtn.click();
    });

    return panel;
  }

  function renderDetailBody(bodyEl, item) {
    bodyEl.innerHTML = '';

    /* 이미지 */
    var imgField = document.createElement('div');
    imgField.className = 'inspector__field';
    imgField.innerHTML =
      '<label class="inspector__field-label">이미지</label>' +
      '<div class="inspector__img-upload' + (item.imgSrc ? ' inspector__img-upload--filled' : '') + '">' +
        '<div class="inspector__img-thumb' + (item.imgSrc ? ' inspector__img-thumb--filled' : '') + '">' +
          (item.imgSrc ? '<img src="' + escAttr(item.imgSrc) + '" alt="">' : UPLOAD_SVG) +
        '</div>' +
        '<button class="inspector__img-clear" type="button" title="이미지 제거">&#x2715;</button>' +
        '<input type="file" accept="image/*" style="display:none">' +
      '</div>';

    (function () {
      var uploadWrap = imgField.querySelector('.inspector__img-upload');
      var thumb      = imgField.querySelector('.inspector__img-thumb');
      var clearBtn   = imgField.querySelector('.inspector__img-clear');
      var fileInput  = imgField.querySelector('input[type="file"]');
      thumb.addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function (e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (ev) {
          item.imgSrc = ev.target.result;
          var bgEl = listEl.querySelector('.flex-card-item[data-id="' + item.id + '"] .flex-card-bg');
          if (bgEl) {
            var imgEl = bgEl.querySelector('img');
            if (!imgEl) { imgEl = document.createElement('img'); imgEl.alt = ''; bgEl.appendChild(imgEl); }
            imgEl.src = item.imgSrc;
          }
          thumb.innerHTML = '<img src="' + item.imgSrc + '" alt="">';
          thumb.classList.add('inspector__img-thumb--filled');
          uploadWrap.classList.add('inspector__img-upload--filled');
          fileInput.value = '';
        };
        reader.readAsDataURL(file);
      });
      clearBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        item.imgSrc = '';
        var bgEl = listEl.querySelector('.flex-card-item[data-id="' + item.id + '"] .flex-card-bg');
        if (bgEl) { var imgEl = bgEl.querySelector('img'); if (imgEl) imgEl.remove(); }
        thumb.innerHTML = UPLOAD_SVG;
        thumb.classList.remove('inspector__img-thumb--filled');
        uploadWrap.classList.remove('inspector__img-upload--filled');
        fileInput.value = '';
      });
    })();
    bodyEl.appendChild(imgField);

    /* 타이틀 */
    var titleField = document.createElement('div');
    titleField.className = 'inspector__field';
    titleField.innerHTML =
      '<label class="inspector__field-label">타이틀</label>' +
      '<input class="inspector__card-name-input" type="text"' +
      ' value="' + escAttr(item.title) + '" placeholder="타이틀" style="width:100%">';
    titleField.querySelector('input').addEventListener('input', function (e) {
      item.title = e.target.value;
      var el = listEl.querySelector('.flex-card-item[data-id="' + item.id + '"] .flex-card-title');
      if (el) el.textContent = item.title;
      var rowEl = itemListEl.querySelector('.inspector__item-row[data-id="' + item.id + '"] .inspector__item-name');
      if (rowEl) rowEl.textContent = item.title || '새 카드';
    });
    bodyEl.appendChild(titleField);

    /* 서브 텍스트 */
    var subtitleField = document.createElement('div');
    subtitleField.className = 'inspector__field';
    subtitleField.innerHTML =
      '<label class="inspector__field-label">서브 텍스트</label>' +
      '<input class="inspector__card-name-input" type="text"' +
      ' value="' + escAttr(item.subtitle) + '" placeholder="서브 텍스트" style="width:100%">';
    subtitleField.querySelector('input').addEventListener('input', function (e) {
      item.subtitle = e.target.value;
      var el = listEl.querySelector('.flex-card-item[data-id="' + item.id + '"] .flex-card-desc');
      if (el) el.textContent = item.subtitle;
    });
    bodyEl.appendChild(subtitleField);

    /* 버튼 레이블 */
    var btnField = document.createElement('div');
    btnField.className = 'inspector__field';
    btnField.innerHTML =
      '<label class="inspector__field-label">버튼 레이블</label>' +
      '<input class="inspector__card-name-input" type="text"' +
      ' value="' + escAttr(item.btnLabel) + '" placeholder="버튼 레이블" style="width:100%">';
    btnField.querySelector('input').addEventListener('input', function (e) {
      item.btnLabel = e.target.value;
      var el = listEl.querySelector('.flex-card-item[data-id="' + item.id + '"] .flex-card-btn-label');
      if (el) el.textContent = item.btnLabel;
    });
    bodyEl.appendChild(btnField);

    /* 배경색 */
    var bgField = document.createElement('div');
    bgField.className = 'inspector__field';
    bgField.innerHTML =
      '<label class="inspector__field-label">배경색</label>' +
      '<div class="inspector__color-row">' +
        '<span class="inspector__swatch" style="background:' + escAttr(item.bgColor) + '">' +
          '<input type="color" class="inspector__color-native" value="' + escAttr(item.bgColor) + '">' +
        '</span>' +
      '</div>';
    bgField.querySelector('input[type="color"]').addEventListener('input', function (e) {
      item.bgColor = e.target.value;
      bgField.querySelector('.inspector__swatch').style.background = item.bgColor;
      var el = listEl.querySelector('.flex-card-item[data-id="' + item.id + '"] .flex-card-bg');
      if (el) el.style.background = item.bgColor;
    });
    bodyEl.appendChild(bgField);

    /* 삭제 */
    var deleteWrap = document.createElement('div');
    deleteWrap.style.marginTop = '8px';
    deleteWrap.innerHTML =
      '<button class="inspector__delete-btn" type="button">' + DELETE_SVG + '아이템 삭제</button>';
    deleteWrap.querySelector('button').addEventListener('click', function () {
      if (items.length <= 1) return;
      detailEl.classList.remove('open');
      currentDetailItem = null;
      items = items.filter(function (it) { return it.id !== item.id; });
      renderWidget();
      renderInspectorItems();
    });
    bodyEl.appendChild(deleteWrap);
  }

  function openDetail(item) {
    currentDetailItem = item;
    var bodyEl = detailEl.querySelector('#fcDetailBody');
    renderDetailBody(bodyEl, item);
    detailEl.classList.add('open');
  }

  /* ── Render inspector items ── */
  function renderInspectorItems() {
    itemListEl.innerHTML = '';
    items.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'inspector__item-row';
      row.dataset.id = item.id;
      row.innerHTML =
        '<span class="inspector__drag">' + DRAG_SVG + '</span>' +
        '<span class="inspector__item-name">' + esc(item.title || '새 카드') + '</span>' +
        '<span class="inspector__item-arrow">' + ARROW_SVG + '</span>';

      row.addEventListener('click', function (e) {
        if (e.target.closest('.inspector__drag')) return;
        openDetail(item);
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
    itemListEl.querySelectorAll('.inspector__item-row').forEach(function (r) {
      r.classList.remove('drag-over-top', 'drag-over-bottom');
    });
  }

  /* ── Add item ── */
  document.getElementById('addFcItem').addEventListener('click', function () {
    var colorIdx = items.length % BG_COLORS.length;
    var newItem = { id: nextId++, title: 'Please Enter Card Title', subtitle: 'Please Enter Card Sub-Title.', btnLabel: 'View More', bgColor: BG_COLORS[colorIdx], imgSrc: '' };
    items.push(newItem);
    renderWidget(); renderInspectorItems();
    openDetail(newItem);
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
  document.getElementById('fcBtnOnOff').addEventListener('change', function (e) {
    style.btnOnOff = e.target.checked;
    wrap.setAttribute('data-btn', String(style.btnOnOff));
  });

  bindNum('fcTitleSize',    'titleSize',    8,   120, function () { wrap.style.setProperty('--card-title-size',    style.titleSize    + 'px'); });
  bindNum('fcSubtitleSize', 'subtitleSize', 8,   60,  function () { wrap.style.setProperty('--card-subtitle-size', style.subtitleSize + 'px'); });
  bindNum('fcTitleGap',     'titleGap',     0,   60,  function () { wrap.style.setProperty('--card-title-gap',     style.titleGap     + 'px'); });
  bindNum('fcCardRadius',   'cardRadius',   0,   80,  function () { wrap.style.setProperty('--card-radius',        style.cardRadius   + 'px'); });
  bindNum('fcCardHeight',   'cardHeight',   100, 1200, function () { wrap.style.setProperty('--card-height',       style.cardHeight   + 'px'); });

  bindColor('fcTitlePicker',    'fcTitleHex',    'fcTitleOpacity',    'fcTitleSwatch',    'titleHex',    'titleOpacity');
  bindColor('fcSubtitlePicker', 'fcSubtitleHex', 'fcSubtitleOpacity', 'fcSubtitleSwatch', 'subtitleHex', 'subtitleOpacity');
  bindColor('fcDimPicker',      'fcDimHex',      'fcDimOpacity',      'fcDimSwatch',      'dimHex',      'dimOpacity');

  document.getElementById('fcBtnBgOnOff') && document.getElementById('fcBtnBgOnOff');
  bindColor('fcBtnBgPicker',       'fcBtnBgHex',       'fcBtnBgOpacity',       'fcBtnBgSwatch',       'btnBgHex',       'btnBgOpacity');
  bindColor('fcBtnLabelColorPicker','fcBtnLabelColorHex','fcBtnLabelColorOpacity','fcBtnLabelColorSwatch','btnLabelColorHex','btnLabelColorOpacity');
  bindNum('fcBtnLabelSize',    'btnLabelSize',    8,   60, function () { wrap.style.setProperty('--btn-label-size',    style.btnLabelSize + 'px'); });
  bindNum('fcBtnLabelWeight',  'btnLabelWeight',  100, 900, function () { wrap.style.setProperty('--btn-label-weight', style.btnLabelWeight); });
  bindNum('fcBtnLabelSpacing', 'btnLabelSpacing', -10, 20, function () { wrap.style.setProperty('--btn-label-spacing', style.btnLabelSpacing + 'px'); });
  bindNum('fcBtnGap',          'btnGap',          0,   60, function () { wrap.style.setProperty('--btn-gap',           style.btnGap + 'px'); });

  bindColor('fcHoverShadowPicker', 'fcHoverShadowHex', 'fcHoverShadowOpacity', 'fcHoverShadowSwatch', 'hoverShadowHex', 'hoverShadowOpacity');

  /* ── Section collapse ── */
  document.getElementById('focusCardInspector').querySelectorAll('.inspector__sec-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () { btn.closest('.inspector__section').classList.toggle('collapsed'); });
  });

  /* ── Inspector close ── */
  document.getElementById('focusCardInspectorClose').addEventListener('click', function () {
    document.getElementById('focusCardInspector').style.display = 'none';
  });

  /* ── Widget delete ── */
  document.getElementById('focusCardDelete').addEventListener('click', function () {
    if (confirm('위젯을 삭제하시겠습니까?')) {
      wrap.remove();
      document.getElementById('focusCardInspector').style.display = 'none';
    }
  });

  /* ── Init ── */
  detailEl = createDetailPanel();
  renderWidget();
  renderInspectorItems();

})();
