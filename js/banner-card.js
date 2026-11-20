/* =====================================
   Banner Widget Editor — Controller
   ===================================== */

(function () {
  'use strict';

  var ITEM_WIDTH = 280; /* px — card width */
  var GAP        = 16;  /* px — gap between cards */

  /* ── State ──────────────────────────── */

  var nextId = 3;
  var items = [
    { id: 1, title: 'ITEM TITLE', desc: 'ITEM DESCRIPTION', expanded: false, imgSrc: '' },
    { id: 2, title: 'ITEM TITLE', desc: 'ITEM DESCRIPTION', expanded: false, imgSrc: '' }
  ];

  var UPLOAD_SVG = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="8,10 8,3"/><polyline points="5,6 8,3 11,6"/><path d="M3 12v.5A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5V12"/></svg>';
  var bannerImgSrc = '';
  var dragSrcId = null;
  var textStyle = {
    titleSize:         24,
    titleHex:          '#262626',
    titleOpacity:      100,
    descSize:          16,
    descHex:           '#767676',
    descOpacity:       100,
    viewmoreSize:      14,
    viewmoreHex:       '#1A1A1A',
    viewmoreOpacity:   100,
    viewmoreIconSize:  18,
    indicatorTrackHex: '#ADB5BD',
    indicatorThumbHex: '#1A1A1A'
  };

  /* ── DOM refs ───────────────────────── */

  var trackEl      = document.getElementById('carouselTrack');
  var indicatorsEl = document.getElementById('indicators');
  var itemListEl   = document.getElementById('bannerItemList');
  var bannerWidget = document.getElementById('bannerWidget');
  var wrapEl       = trackEl.parentElement;

  /* ── Detail Panel ── */
  var currentDetailItem = null;
  var detailEl = null;

  function createDetailPanel() {
    var inspectorEl = document.querySelector('#bannerInspector');
    var panel = document.createElement('div');
    panel.className = 'inspector__detail';
    panel.innerHTML =
      '<div class="inspector__detail-head">' +
        '<button class="inspector__detail-back" type="button">' +
          '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="11" height="11"><polyline points="10,3 4,8 10,13"/></svg>' +
          '배너 아이템' +
        '</button>' +
        '<button class="inspector__detail-close" type="button">&#x2715;</button>' +
      '</div>' +
      '<div class="inspector__detail-body" id="bannerDetailBody"></div>';
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

    /* 이미지 필드 */
    var imgField = document.createElement('div');
    imgField.innerHTML =
      '<label class="inspector__field-label">이미지</label>' +
      '<div class="inspector__img-upload' + (item.imgSrc ? ' inspector__img-upload--filled' : '') + '">' +
        '<div class="inspector__img-thumb' + (item.imgSrc ? ' inspector__img-thumb--filled' : '') + '">' +
          (item.imgSrc ? '<img src="' + escAttr(item.imgSrc) + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">' : UPLOAD_SVG) +
        '</div>' +
        '<button class="inspector__img-clear" type="button" title="이미지 제거">&#x2715;</button>' +
        '<input type="file" accept="image/*" style="display:none">' +
      '</div>';

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
        var imgArea = trackEl.querySelector('[data-id="' + item.id + '"] .banner-item__image');
        if (imgArea) {
          var imgEl = imgArea.querySelector('img');
          if (!imgEl) { imgEl = document.createElement('img'); imgEl.alt = ''; imgEl.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;'; imgArea.appendChild(imgEl); }
          imgEl.src = item.imgSrc;
        }
        thumb.innerHTML = '<img src="' + item.imgSrc + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">';
        thumb.classList.add('inspector__img-thumb--filled');
        uploadWrap.classList.add('inspector__img-upload--filled');
        fileInput.value = '';
      };
      reader.readAsDataURL(file);
    });
    clearBtn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      item.imgSrc = '';
      var imgArea = trackEl.querySelector('[data-id="' + item.id + '"] .banner-item__image');
      if (imgArea) { var imgEl = imgArea.querySelector('img'); if (imgEl) imgEl.remove(); }
      thumb.innerHTML = UPLOAD_SVG;
      thumb.classList.remove('inspector__img-thumb--filled');
      uploadWrap.classList.remove('inspector__img-upload--filled');
      fileInput.value = '';
    });
    bodyEl.appendChild(imgField);

    /* 제목 필드 */
    var titleField = document.createElement('div');
    titleField.className = 'inspector__field';
    titleField.innerHTML =
      '<label class="inspector__field-label">제목</label>' +
      '<input class="inspector__card-name-input" type="text" value="' + escAttr(item.title) + '" placeholder="ITEM TITLE" style="width:100%">';
    titleField.querySelector('input').addEventListener('input', function (e) {
      updateItemField(item.id, 'title', e.target.value);
      var rowEl = itemListEl.querySelector('[data-id="' + item.id + '"] .inspector__item-name');
      if (rowEl) rowEl.textContent = e.target.value || 'ITEM TITLE';
    });
    bodyEl.appendChild(titleField);

    /* 설명 필드 */
    var descField = document.createElement('div');
    descField.className = 'inspector__field';
    descField.innerHTML =
      '<label class="inspector__field-label">설명</label>' +
      '<input class="inspector__card-role-input" type="text" value="' + escAttr(item.desc) + '" placeholder="ITEM DESCRIPTION" style="width:100%">';
    descField.querySelector('input').addEventListener('input', function (e) {
      updateItemField(item.id, 'desc', e.target.value);
    });
    bodyEl.appendChild(descField);

    /* 삭제 버튼 */
    var deleteWrap = document.createElement('div');
    deleteWrap.style.marginTop = '8px';
    deleteWrap.innerHTML =
      '<button class="inspector__delete-btn" type="button">' +
        '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><polyline points="1,3 13,3"/><path d="M4,3V2.5A.5.5,0,0,1,4.5,2h5A.5.5,0,0,1,10,2.5V3"/><rect x="2" y="3" width="10" height="9" rx="1"/><line x1="5" y1="6" x2="5" y2="10"/><line x1="9" y1="6" x2="9" y2="10"/></svg>' +
        '아이템 삭제' +
      '</button>';
    deleteWrap.querySelector('button').addEventListener('click', function () {
      detailEl.classList.remove('open');
      currentDetailItem = null;
      removeItem(item.id);
    });
    bodyEl.appendChild(deleteWrap);
  }

  function openDetail(item) {
    currentDetailItem = item;
    var bodyEl = detailEl.querySelector('#bannerDetailBody');
    renderDetailBody(bodyEl, item);
    detailEl.classList.add('open');
  }

  /* ── Helpers ────────────────────────── */

  function hexToRgba(hex, opacity) {
    var h = hex.replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return 'rgba(' +
      parseInt(h.slice(0, 2), 16) + ',' +
      parseInt(h.slice(2, 4), 16) + ',' +
      parseInt(h.slice(4, 6), 16) + ',' +
      (opacity / 100) + ')';
  }

  function clamp(val, min, max) {
    return Math.min(max, Math.max(min, parseInt(val) || min));
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escAttr(str) {
    return String(str).replace(/"/g, '&quot;');
  }

  /* ── Apply text style ───────────────── */

  function applyTextStyle() {
    var titleColor    = hexToRgba(textStyle.titleHex,    textStyle.titleOpacity)    || textStyle.titleHex;
    var descColor     = hexToRgba(textStyle.descHex,     textStyle.descOpacity)     || textStyle.descHex;
    var viewmoreColor = hexToRgba(textStyle.viewmoreHex, textStyle.viewmoreOpacity) || textStyle.viewmoreHex;

    bannerWidget.style.setProperty('--item-title-size',  textStyle.titleSize + 'px');
    bannerWidget.style.setProperty('--item-title-color', titleColor);
    bannerWidget.style.setProperty('--item-desc-size',   textStyle.descSize  + 'px');
    bannerWidget.style.setProperty('--item-desc-color',  descColor);
    bannerWidget.style.setProperty('--viewmore-size',    textStyle.viewmoreSize + 'px');
    bannerWidget.style.setProperty('--viewmore-color',   viewmoreColor);
    bannerWidget.style.setProperty('--viewmore-icon',    textStyle.viewmoreIconSize + 'px');
    bannerWidget.style.setProperty('--indicator-track',  textStyle.indicatorTrackHex);
    bannerWidget.style.setProperty('--indicator-thumb',  textStyle.indicatorThumbHex);

    document.getElementById('itemTitleSwatchWrap').style.background    = titleColor;
    document.getElementById('itemDescSwatchWrap').style.background     = descColor;
    document.getElementById('viewmoreSwatchWrap').style.background     = viewmoreColor;
    document.getElementById('indicatorTrackSwatchWrap').style.background = textStyle.indicatorTrackHex;
    document.getElementById('indicatorThumbSwatchWrap').style.background = textStyle.indicatorThumbHex;
  }

  /* ── Indicators ─────────────────────── */

  function renderIndicators() {
    indicatorsEl.innerHTML = '<div class="banner-indicator__thumb"></div>';
    updateIndicatorThumb();
  }

  function updateIndicatorThumb() {
    var thumb = indicatorsEl.querySelector('.banner-indicator__thumb');
    if (!thumb) return;
    var barW       = indicatorsEl.clientWidth;
    var scrollable = wrapEl.scrollWidth - wrapEl.clientWidth;
    var thumbW     = ITEM_WIDTH;
    var thumbL     = scrollable > 0
      ? (wrapEl.scrollLeft / scrollable) * (barW - thumbW)
      : 0;
    thumb.style.width = thumbW + 'px';
    thumb.style.left  = thumbL + 'px';
  }

  wrapEl.addEventListener('scroll', updateIndicatorThumb);

  /* ── Render: carousel track ─────────── */

  function applyItemWidth() {
    trackEl.querySelectorAll('.banner-item').forEach(function (el) {
      el.style.width = ITEM_WIDTH + 'px';
    });
    updateIndicatorThumb();
  }

  function applyGap() {
    trackEl.style.gap = GAP + 'px';
  }

  function renderTrack(enteringId) {
    trackEl.innerHTML = '';

    items.forEach(function (item) {
      var el = document.createElement('div');
      el.className = 'banner-item' + (item.id === enteringId ? ' entering' : '');
      el.style.width = ITEM_WIDTH + 'px';
      el.dataset.id = item.id;
      el.innerHTML =
        '<div class="banner-item__image">' +
          (item.imgSrc ? '<img src="' + escAttr(item.imgSrc) + '" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;">' : '') +
        '</div>' +
        '<div class="banner-item__body">' +
          '<p class="banner-item__title">' + esc(item.title) + '</p>' +
          '<p class="banner-item__desc">'  + esc(item.desc)  + '</p>' +
        '</div>';
      trackEl.appendChild(el);
    });
  }

  /* ── Drag scroll ────────────────────── */

  var isDown = false;
  var startX, scrollLeft;

  wrapEl.addEventListener('mousedown', function (e) {
    isDown = true;
    wrapEl.classList.add('is-dragging');
    startX = e.pageX - wrapEl.offsetLeft;
    scrollLeft = wrapEl.scrollLeft;
  });

  wrapEl.addEventListener('mouseleave', function () {
    isDown = false;
    wrapEl.classList.remove('is-dragging');
  });

  wrapEl.addEventListener('mouseup', function () {
    isDown = false;
    wrapEl.classList.remove('is-dragging');
  });

  wrapEl.addEventListener('mousemove', function (e) {
    if (!isDown) return;
    e.preventDefault();
    var x = e.pageX - wrapEl.offsetLeft;
    var walk = (x - startX) * 1.5;
    wrapEl.scrollLeft = scrollLeft - walk;
  });

  /* ── Render: inspector item list ─────── */

  function renderInspectorItems() {
    itemListEl.innerHTML = '';

    items.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'inspector__item-row';
      row.dataset.id = item.id;
      row.innerHTML =
        '<span class="inspector__drag">' +
          '<svg viewBox="0 0 8 14" fill="currentColor" width="8" height="14"' +
            ' xmlns="http://www.w3.org/2000/svg">' +
            '<circle cx="2" cy="2"  r="1.2"/><circle cx="6" cy="2"  r="1.2"/>' +
            '<circle cx="2" cy="7"  r="1.2"/><circle cx="6" cy="7"  r="1.2"/>' +
            '<circle cx="2" cy="12" r="1.2"/><circle cx="6" cy="12" r="1.2"/>' +
          '</svg>' +
        '</span>' +
        '<span class="inspector__item-name">' + esc(item.title || 'ITEM TITLE') + '</span>' +
        '<span class="inspector__item-arrow">' +
          '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><polyline points="6,3 10,8 6,13"/></svg>' +
        '</span>';

      row.addEventListener('click', function (e) {
        if (e.target.closest('.inspector__drag')) return;
        openDetail(item);
      });

      setupDragDrop(row, item.id);
      itemListEl.appendChild(row);
    });
  }

  /* ── Item CRUD ───────────────────────── */

  function addItem() {
    var id = nextId++;
    var newItem = { id: id, title: 'ITEM TITLE', desc: 'ITEM DESCRIPTION', expanded: false, imgSrc: '' };
    items.push(newItem);
    renderTrack(id);
    renderIndicators();
    renderInspectorItems();
    wrapEl.scrollLeft = wrapEl.scrollWidth;
    openDetail(newItem);
  }

  function removeItem(id) {
    if (items.length <= 1) return;
    items = items.filter(function (it) { return it.id !== id; });
    renderTrack(null);
    renderIndicators();
    renderInspectorItems();
  }

  function updateItemField(id, field, value) {
    var item = items.find(function (it) { return it.id === id; });
    if (item) item[field] = value;

    var cardEl = trackEl.querySelector('[data-id="' + id + '"]');
    if (!cardEl) return;
    if (field === 'title') cardEl.querySelector('.banner-item__title').textContent = value;
    if (field === 'desc')  cardEl.querySelector('.banner-item__desc').textContent  = value;
  }

  /* ── Drag & Drop (inspector reorder) ── */

  function setupDragDrop(row, id) {
    var handle = row.querySelector('.inspector__drag');

    handle.addEventListener('mousedown', function () {
      row.setAttribute('draggable', 'true');
    });

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

      var mid = row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2;
      var before = e.clientY < mid;

      var srcIdx = items.findIndex(function (it) { return it.id === dragSrcId; });
      var moved  = items.splice(srcIdx, 1)[0];

      var newDst = items.findIndex(function (it) { return it.id === id; });
      items.splice(before ? newDst : newDst + 1, 0, moved);

      renderTrack(null);
      renderInspectorItems();
    });
  }

  function clearDragIndicators() {
    itemListEl.querySelectorAll('.inspector__item-row').forEach(function (r) {
      r.classList.remove('drag-over-top', 'drag-over-bottom');
    });
  }

  /* ── Banner image upload ────────────── */

  function initBannerImgUpload() {
    var uploadWrap = document.getElementById('bannerImgUpload');
    var thumb      = document.getElementById('bannerImgThumb');
    var clearBtn   = document.getElementById('bannerImgClear');
    var fileInput  = document.getElementById('bannerImgFile');
    var panelImg   = document.getElementById('bannerPanelImg');
    if (!uploadWrap) return;

    thumb.addEventListener('click', function () { fileInput.click(); });

    fileInput.addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        bannerImgSrc = ev.target.result;
        panelImg.innerHTML = '<img src="' + bannerImgSrc + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">';
        thumb.innerHTML = '<img src="' + bannerImgSrc + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">';
        thumb.classList.add('inspector__img-thumb--filled');
        uploadWrap.classList.add('inspector__img-upload--filled');
        fileInput.value = '';
      };
      reader.readAsDataURL(file);
    });

    clearBtn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      bannerImgSrc = '';
      panelImg.innerHTML = '';
      thumb.innerHTML = UPLOAD_SVG;
      thumb.classList.remove('inspector__img-thumb--filled');
      uploadWrap.classList.remove('inspector__img-upload--filled');
      fileInput.value = '';
    });
  }

  /* ── Content bindings ───────────────── */

  function bindText(inputId, elId) {
    var input = document.getElementById(inputId);
    var el    = document.getElementById(elId);
    if (!input || !el) return;
    input.addEventListener('input', function () {
      el.textContent = input.value;
    });
  }

  bindText('bannerTitleInput',  'bannerTitleEl');
  bindText('bannerDescInput',   'bannerDescEl');
  bindText('sectionTitleInput', 'sectionTitleEl');
  bindText('viewMoreInput',     'viewMoreTextEl');

  /* ── Text style controls ─────────────── */

  var itemTitleSizeEl    = document.getElementById('itemTitleSize');
  var itemTitlePicker    = document.getElementById('itemTitleColorPicker');
  var itemTitleHexEl     = document.getElementById('itemTitleColorHex');
  var itemTitleOpacityEl = document.getElementById('itemTitleColorOpacity');
  var itemDescSizeEl     = document.getElementById('itemDescSize');
  var itemDescPicker     = document.getElementById('itemDescColorPicker');
  var itemDescHexEl      = document.getElementById('itemDescColorHex');
  var itemDescOpacityEl  = document.getElementById('itemDescColorOpacity');

  itemTitleSizeEl.addEventListener('input', function () {
    textStyle.titleSize = clamp(itemTitleSizeEl.value, 8, 80);
    applyTextStyle();
  });

  itemTitlePicker.addEventListener('input', function () {
    textStyle.titleHex = itemTitlePicker.value.toUpperCase();
    itemTitleHexEl.value = textStyle.titleHex;
    applyTextStyle();
  });

  itemTitleHexEl.addEventListener('input', function () {
    var hex = itemTitleHexEl.value;
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      textStyle.titleHex = hex.toUpperCase();
      itemTitlePicker.value = hex;
      applyTextStyle();
    }
  });

  itemTitleOpacityEl.addEventListener('input', function () {
    textStyle.titleOpacity = clamp(itemTitleOpacityEl.value, 0, 100);
    applyTextStyle();
  });

  itemDescSizeEl.addEventListener('input', function () {
    textStyle.descSize = clamp(itemDescSizeEl.value, 8, 60);
    applyTextStyle();
  });

  itemDescPicker.addEventListener('input', function () {
    textStyle.descHex = itemDescPicker.value.toUpperCase();
    itemDescHexEl.value = textStyle.descHex;
    applyTextStyle();
  });

  itemDescHexEl.addEventListener('input', function () {
    var hex = itemDescHexEl.value;
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      textStyle.descHex = hex.toUpperCase();
      itemDescPicker.value = hex;
      applyTextStyle();
    }
  });

  itemDescOpacityEl.addEventListener('input', function () {
    textStyle.descOpacity = clamp(itemDescOpacityEl.value, 0, 100);
    applyTextStyle();
  });

  /* ── View More / Indicator controls ─────── */

  var viewmoreSizeEl         = document.getElementById('viewmoreSizeInput');
  var viewmorePicker         = document.getElementById('viewmoreColorPicker');
  var viewmoreHexEl          = document.getElementById('viewmoreColorHex');
  var viewmoreOpacityEl      = document.getElementById('viewmoreColorOpacity');
  var viewmoreIconEl         = document.getElementById('viewmoreIconSizeInput');
  var indicatorTrackPickerEl = document.getElementById('indicatorTrackPicker');
  var indicatorTrackHexEl    = document.getElementById('indicatorTrackHex');
  var indicatorThumbPickerEl = document.getElementById('indicatorThumbPicker');
  var indicatorThumbHexEl    = document.getElementById('indicatorThumbHex');

  viewmoreSizeEl.addEventListener('input', function () {
    textStyle.viewmoreSize = clamp(viewmoreSizeEl.value, 8, 60);
    applyTextStyle();
  });

  viewmorePicker.addEventListener('input', function () {
    textStyle.viewmoreHex = viewmorePicker.value.toUpperCase();
    viewmoreHexEl.value = textStyle.viewmoreHex;
    applyTextStyle();
  });

  viewmoreHexEl.addEventListener('input', function () {
    var hex = viewmoreHexEl.value;
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      textStyle.viewmoreHex = hex.toUpperCase();
      viewmorePicker.value = hex;
      applyTextStyle();
    }
  });

  viewmoreOpacityEl.addEventListener('input', function () {
    textStyle.viewmoreOpacity = clamp(viewmoreOpacityEl.value, 0, 100);
    applyTextStyle();
  });

  viewmoreIconEl.addEventListener('input', function () {
    textStyle.viewmoreIconSize = clamp(viewmoreIconEl.value, 8, 48);
    applyTextStyle();
  });

  indicatorTrackPickerEl.addEventListener('input', function () {
    textStyle.indicatorTrackHex = indicatorTrackPickerEl.value.toUpperCase();
    indicatorTrackHexEl.value = textStyle.indicatorTrackHex;
    applyTextStyle();
  });

  indicatorTrackHexEl.addEventListener('input', function () {
    var hex = indicatorTrackHexEl.value;
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      textStyle.indicatorTrackHex = hex.toUpperCase();
      indicatorTrackPickerEl.value = hex;
      applyTextStyle();
    }
  });

  indicatorThumbPickerEl.addEventListener('input', function () {
    textStyle.indicatorThumbHex = indicatorThumbPickerEl.value.toUpperCase();
    indicatorThumbHexEl.value = textStyle.indicatorThumbHex;
    applyTextStyle();
  });

  indicatorThumbHexEl.addEventListener('input', function () {
    var hex = indicatorThumbHexEl.value;
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      textStyle.indicatorThumbHex = hex.toUpperCase();
      indicatorThumbPickerEl.value = hex;
      applyTextStyle();
    }
  });

  /* ── Layout controls ────────────────── */

  document.getElementById('itemWidth').addEventListener('input', function (e) {
    ITEM_WIDTH = Math.min(340, Math.max(80, parseInt(e.target.value) || 80));
    applyItemWidth();
  });

  document.getElementById('itemGap').addEventListener('input', function (e) {
    GAP = Math.min(60, Math.max(0, parseInt(e.target.value) || 0));
    applyGap();
  });

  /* ── Add item button ─────────────────── */

  document.getElementById('addItem').addEventListener('click', addItem);

  /* ── Section collapse ────────────────── */

  document.getElementById('bannerInspector').querySelectorAll('.inspector__sec-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.closest('.inspector__section').classList.toggle('collapsed');
    });
  });

  /* ── Inspector close ─────────────────── */

  document.getElementById('bannerInspectorClose').addEventListener('click', function () {
    document.getElementById('bannerInspector').style.display = 'none';
  });

  /* ── Widget delete ───────────────────── */

  document.getElementById('bannerDelete').addEventListener('click', function () {
    if (confirm('위젯을 삭제하시겠습니까?')) {
      document.getElementById('bannerWidget').remove();
      document.getElementById('bannerInspector').style.display = 'none';
    }
  });

  /* ── Init ────────────────────────────── */

  detailEl = createDetailPanel();
  initBannerImgUpload();
  renderTrack(null);
  applyGap();
  renderIndicators();
  renderInspectorItems();
  applyTextStyle();

})();
