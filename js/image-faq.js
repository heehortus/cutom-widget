/* =====================================
   Image FAQ Widget — Controller
   ===================================== */

(function () {
  'use strict';

  /* ── State ── */
  var nextId       = 3;
  var nextDetailId = 10;
  var imgUrl       = '';

  var items = [
    {
      id: 1,
      title: 'Title',
      details: [
        { id: 1, dTitle: 'Sub Title', dBody: 'Description.' }
      ]
    },
    {
      id: 2,
      title: 'Title',
      details: [
        { id: 2, dTitle: 'Sub Title', dBody: 'Description.' }
      ]
    }
  ];

  var style = {
    gap:           24,
    itemGap:       16,
    imgRadius:     16,
    imgBgHex:      '#CED4DA',
    imgBgOpacity:  100,
    itemRadius:    16,
    borderHex:     '#E1E1E1',
    borderOpacity: 100,
    itemBgHex:     '#FFFFFF',
    itemBgOpacity: 100,
    headPy:        28,
    headPx:        32,
    titleSize:     24,
    titleHex:      '#222222',
    titleOpacity:  100,
    dTitleSize:    20,
    dTitleHex:     '#555555',
    dTitleOpacity: 100,
    dBodySize:     16,
    dBodyHex:      '#5E5E5E',
    dBodyOpacity:  100
  };

  var dragSrcId = null;

  /* ── Detail panel ── */
  var currentDetailItem = null;
  var detailEl = null;

  /* ── DOM refs ── */
  var wrap       = document.getElementById('imgFaqWrap');
  var itemListEl = document.getElementById('imfItemList');

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
    var imgBg       = hexToRgba(style.imgBgHex,   style.imgBgOpacity)   || style.imgBgHex;
    var borderColor = hexToRgba(style.borderHex,  style.borderOpacity)  || style.borderHex;
    var itemBg      = hexToRgba(style.itemBgHex,  style.itemBgOpacity)  || style.itemBgHex;
    var titleColor  = hexToRgba(style.titleHex,   style.titleOpacity)   || style.titleHex;
    var dTitleColor = hexToRgba(style.dTitleHex,  style.dTitleOpacity)  || style.dTitleHex;
    var dBodyColor  = hexToRgba(style.dBodyHex,   style.dBodyOpacity)   || style.dBodyHex;

    wrap.style.setProperty('--ac-gap',            style.gap        + 'px');
    wrap.style.setProperty('--ac-item-gap',       style.itemGap    + 'px');
    wrap.style.setProperty('--ac-img-radius',     style.imgRadius  + 'px');
    wrap.style.setProperty('--ac-img-bg',         imgBg);
    wrap.style.setProperty('--ac-item-radius',    style.itemRadius + 'px');
    wrap.style.setProperty('--ac-border-color',   borderColor);
    wrap.style.setProperty('--ac-item-bg',        itemBg);
    wrap.style.setProperty('--ac-head-py',        style.headPy + 'px');
    wrap.style.setProperty('--ac-head-px',        style.headPx + 'px');
    wrap.style.setProperty('--ac-title-size',     style.titleSize  + 'px');
    wrap.style.setProperty('--ac-title-color',    titleColor);
    wrap.style.setProperty('--ac-d-title-size',   style.dTitleSize + 'px');
    wrap.style.setProperty('--ac-d-title-color',  dTitleColor);
    wrap.style.setProperty('--ac-d-body-size',    style.dBodySize  + 'px');
    wrap.style.setProperty('--ac-d-body-color',   dBodyColor);

    document.getElementById('imfImgBgSwatch').style.background   = imgBg;
    document.getElementById('imfBorderSwatch').style.background  = borderColor;
    document.getElementById('imfItemBgSwatch').style.background  = itemBg;
    document.getElementById('imfTitleSwatch').style.background   = titleColor;
    document.getElementById('imfDTitleSwatch').style.background  = dTitleColor;
    document.getElementById('imfDBodySwatch').style.background   = dBodyColor;
  }

  /* ── SVG 상수 ── */
  var UPLOAD_SVG =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"' +
    ' stroke-linecap="round" stroke-linejoin="round" width="14" height="14">' +
    '<polyline points="8,10 8,3"/><polyline points="5,6 8,3 11,6"/>' +
    '<path d="M3 12v.5A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5V12"/>' +
    '</svg>';

  var CHEVRON_SVG =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none">' +
    '<path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.8"' +
    ' stroke-linecap="round" stroke-linejoin="round"/></svg>';

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

  /* ── Render widget ── */
  function renderWidget() {
    var imgTag = imgUrl ? '<img class="wg-ac__img" src="' + escAttr(imgUrl) + '" alt="">' : '';

    var rightHtml = '';
    items.forEach(function (item) {
      var detailsHtml = item.details.map(function (d) {
        return '<div class="wg-ac__detail" data-detail-id="' + d.id + '">' +
          '<p class="wg-ac__d-title">' + esc(d.dTitle) + '</p>' +
          '<p class="wg-ac__d-body">'  + esc(d.dBody)  + '</p>' +
        '</div>';
      }).join('');

      rightHtml +=
        '<div class="wg-ac__item" data-id="' + item.id + '">' +
          '<button class="wg-ac__head" type="button" data-head aria-expanded="false">' +
            '<p class="wg-ac__title">' + esc(item.title) + '</p>' +
            '<span class="wg-ac__icon" aria-hidden="true">' + CHEVRON_SVG + '</span>' +
          '</button>' +
          '<div class="wg-ac__panel" data-panel>' +
            '<div class="wg-ac__panel-inner">' +
              '<div class="wg-ac__divider"></div>' +
              detailsHtml +
            '</div>' +
          '</div>' +
        '</div>';
    });

    wrap.innerHTML =
      '<div class="wg-ac__left">' +
        '<div class="wg-ac__img-wrap">' +
          imgTag +
          '<div class="wg-ac__img-grad"></div>' +
        '</div>' +
      '</div>' +
      '<div class="wg-ac__right">' + rightHtml + '</div>';

    applyStyle();
    setupAccordion();
  }

  /* ── Accordion ── */
  function setupAccordion() {
    var acItems = wrap.querySelectorAll('.wg-ac__item');

    function setPanel(item, open) {
      var panel = item.querySelector('[data-panel]');
      var head  = item.querySelector('[data-head]');
      if (open) {
        item.classList.add('is-open');
        head.setAttribute('aria-expanded', 'true');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      } else {
        item.classList.remove('is-open');
        head.setAttribute('aria-expanded', 'false');
        panel.style.maxHeight = '0px';
      }
    }

    acItems.forEach(function (item) {
      item.querySelector('[data-head]').addEventListener('click', function () {
        var open = !item.classList.contains('is-open');
        if (open) {
          acItems.forEach(function (m) { if (m !== item) setPanel(m, false); });
        }
        setPanel(item, open);
      });
      setPanel(item, item.classList.contains('is-open'));
    });
  }

  window.addEventListener('resize', function () {
    wrap.querySelectorAll('.wg-ac__item.is-open').forEach(function (item) {
      var panel = item.querySelector('[data-panel]');
      if (panel) panel.style.maxHeight = panel.scrollHeight + 'px';
    });
  }, { passive: true });

  /* ── Detail panel ── */
  function createDetailPanel() {
    var inspectorEl = document.getElementById('imgFaqInspector');
    var panel = document.createElement('div');
    panel.className = 'inspector__detail';
    panel.innerHTML =
      '<div class="inspector__detail-head">' +
        '<button class="inspector__detail-back" type="button">' +
          '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"' +
          ' stroke-linecap="round" stroke-linejoin="round" width="11" height="11">' +
          '<polyline points="10,3 4,8 10,13"/></svg>' +
          'FAQ 아이템' +
        '</button>' +
        '<button class="inspector__detail-close" type="button">&#x2715;</button>' +
      '</div>' +
      '<div class="inspector__detail-body" id="imfDetailBody"></div>';
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

    /* 타이틀 */
    var titleField = document.createElement('div');
    titleField.className = 'inspector__field';
    titleField.innerHTML =
      '<label class="inspector__field-label">타이틀</label>' +
      '<input class="inspector__card-name-input" type="text"' +
      ' value="' + escAttr(item.title) + '" placeholder="타이틀" style="width:100%">';
    titleField.querySelector('input').addEventListener('input', function (e) {
      item.title = e.target.value;
      var el = wrap.querySelector('.wg-ac__item[data-id="' + item.id + '"] .wg-ac__title');
      if (el) el.textContent = item.title;
      var rowEl = itemListEl.querySelector('.inspector__item-row[data-id="' + item.id + '"] .inspector__item-name');
      if (rowEl) rowEl.textContent = item.title || '새 타이틀';
    });
    bodyEl.appendChild(titleField);

    /* 디테일 목록 */
    var detailSection = document.createElement('div');
    detailSection.className = 'inspector__field';

    function renderDetailList() {
      detailSection.innerHTML = '';

      item.details.forEach(function (d) {
        var dRow = document.createElement('div');
        dRow.className = 'imf-detail-row';
        dRow.dataset.detailId = d.id;
        dRow.style.cssText = 'display:flex;flex-direction:column;gap:3px;border-left:2px solid #e9ecef;padding:4px 0 4px 8px;margin-bottom:6px';

        dRow.innerHTML =
          '<div style="display:flex;align-items:center;gap:4px">' +
            '<input class="inspector__card-name-input imf-dtitle-input" type="text"' +
              ' value="' + escAttr(d.dTitle) + '" placeholder="소제목" style="flex:1">' +
            '<button class="inspector__card-delete imf-detail-del" type="button" aria-label="항목 삭제">' + DELETE_SVG + '</button>' +
          '</div>' +
          '<input class="inspector__card-name-input imf-dbody-input" type="text"' +
            ' value="' + escAttr(d.dBody) + '" placeholder="내용">';

        dRow.querySelector('.imf-dtitle-input').addEventListener('input', function (e) {
          d.dTitle = e.target.value;
          var el = wrap.querySelector(
            '.wg-ac__item[data-id="' + item.id + '"] ' +
            '.wg-ac__detail[data-detail-id="' + d.id + '"] .wg-ac__d-title'
          );
          if (el) el.textContent = d.dTitle;
        });

        dRow.querySelector('.imf-dbody-input').addEventListener('input', function (e) {
          d.dBody = e.target.value;
          var el = wrap.querySelector(
            '.wg-ac__item[data-id="' + item.id + '"] ' +
            '.wg-ac__detail[data-detail-id="' + d.id + '"] .wg-ac__d-body'
          );
          if (el) el.textContent = d.dBody;
        });

        dRow.querySelector('.imf-detail-del').addEventListener('click', function () {
          if (item.details.length <= 1) return;
          item.details = item.details.filter(function (dt) { return dt.id !== d.id; });
          renderWidget();
          renderDetailList();
        });

        detailSection.appendChild(dRow);
      });

      /* + 항목 추가 */
      var addBtn = document.createElement('button');
      addBtn.className = 'inspector__sec-add imf-add-detail';
      addBtn.type = 'button';
      addBtn.style.fontSize = '11px';
      addBtn.textContent = '+ 항목 추가';
      addBtn.addEventListener('click', function () {
        item.details.push({ id: nextDetailId++, dTitle: 'Sub Title', dBody: 'Description.' });
        renderWidget();
        renderDetailList();
      });
      detailSection.appendChild(addBtn);
    }

    renderDetailList();
    bodyEl.appendChild(detailSection);

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
    var bodyEl = detailEl.querySelector('#imfDetailBody');
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
        '<span class="inspector__item-name">' + esc(item.title || '새 타이틀') + '</span>' +
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
  document.getElementById('addImfItem').addEventListener('click', function () {
    var newItem = {
      id: nextId++,
      title: 'Title',
      details: [{ id: nextDetailId++, dTitle: 'Sub Title', dBody: 'Description.' }]
    };
    items.push(newItem);
    renderWidget(); renderInspectorItems();
    openDetail(newItem);
  });

  /* ── Image URL + File upload ── */
  function setWidgetImg(src) {
    imgUrl = src;
    var imgWrap = wrap.querySelector('.wg-ac__img-wrap');
    if (!imgWrap) return;
    var imgEl = imgWrap.querySelector('.wg-ac__img');
    if (src) {
      if (!imgEl) {
        imgEl = document.createElement('img');
        imgEl.className = 'wg-ac__img'; imgEl.alt = '';
        imgWrap.insertBefore(imgEl, imgWrap.firstChild);
      }
      imgEl.src = src;
    } else {
      if (imgEl) imgEl.remove();
    }
  }

  /* URL 입력 */
  document.getElementById('imfImgUrl').addEventListener('input', function (e) {
    var src = e.target.value.trim();
    setWidgetImg(src);
    var thumb      = document.getElementById('imfImgThumb');
    var uploadWrap = document.getElementById('imfImgUploadWrap');
    if (src) {
      thumb.innerHTML = '<img src="' + src.replace(/"/g, '&quot;') + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">';
      thumb.classList.add('inspector__img-thumb--filled');
      uploadWrap.classList.add('inspector__img-upload--filled');
    } else {
      thumb.innerHTML = UPLOAD_SVG;
      thumb.classList.remove('inspector__img-thumb--filled');
      uploadWrap.classList.remove('inspector__img-upload--filled');
    }
  });

  /* 파일 업로드 */
  (function () {
    var uploadWrap = document.getElementById('imfImgUploadWrap');
    var thumb      = document.getElementById('imfImgThumb');
    var clearBtn   = document.getElementById('imfImgClear');
    var fileInput  = document.getElementById('imfImgFile');
    var urlInput   = document.getElementById('imfImgUrl');

    thumb.addEventListener('click', function () { fileInput.click(); });

    fileInput.addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        setWidgetImg(ev.target.result);
        urlInput.value = '';
        thumb.innerHTML = '<img src="' + ev.target.result.replace(/"/g, '&quot;') + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">';
        thumb.classList.add('inspector__img-thumb--filled');
        uploadWrap.classList.add('inspector__img-upload--filled');
        fileInput.value = '';
      };
      reader.readAsDataURL(file);
    });

    clearBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      setWidgetImg('');
      urlInput.value = '';
      thumb.innerHTML = UPLOAD_SVG;
      thumb.classList.remove('inspector__img-thumb--filled');
      uploadWrap.classList.remove('inspector__img-upload--filled');
      fileInput.value = '';
    });
  })();

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
  bindNum('imfGap',        'gap',        0,  120, function () { wrap.style.setProperty('--ac-gap',            style.gap        + 'px'); });
  bindNum('imfItemGap',    'itemGap',    0,  60,  function () { wrap.style.setProperty('--ac-item-gap',       style.itemGap    + 'px'); });
  bindNum('imfImgRadius',  'imgRadius',  0,  80,  function () { wrap.style.setProperty('--ac-img-radius',     style.imgRadius  + 'px'); });
  bindNum('imfItemRadius', 'itemRadius', 0,  80,  function () { wrap.style.setProperty('--ac-item-radius',    style.itemRadius + 'px'); });
  bindNum('imfHeadPy',     'headPy',     0,  80,  function () { wrap.style.setProperty('--ac-head-py',        style.headPy     + 'px'); });
  bindNum('imfHeadPx',     'headPx',     0,  80,  function () { wrap.style.setProperty('--ac-head-px',        style.headPx     + 'px'); });
  bindNum('imfTitleSize',  'titleSize',  8,  80,  function () { wrap.style.setProperty('--ac-title-size',     style.titleSize  + 'px'); });
  bindNum('imfDTitleSize', 'dTitleSize', 8,  60,  function () { wrap.style.setProperty('--ac-d-title-size',   style.dTitleSize + 'px'); });
  bindNum('imfDBodySize',  'dBodySize',  8,  40,  function () { wrap.style.setProperty('--ac-d-body-size',    style.dBodySize  + 'px'); });

  bindColor('imfImgBgPicker',  'imfImgBgHex',  'imfImgBgOpacity',  'imfImgBgSwatch',  'imgBgHex',   'imgBgOpacity');
  bindColor('imfBorderPicker', 'imfBorderHex', 'imfBorderOpacity', 'imfBorderSwatch', 'borderHex',  'borderOpacity');
  bindColor('imfItemBgPicker', 'imfItemBgHex', 'imfItemBgOpacity', 'imfItemBgSwatch', 'itemBgHex',  'itemBgOpacity');
  bindColor('imfTitlePicker',  'imfTitleHex',  'imfTitleOpacity',  'imfTitleSwatch',  'titleHex',   'titleOpacity');
  bindColor('imfDTitlePicker', 'imfDTitleHex', 'imfDTitleOpacity', 'imfDTitleSwatch', 'dTitleHex',  'dTitleOpacity');
  bindColor('imfDBodyPicker',  'imfDBodyHex',  'imfDBodyOpacity',  'imfDBodySwatch',  'dBodyHex',   'dBodyOpacity');

  /* ── Section collapse ── */
  document.getElementById('imgFaqInspector').querySelectorAll('.inspector__sec-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () { btn.closest('.inspector__section').classList.toggle('collapsed'); });
  });

  /* ── Inspector close ── */
  document.getElementById('imgFaqInspectorClose').addEventListener('click', function () {
    document.getElementById('imgFaqInspector').style.display = 'none';
  });

  /* ── Reset ── */

  function resetAll() {
    if (detailEl) detailEl.classList.remove('open');
    currentDetailItem = null;

    nextId       = 3;
    nextDetailId = 10;
    imgUrl       = '';
    items = [
      { id: 1, title: 'Title', details: [ { id: 1, dTitle: 'Sub Title', dBody: 'Description.' } ] },
      { id: 2, title: 'Title', details: [ { id: 2, dTitle: 'Sub Title', dBody: 'Description.' } ] }
    ];
    style = {
      gap:           24,
      itemGap:       16,
      imgRadius:     16,
      imgBgHex:      '#CED4DA',
      imgBgOpacity:  100,
      itemRadius:    16,
      borderHex:     '#E1E1E1',
      borderOpacity: 100,
      itemBgHex:     '#FFFFFF',
      itemBgOpacity: 100,
      headPy:        28,
      headPx:        32,
      titleSize:     24,
      titleHex:      '#222222',
      titleOpacity:  100,
      dTitleSize:    20,
      dTitleHex:     '#555555',
      dTitleOpacity: 100,
      dBodySize:     16,
      dBodyHex:      '#5E5E5E',
      dBodyOpacity:  100
    };

    /* 이미지 업로드 UI 초기화 */
    var imfThumb  = document.getElementById('imfImgThumb');
    var imfUpload = document.getElementById('imfImgUploadWrap');
    if (imfThumb)  { imfThumb.innerHTML = UPLOAD_SVG; imfThumb.classList.remove('inspector__img-thumb--filled'); }
    if (imfUpload) imfUpload.classList.remove('inspector__img-upload--filled');
    document.getElementById('imfImgUrl').value = '';

    /* 인스펙터 inputs 동기화 */
    document.getElementById('imfGap').value            = 24;
    document.getElementById('imfItemGap').value        = 16;
    document.getElementById('imfImgRadius').value      = 16;
    document.getElementById('imfImgBgPicker').value    = '#ced4da';
    document.getElementById('imfImgBgHex').value       = '#CED4DA';
    document.getElementById('imfImgBgOpacity').value   = 100;
    document.getElementById('imfItemRadius').value     = 16;
    document.getElementById('imfBorderPicker').value   = '#e1e1e1';
    document.getElementById('imfBorderHex').value      = '#E1E1E1';
    document.getElementById('imfBorderOpacity').value  = 100;
    document.getElementById('imfItemBgPicker').value   = '#ffffff';
    document.getElementById('imfItemBgHex').value      = '#FFFFFF';
    document.getElementById('imfItemBgOpacity').value  = 100;
    document.getElementById('imfHeadPy').value         = 28;
    document.getElementById('imfHeadPx').value         = 32;
    document.getElementById('imfTitleSize').value      = 24;
    document.getElementById('imfTitlePicker').value    = '#222222';
    document.getElementById('imfTitleHex').value       = '#222222';
    document.getElementById('imfTitleOpacity').value   = 100;
    document.getElementById('imfDTitleSize').value     = 20;
    document.getElementById('imfDTitlePicker').value   = '#555555';
    document.getElementById('imfDTitleHex').value      = '#555555';
    document.getElementById('imfDTitleOpacity').value  = 100;
    document.getElementById('imfDBodySize').value      = 16;
    document.getElementById('imfDBodyPicker').value    = '#5e5e5e';
    document.getElementById('imfDBodyHex').value       = '#5E5E5E';
    document.getElementById('imfDBodyOpacity').value   = 100;

    renderWidget();
    renderInspectorItems();
  }

  document.getElementById('imgFaqReset').addEventListener('click', resetAll);

  /* ── Init ── */
  detailEl = createDetailPanel();
  renderWidget();
  renderInspectorItems();

})();
