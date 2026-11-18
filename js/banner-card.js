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
    { id: 1, title: 'ITEM TITLE', desc: 'ITEM DESCRIPTION', expanded: false },
    { id: 2, title: 'ITEM TITLE', desc: 'ITEM DESCRIPTION', expanded: false }
  ];
  var dragSrcId = null;
  var textStyle = {
    titleSize:    24,
    titleHex:     '#262626',
    titleOpacity: 100,
    descSize:     16,
    descHex:      '#767676',
    descOpacity:  100
  };

  /* ── DOM refs ───────────────────────── */

  var trackEl      = document.getElementById('carouselTrack');
  var indicatorsEl = document.getElementById('indicators');
  var itemListEl   = document.getElementById('bannerItemList');
  var bannerWidget = document.getElementById('bannerWidget');
  var wrapEl       = trackEl.parentElement;

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
    var titleColor = hexToRgba(textStyle.titleHex, textStyle.titleOpacity) || textStyle.titleHex;
    var descColor  = hexToRgba(textStyle.descHex,  textStyle.descOpacity)  || textStyle.descHex;

    bannerWidget.style.setProperty('--item-title-size',  textStyle.titleSize + 'px');
    bannerWidget.style.setProperty('--item-title-color', titleColor);
    bannerWidget.style.setProperty('--item-desc-size',   textStyle.descSize  + 'px');
    bannerWidget.style.setProperty('--item-desc-color',  descColor);

    document.getElementById('itemTitleSwatchWrap').style.background = titleColor;
    document.getElementById('itemDescSwatchWrap').style.background  = descColor;
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
        '<div class="banner-item__image"></div>' +
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
      row.className = 'inspector__card-item' + (item.expanded ? ' inspector__faq-item--expanded' : '');
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
        '<div class="inspector__card-fields">' +
          '<div class="inspector__faq-row">' +
            '<input class="inspector__card-name-input" type="text"' +
              ' value="' + escAttr(item.title) + '" placeholder="ITEM TITLE">' +
            '<button class="inspector__faq-toggle" type="button" aria-label="설명 편집">' +
              '<svg class="inspector__faq-chevron" viewBox="0 0 16 16" fill="none"' +
                ' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' +
                ' width="14" height="14">' +
                '<polyline points="4,6 8,10 12,6"/>' +
              '</svg>' +
            '</button>' +
          '</div>' +
          '<div class="inspector__faq-body">' +
            '<div class="inspector__faq-body-inner">' +
              '<input class="inspector__card-role-input" type="text"' +
                ' value="' + escAttr(item.desc) + '" placeholder="ITEM DESCRIPTION">' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<button class="inspector__card-delete" title="삭제" type="button">' +
          '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor"' +
            ' stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"' +
            ' width="13" height="13">' +
            '<polyline points="1,3 13,3"/>' +
            '<path d="M4,3V2.5A.5.5,0,0,1,4.5,2h5A.5.5,0,0,1,10,2.5V3"/>' +
            '<rect x="2" y="3" width="10" height="9" rx="1"/>' +
            '<line x1="5" y1="6" x2="5" y2="10"/>' +
            '<line x1="9" y1="6" x2="9" y2="10"/>' +
          '</svg>' +
        '</button>';

      /* Expand toggle */
      row.querySelector('.inspector__faq-toggle').addEventListener('click', function () {
        item.expanded = !item.expanded;
        row.classList.toggle('inspector__faq-item--expanded', item.expanded);
        if (item.expanded) row.querySelector('.inspector__card-role-input').focus();
      });

      row.querySelector('.inspector__card-name-input').addEventListener('input', function (e) {
        updateItemField(item.id, 'title', e.target.value);
      });

      row.querySelector('.inspector__card-role-input').addEventListener('input', function (e) {
        updateItemField(item.id, 'desc', e.target.value);
      });

      row.querySelector('.inspector__card-delete').addEventListener('click', function () {
        removeItem(item.id);
      });

      setupDragDrop(row, item.id);
      itemListEl.appendChild(row);
    });
  }

  /* ── Item CRUD ───────────────────────── */

  function addItem() {
    var id = nextId++;
    items.push({ id: id, title: 'ITEM TITLE', desc: 'ITEM DESCRIPTION', expanded: true });
    renderTrack(id);
    renderIndicators();
    renderInspectorItems();
    wrapEl.scrollLeft = wrapEl.scrollWidth;
    var newRow = itemListEl.lastElementChild;
    if (newRow) newRow.querySelector('.inspector__card-name-input').focus();
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
    itemListEl.querySelectorAll('.inspector__card-item').forEach(function (r) {
      r.classList.remove('drag-over-top', 'drag-over-bottom');
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

  renderTrack(null);
  applyGap();
  renderIndicators();
  renderInspectorItems();
  applyTextStyle();

})();
