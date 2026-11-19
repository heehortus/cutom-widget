/* =====================================
   Widget Editor — Inspector Controller
   ===================================== */

(function () {
  'use strict';

  /* ── State ──────────────────────────── */

  var nextId = 2;
  var cards  = [
    { id: 1, name: 'TITLE', role: 'DESCRIPTION', imgSrc: '' }
  ];

  var UPLOAD_SVG = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="8,10 8,3"/><polyline points="5,6 8,3 11,6"/><path d="M3 12v.5A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5V12"/></svg>';
  var layout   = 'row';
  var gridCols = 3;
  var gridRows = 2;
  var dragSrcId = null;
  var hoverStyle = {
    startHex:     '#555555',
    startOpacity: 100,
    endHex:       '#222222',
    endOpacity:   100
  };
  var textStyle = {
    nameSize:    24,
    nameHex:     '#F9F9F9',
    nameOpacity: 100,
    roleSize:    16,
    roleHex:     '#F9F9F9',
    roleOpacity: 100
  };

  var cardListEl = document.getElementById('cardList');
  var itemListEl = document.getElementById('cardItemList');

  /* ── Detail Panel ── */
  var currentDetailItem = null;
  var detailEl = null;

  function createDetailPanel() {
    var inspectorEl = document.querySelector('#cardInspector');
    var panel = document.createElement('div');
    panel.className = 'inspector__detail';
    panel.innerHTML =
      '<div class="inspector__detail-head">' +
        '<button class="inspector__detail-back" type="button">' +
          '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="11" height="11"><polyline points="10,3 4,8 10,13"/></svg>' +
          '카드 아이템' +
        '</button>' +
        '<button class="inspector__detail-close" type="button">&#x2715;</button>' +
      '</div>' +
      '<div class="inspector__detail-body" id="cardDetailBody"></div>';
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

  function renderDetailBody(bodyEl, card) {
    bodyEl.innerHTML = '';

    /* 이미지 필드 */
    var imgField = document.createElement('div');
    imgField.innerHTML =
      '<label class="inspector__field-label">이미지</label>' +
      '<div class="inspector__img-upload' + (card.imgSrc ? ' inspector__img-upload--filled' : '') + '">' +
        '<div class="inspector__img-thumb' + (card.imgSrc ? ' inspector__img-thumb--filled' : '') + '">' +
          (card.imgSrc ? '<img src="' + escAttr(card.imgSrc) + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">' : UPLOAD_SVG) +
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
        card.imgSrc = ev.target.result;
        var photoEl = cardListEl.querySelector('[data-id="' + card.id + '"] .card-widget__photo');
        if (photoEl) {
          var imgEl = photoEl.querySelector('img');
          if (!imgEl) { imgEl = document.createElement('img'); imgEl.alt = ''; imgEl.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;'; photoEl.appendChild(imgEl); }
          imgEl.src = card.imgSrc;
        }
        thumb.innerHTML = '<img src="' + card.imgSrc + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">';
        thumb.classList.add('inspector__img-thumb--filled');
        uploadWrap.classList.add('inspector__img-upload--filled');
        fileInput.value = '';
      };
      reader.readAsDataURL(file);
    });
    clearBtn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      card.imgSrc = '';
      var photoEl = cardListEl.querySelector('[data-id="' + card.id + '"] .card-widget__photo');
      if (photoEl) { var imgEl = photoEl.querySelector('img'); if (imgEl) imgEl.remove(); }
      thumb.innerHTML = UPLOAD_SVG;
      thumb.classList.remove('inspector__img-thumb--filled');
      uploadWrap.classList.remove('inspector__img-upload--filled');
      fileInput.value = '';
    });
    bodyEl.appendChild(imgField);

    /* 이름 필드 */
    var nameField = document.createElement('div');
    nameField.className = 'inspector__field';
    nameField.innerHTML =
      '<label class="inspector__field-label">이름</label>' +
      '<input class="inspector__card-name-input" type="text" value="' + escAttr(card.name) + '" placeholder="TITLE" style="width:100%">';
    nameField.querySelector('input').addEventListener('input', function (e) {
      updateCardField(card.id, 'name', e.target.value);
      /* 리스트 행 이름 업데이트 */
      var rowEl = itemListEl.querySelector('[data-id="' + card.id + '"] .inspector__item-name');
      if (rowEl) rowEl.textContent = e.target.value || 'TITLE';
    });
    bodyEl.appendChild(nameField);

    /* 설명 필드 */
    var roleField = document.createElement('div');
    roleField.className = 'inspector__field';
    roleField.innerHTML =
      '<label class="inspector__field-label">설명</label>' +
      '<input class="inspector__card-role-input" type="text" value="' + escAttr(card.role) + '" placeholder="DESCRIPTION" style="width:100%">';
    roleField.querySelector('input').addEventListener('input', function (e) {
      updateCardField(card.id, 'role', e.target.value);
    });
    bodyEl.appendChild(roleField);

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
      removeCard(card.id);
    });
    bodyEl.appendChild(deleteWrap);
  }

  function openDetail(card) {
    currentDetailItem = card;
    var bodyEl = detailEl.querySelector('#cardDetailBody');
    renderDetailBody(bodyEl, card);
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

  /* ── Apply global text style to card-list ── */

  function applyTextStyle() {
    var nameColor = hexToRgba(textStyle.nameHex, textStyle.nameOpacity) || textStyle.nameHex;
    var roleColor = hexToRgba(textStyle.roleHex, textStyle.roleOpacity) || textStyle.roleHex;

    cardListEl.style.setProperty('--name-size', textStyle.nameSize + 'px');
    cardListEl.style.setProperty('--name-color', nameColor);
    cardListEl.style.setProperty('--role-size', textStyle.roleSize + 'px');
    cardListEl.style.setProperty('--role-color', roleColor);

    document.getElementById('nameSwatchWrap').style.background = nameColor;
    document.getElementById('roleSwatchWrap').style.background = roleColor;
  }

  /* ── Render: canvas cards ────────────── */

  function renderCards() {
    cardListEl.innerHTML = '';
    cardListEl.className = 'card-list layout-' + layout;

    cards.forEach(function (card) {
      var el = document.createElement('div');
      el.className = 'card-widget';
      el.dataset.id = card.id;
      el.innerHTML =
        '<div class="card-widget__photo">' +
          (card.imgSrc ? '<img src="' + escAttr(card.imgSrc) + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">' : '') +
        '</div>' +
        '<div class="card-widget__overlay">' +
          '<p class="card-widget__name">' + esc(card.name) + '</p>' +
          '<p class="card-widget__role">' + esc(card.role) + '</p>' +
        '</div>';
      cardListEl.appendChild(el);
    });

    applyTextStyle();
  }

  /* ── Render: inspector item list ─────── */

  function renderItems() {
    itemListEl.innerHTML = '';

    cards.forEach(function (card) {
      var row = document.createElement('div');
      row.className = 'inspector__item-row';
      row.dataset.id = card.id;
      row.innerHTML =
        '<span class="inspector__drag">' +
          '<svg viewBox="0 0 8 14" fill="currentColor" width="8" height="14"' +
            ' xmlns="http://www.w3.org/2000/svg">' +
            '<circle cx="2" cy="2"  r="1.2"/><circle cx="6" cy="2"  r="1.2"/>' +
            '<circle cx="2" cy="7"  r="1.2"/><circle cx="6" cy="7"  r="1.2"/>' +
            '<circle cx="2" cy="12" r="1.2"/><circle cx="6" cy="12" r="1.2"/>' +
          '</svg>' +
        '</span>' +
        '<span class="inspector__item-name">' + esc(card.name || 'TITLE') + '</span>' +
        '<span class="inspector__item-arrow">' +
          '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><polyline points="6,3 10,8 6,13"/></svg>' +
        '</span>';

      /* 행 클릭 → 상세 패널 (드래그 핸들 클릭 제외) */
      row.addEventListener('click', function (e) {
        if (e.target.closest('.inspector__drag')) return;
        openDetail(card);
      });

      /* drag & drop */
      setupDragDrop(row, card.id);

      itemListEl.appendChild(row);
    });
  }

  /* ── Drag & Drop ─────────────────────── */

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

      var srcIdx = cards.findIndex(function (c) { return c.id === dragSrcId; });
      var dstIdx = cards.findIndex(function (c) { return c.id === id; });
      var moved  = cards.splice(srcIdx, 1)[0];

      var newDst = cards.findIndex(function (c) { return c.id === id; });
      cards.splice(before ? newDst : newDst + 1, 0, moved);

      renderCards();
      renderItems();
    });
  }

  function clearDragIndicators() {
    itemListEl.querySelectorAll('.inspector__item-row').forEach(function (r) {
      r.classList.remove('drag-over-top', 'drag-over-bottom');
    });
  }

  /* ── Card CRUD ───────────────────────── */

  function addCard() {
    var id = nextId++;
    var newCard = { id: id, name: 'TITLE', role: 'DESCRIPTION', imgSrc: '' };
    cards.push(newCard);
    renderCards();
    renderItems();
    /* 새 아이템의 상세 패널 열기 */
    openDetail(newCard);
  }

  function removeCard(id) {
    if (cards.length <= 1) return; /* 최소 1장 유지 */
    cards = cards.filter(function (c) { return c.id !== id; });
    renderCards();
    renderItems();
  }

  function updateCardField(id, field, value) {
    var card = cards.find(function (c) { return c.id === id; });
    if (card) card[field] = value;

    var cardEl = cardListEl.querySelector('[data-id="' + id + '"]');
    if (!cardEl) return;
    if (field === 'name') cardEl.querySelector('.card-widget__name').textContent = value;
    if (field === 'role') cardEl.querySelector('.card-widget__role').textContent = value;
  }

  /* ── Layout toggle ───────────────────── */

  var gridInputsEl = document.getElementById('gridInputs');
  var gridColsEl   = document.getElementById('gridCols');
  var gridRowsEl   = document.getElementById('gridRows');

  function applyGridVars() {
    cardListEl.style.setProperty('--grid-cols', gridCols);
    cardListEl.style.setProperty('--grid-rows', gridRows);
  }

  document.querySelectorAll('.inspector__layout-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      layout = btn.dataset.layout;
      document.querySelectorAll('.inspector__layout-btn').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });
      cardListEl.className = 'card-list layout-' + layout;
      gridInputsEl.classList.toggle('visible', layout === 'grid');
      if (layout === 'grid') applyGridVars();
    });
  });

  gridColsEl.addEventListener('input', function () {
    gridCols = Math.min(10, Math.max(1, parseInt(gridColsEl.value) || 1));
    applyGridVars();
  });

  gridRowsEl.addEventListener('input', function () {
    gridRows = Math.min(10, Math.max(1, parseInt(gridRowsEl.value) || 1));
    applyGridVars();
  });

  /* ── Add card button ─────────────────── */

  document.getElementById('addCard').addEventListener('click', addCard);

  /* ── Section collapse ────────────────── */

  document.getElementById('cardInspector').querySelectorAll('.inspector__sec-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.closest('.inspector__section').classList.toggle('collapsed');
    });
  });

  /* ── Inspector close ─────────────────── */

  document.getElementById('cardInspectorClose').addEventListener('click', function () {
    document.getElementById('cardInspector').style.display = 'none';
  });

  /* ── Widget delete ───────────────────── */

  document.getElementById('cardDelete').addEventListener('click', function () {
    if (confirm('위젯을 삭제하시겠습니까?')) {
      cardListEl.remove();
      document.getElementById('cardInspector').style.display = 'none';
    }
  });

  /* ── Text style controls ─────────────── */

  var nameFontSizeEl   = document.getElementById('nameFontSize');
  var nameColorPicker  = document.getElementById('nameColorPicker');
  var nameColorHex     = document.getElementById('nameColorHex');
  var nameColorOpacity = document.getElementById('nameColorOpacity');
  var roleFontSizeEl   = document.getElementById('roleFontSize');
  var roleColorPicker  = document.getElementById('roleColorPicker');
  var roleColorHex     = document.getElementById('roleColorHex');
  var roleColorOpacity = document.getElementById('roleColorOpacity');

  nameFontSizeEl.addEventListener('input', function () {
    textStyle.nameSize = clamp(nameFontSizeEl.value, 8, 120);
    applyTextStyle();
  });

  nameColorPicker.addEventListener('input', function () {
    textStyle.nameHex = nameColorPicker.value.toUpperCase();
    nameColorHex.value = textStyle.nameHex;
    applyTextStyle();
  });

  nameColorHex.addEventListener('input', function () {
    var hex = nameColorHex.value;
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      textStyle.nameHex = hex.toUpperCase();
      nameColorPicker.value = hex;
      applyTextStyle();
    }
  });

  nameColorOpacity.addEventListener('input', function () {
    textStyle.nameOpacity = clamp(nameColorOpacity.value, 0, 100);
    applyTextStyle();
  });

  roleFontSizeEl.addEventListener('input', function () {
    textStyle.roleSize = clamp(roleFontSizeEl.value, 8, 120);
    applyTextStyle();
  });

  roleColorPicker.addEventListener('input', function () {
    textStyle.roleHex = roleColorPicker.value.toUpperCase();
    roleColorHex.value = textStyle.roleHex;
    applyTextStyle();
  });

  roleColorHex.addEventListener('input', function () {
    var hex = roleColorHex.value;
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      textStyle.roleHex = hex.toUpperCase();
      roleColorPicker.value = hex;
      applyTextStyle();
    }
  });

  roleColorOpacity.addEventListener('input', function () {
    textStyle.roleOpacity = clamp(roleColorOpacity.value, 0, 100);
    applyTextStyle();
  });

  /* ── Card size controls ──────────────── */

  var cardWidthEl  = document.getElementById('cardWidth');
  var cardHeightEl = document.getElementById('cardHeight');

  cardWidthEl.addEventListener('input', function () {
    var val = clamp(cardWidthEl.value, 80, 600);
    cardListEl.style.setProperty('--card-width', val + 'px');
  });

  cardHeightEl.addEventListener('input', function () {
    var val = clamp(cardHeightEl.value, 80, 800);
    cardListEl.style.setProperty('--card-height', val + 'px');
  });

  /* ── Hover color controls ────────────── */

  function applyHoverStyle() {
    var startColor = hexToRgba(hoverStyle.startHex, hoverStyle.startOpacity) || hoverStyle.startHex;
    var endColor   = hexToRgba(hoverStyle.endHex,   hoverStyle.endOpacity)   || hoverStyle.endHex;
    cardListEl.style.setProperty('--hover-start', startColor);
    cardListEl.style.setProperty('--hover-end',   endColor);
    document.getElementById('hoverStartSwatchWrap').style.background = startColor;
    document.getElementById('hoverEndSwatchWrap').style.background   = endColor;
  }

  var hoverStartPicker  = document.getElementById('hoverStartPicker');
  var hoverStartHex     = document.getElementById('hoverStartHex');
  var hoverStartOpacity = document.getElementById('hoverStartOpacity');
  var hoverEndPicker    = document.getElementById('hoverEndPicker');
  var hoverEndHex       = document.getElementById('hoverEndHex');
  var hoverEndOpacity   = document.getElementById('hoverEndOpacity');

  hoverStartPicker.addEventListener('input', function () {
    hoverStyle.startHex = hoverStartPicker.value.toUpperCase();
    hoverStartHex.value = hoverStyle.startHex;
    applyHoverStyle();
  });
  hoverStartHex.addEventListener('input', function () {
    var hex = hoverStartHex.value;
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      hoverStyle.startHex = hex.toUpperCase();
      hoverStartPicker.value = hex;
      applyHoverStyle();
    }
  });
  hoverStartOpacity.addEventListener('input', function () {
    hoverStyle.startOpacity = clamp(hoverStartOpacity.value, 0, 100);
    applyHoverStyle();
  });

  hoverEndPicker.addEventListener('input', function () {
    hoverStyle.endHex = hoverEndPicker.value.toUpperCase();
    hoverEndHex.value = hoverStyle.endHex;
    applyHoverStyle();
  });
  hoverEndHex.addEventListener('input', function () {
    var hex = hoverEndHex.value;
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      hoverStyle.endHex = hex.toUpperCase();
      hoverEndPicker.value = hex;
      applyHoverStyle();
    }
  });
  hoverEndOpacity.addEventListener('input', function () {
    hoverStyle.endOpacity = clamp(hoverEndOpacity.value, 0, 100);
    applyHoverStyle();
  });

  /* ── Init ────────────────────────────── */

  detailEl = createDetailPanel();
  renderCards();
  renderItems();
  applyHoverStyle();

})();
