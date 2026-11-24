/* =====================================
   Hover Image Reveal Widget
   ===================================== */
(function () {
  'use strict';

  /* ── Defaults ── */
  var CARD_SIZES = {
    portrait:  { w: 240, h: 320 },
    square:    { w: 280, h: 280 },
    landscape: { w: 320, h: 213 }
  };

  function makeItems() {
    return [1, 2, 3, 4, 5].map(function (i) {
      return { id: i, text: 'PRODUCT 0' + i, src: '', alt: '' };
    });
  }

  var state = {
    items:         makeItems(),
    fontSize:      48,
    fontWeight:    800,
    letterSpacing: 0.06,
    lineHeight:    1.1,
    itemGap:       12,
    textColor:     '#ffffff',
    cardRadius:    14,
    ratio:         'portrait',
    nextId:        6
  };

  var detailEl          = null;
  var currentDetailItem = null;
  var dragSrcId         = null;

  /* ── Helpers ── */
  function clamp(v, mn, mx) { return Math.min(Math.max(v, mn), mx); }
  function escAttr(str) { return String(str).replace(/"/g, '&quot;'); }

  /* ── SVG constants ── */
  var UPLOAD_SVG =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"' +
    ' stroke-linecap="round" stroke-linejoin="round" width="20" height="20">' +
    '<path d="M14 10v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-3"/>' +
    '<polyline points="10,5 8,3 6,5"/><line x1="8" y1="3" x2="8" y2="10"/>' +
    '</svg>';

  var DRAG_SVG =
    '<svg viewBox="0 0 8 14" fill="currentColor" width="8" height="14">' +
    '<circle cx="2" cy="2" r="1.2"/><circle cx="6" cy="2" r="1.2"/>' +
    '<circle cx="2" cy="7" r="1.2"/><circle cx="6" cy="7" r="1.2"/>' +
    '<circle cx="2" cy="12" r="1.2"/><circle cx="6" cy="12" r="1.2"/>' +
    '</svg>';

  var ARROW_SVG =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"' +
    ' stroke-linecap="round" stroke-linejoin="round" width="12" height="12">' +
    '<polyline points="6,3 10,8 6,13"/></svg>';

  /* ── Build widget HTML ── */
  function buildWidgetHTML() {
    var wrap = document.getElementById('hoverImageRevealWrap');
    if (!wrap) return;

    var size = CARD_SIZES[state.ratio];
    var itemsHTML = state.items.map(function (item) {
      return '<div class="hir-item" data-id="' + item.id + '">' +
        '<span class="hir-item__text">' + escAttr(item.text) + '</span>' +
      '</div>';
    }).join('');

    wrap.innerHTML =
      '<div class="hir-root" id="hirRoot">' +
        '<div class="hir-list" id="hirList">' + itemsHTML + '</div>' +
        '<div class="hir-card" id="hirCard" data-ratio="' + state.ratio + '"' +
          ' style="width:' + size.w + 'px;height:' + size.h + 'px">' +
          '<div class="hir-card__ph" id="hirCardPh">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" width="32" height="32">' +
            '<rect x="3" y="3" width="18" height="18" rx="2"/>' +
            '<circle cx="8.5" cy="8.5" r="1.5"/>' +
            '<polyline points="21,15 16,10 5,21"/>' +
            '</svg>' +
          '</div>' +
          '<img class="hir-card__img" id="hirCardImg" src="" alt="" style="display:none">' +
        '</div>' +
      '</div>';

    applyVars();
    bindHover();
  }

  /* ── Helpers ── */
  function hexToRgba(hex, opacity) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';
  }

  /* ── Apply CSS vars ── */
  function applyVars() {
    var root = document.getElementById('hirRoot');
    if (!root) return;
    root.style.setProperty('--hir-font-size',      state.fontSize + 'px');
    root.style.setProperty('--hir-font-weight',     state.fontWeight);
    root.style.setProperty('--hir-letter-spacing',  state.letterSpacing + 'em');
    root.style.setProperty('--hir-line-height',     state.lineHeight);
    root.style.setProperty('--hir-item-gap',        state.itemGap + 'px');
    root.style.setProperty('--hir-text-color',      hexToRgba(state.textColor, 0.28));
    root.style.setProperty('--hir-text-active',     state.textColor);
    root.style.setProperty('--hir-card-radius',     state.cardRadius + 'px');
  }

  /* ── Hover interactions ── */
  function bindHover() {
    var root    = document.getElementById('hirRoot');
    var card    = document.getElementById('hirCard');
    var cardImg = document.getElementById('hirCardImg');
    var cardPh  = document.getElementById('hirCardPh');
    if (!root || !card) return;

    var size = CARD_SIZES[state.ratio];
    var cardVisible = false;
    var hideTimer = null;

    function showCard() {
      card.classList.remove('leaving');
      card.classList.add('entering');
      cardVisible = true;
    }

    function hideCard() {
      if (!cardVisible) return;
      cardVisible = false;
      card.classList.remove('entering');
      card.classList.add('leaving');
      card.addEventListener('animationend', function onEnd() {
        card.classList.remove('leaving');
        card.removeEventListener('animationend', onEnd);
      });
    }

    function updateCardImage(item) {
      if (item && item.src) {
        cardImg.src = item.src;
        cardImg.alt = item.alt || '';
        cardImg.style.display = 'block';
        cardPh.style.display = 'none';
      } else {
        cardImg.style.display = 'none';
        cardPh.style.display = 'flex';
      }
    }

    /* Track cursor — position card 40px to the right, vertically centered */
    root.addEventListener('mousemove', function (e) {
      var rootRect = root.getBoundingClientRect();
      card.style.left = (e.clientX - rootRect.left + 40) + 'px';
      card.style.top  = (e.clientY - rootRect.top - size.h / 2) + 'px';
    });

    root.querySelectorAll('.hir-item').forEach(function (el) {
      var id   = parseInt(el.dataset.id, 10);
      var item = state.items.find(function (it) { return it.id === id; });

      el.addEventListener('mouseenter', function () {
        clearTimeout(hideTimer);
        root.classList.add('has-hover');
        root.querySelectorAll('.hir-item').forEach(function (e) { e.classList.remove('active'); });
        el.classList.add('active');
        updateCardImage(item);
        if (!cardVisible) showCard();
      });

      el.addEventListener('mouseleave', function () {
        el.classList.remove('active');
        hideTimer = setTimeout(function () {
          root.classList.remove('has-hover');
          hideCard();
        }, 60);
      });
    });

    root.addEventListener('mouseleave', function () {
      clearTimeout(hideTimer);
      root.classList.remove('has-hover');
      root.querySelectorAll('.hir-item').forEach(function (e) { e.classList.remove('active'); });
      hideCard();
    });
  }

  /* ── Detail panel ── */
  function createDetailPanel() {
    var inspector = document.getElementById('hirInspector');
    var panel = document.createElement('div');
    panel.className = 'inspector__detail';
    panel.innerHTML =
      '<div class="inspector__detail-head">' +
        '<button class="inspector__detail-back" type="button">' +
          '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"' +
          ' stroke-linecap="round" stroke-linejoin="round" width="11" height="11">' +
          '<polyline points="10,3 4,8 10,13"/></svg>' +
          '아이템' +
        '</button>' +
        '<button class="inspector__detail-close" type="button">&#x2715;</button>' +
      '</div>' +
      '<div class="inspector__detail-body" id="hirDetailBody"></div>';
    inspector.appendChild(panel);

    panel.querySelector('.inspector__detail-back').addEventListener('click', function () {
      panel.classList.remove('open');
      currentDetailItem = null;
    });
    panel.querySelector('.inspector__detail-close').addEventListener('click', function () {
      panel.classList.remove('open');
      currentDetailItem = null;
      var closeBtn = inspector.querySelector('.inspector__close');
      if (closeBtn) closeBtn.click();
    });

    return panel;
  }

  /* ── Render detail body ── */
  function renderDetailBody(bodyEl, item) {
    bodyEl.innerHTML = '';

    /* 텍스트 */
    var textField = document.createElement('div');
    textField.className = 'inspector__field';
    textField.innerHTML =
      '<label class="inspector__field-label">텍스트</label>' +
      '<input class="inspector__card-name-input" type="text"' +
      ' value="' + escAttr(item.text) + '" placeholder="텍스트 입력" style="width:100%">';
    textField.querySelector('input').addEventListener('input', function (e) {
      item.text = e.target.value;
      /* update widget text live */
      var el = document.querySelector('.hir-item[data-id="' + item.id + '"] .hir-item__text');
      if (el) el.textContent = item.text;
      /* update inspector row name */
      var nameEl = document.querySelector('#hirItemList .inspector__item-row[data-id="' + item.id + '"] .inspector__item-name');
      if (nameEl) nameEl.textContent = item.text || '(빈 텍스트)';
    });
    bodyEl.appendChild(textField);

    /* 이미지 */
    var imgField = document.createElement('div');
    imgField.className = 'inspector__field';
    var thumbSrc = item.src
      ? '<img src="' + escAttr(item.src) + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">'
      : UPLOAD_SVG;
    imgField.innerHTML =
      '<label class="inspector__field-label">이미지</label>' +
      '<div style="display:flex;flex-direction:column;gap:6px">' +
        '<div class="inspector__img-upload' + (item.src ? ' inspector__img-upload--filled' : '') + '" id="hirImgUpload">' +
          '<div class="inspector__img-thumb' + (item.src ? ' inspector__img-thumb--filled' : '') + '" id="hirImgThumb">' +
            thumbSrc +
          '</div>' +
          '<button class="inspector__img-clear" id="hirImgClear" type="button" title="이미지 제거">&#x2715;</button>' +
          '<input type="file" accept="image/*" id="hirImgFile" style="display:none">' +
        '</div>' +
        '<input type="text" class="inspector__card-name-input" id="hirImgUrl"' +
        ' placeholder="또는 URL 입력"' +
        ' value="' + (item.src && item.src.startsWith('data:') ? '' : escAttr(item.src || '')) + '">' +
      '</div>';

    var uploadWrap = imgField.querySelector('#hirImgUpload');
    var thumb      = imgField.querySelector('#hirImgThumb');
    var clearBtn   = imgField.querySelector('#hirImgClear');
    var fileInput  = imgField.querySelector('#hirImgFile');
    var urlInput   = imgField.querySelector('#hirImgUrl');

    function setItemImg(src) {
      item.src = src;
    }

    thumb.addEventListener('click', function () { fileInput.click(); });

    fileInput.addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        setItemImg(ev.target.result);
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
      setItemImg('');
      urlInput.value = '';
      thumb.innerHTML = UPLOAD_SVG;
      thumb.classList.remove('inspector__img-thumb--filled');
      uploadWrap.classList.remove('inspector__img-upload--filled');
      fileInput.value = '';
    });

    urlInput.addEventListener('input', function (e) {
      var src = e.target.value.trim();
      setItemImg(src);
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

    bodyEl.appendChild(imgField);

    /* 대체 텍스트 */
    var altField = document.createElement('div');
    altField.className = 'inspector__field';
    altField.innerHTML =
      '<label class="inspector__field-label">대체 텍스트</label>' +
      '<input class="inspector__card-name-input" type="text"' +
      ' value="' + escAttr(item.alt) + '" placeholder="이미지 설명" style="width:100%">';
    altField.querySelector('input').addEventListener('input', function (e) {
      item.alt = e.target.value;
    });
    bodyEl.appendChild(altField);
  }

  function openDetail(item) {
    if (!detailEl) return;
    currentDetailItem = item;
    var bodyEl = detailEl.querySelector('#hirDetailBody');
    renderDetailBody(bodyEl, item);
    detailEl.classList.add('open');
  }

  /* ── Render inspector item list ── */
  function renderItemList() {
    var list = document.getElementById('hirItemList');
    if (!list) return;

    list.innerHTML = '';
    state.items.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'inspector__item-row';
      row.dataset.id = item.id;
      row.innerHTML =
        '<span class="inspector__drag">' + DRAG_SVG + '</span>' +
        '<span class="inspector__item-name">' + escAttr(item.text || '(빈 텍스트)') + '</span>' +
        '<span class="inspector__item-arrow">' + ARROW_SVG + '</span>';

      row.addEventListener('click', function (e) {
        if (e.target.closest('.inspector__drag')) return;
        openDetail(item);
      });

      setupDragDrop(row, item.id);
      list.appendChild(row);
    });
  }

  /* ── Drag & drop reorder ── */
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
      var rect = row.getBoundingClientRect();
      row.classList.add(e.clientY < rect.top + rect.height / 2 ? 'drag-over-top' : 'drag-over-bottom');
    });
    row.addEventListener('drop', function (e) {
      e.preventDefault();
      if (dragSrcId === null || dragSrcId === id) return;
      var before = e.clientY < row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2;
      var srcIdx = state.items.findIndex(function (it) { return it.id === dragSrcId; });
      var moved  = state.items.splice(srcIdx, 1)[0];
      var dstIdx = state.items.findIndex(function (it) { return it.id === id; });
      state.items.splice(before ? dstIdx : dstIdx + 1, 0, moved);
      buildWidgetHTML();
      renderItemList();
    });
  }

  function clearDragIndicators() {
    var list = document.getElementById('hirItemList');
    if (!list) return;
    list.querySelectorAll('.inspector__item-row').forEach(function (r) {
      r.classList.remove('drag-over-top', 'drag-over-bottom');
    });
  }

  /* ── Inspector bindings ── */
  function bindInspector() {
    var inspector = document.getElementById('hirInspector');

    /* Section toggles */
    if (inspector) {
      inspector.querySelectorAll('.inspector__sec-toggle').forEach(function (btn) {
        btn.addEventListener('click', function () {
          btn.closest('.inspector__section').classList.toggle('collapsed');
        });
      });
    }

    /* Add item */
    var addBtn = document.getElementById('hirAddItem');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        if (state.items.length >= 10) return;
        var newItem = { id: state.nextId++, text: 'NEW ITEM', src: '', alt: '' };
        state.items.push(newItem);
        buildWidgetHTML();
        renderItemList();
        openDetail(newItem);
      });
    }

    /* Font size */
    var sizeInput = document.getElementById('hirFontSize');
    if (sizeInput) {
      sizeInput.addEventListener('input', function () {
        var v = parseInt(sizeInput.value);
        if (!isNaN(v)) { state.fontSize = clamp(v, 16, 120); applyVars(); }
      });
    }

    /* Font weight */
    bindSegment('hirWeightSegment', function (val) {
      state.fontWeight = parseInt(val);
      applyVars();
    });

    /* Item gap */
    var gapInput = document.getElementById('hirItemGap');
    if (gapInput) {
      gapInput.addEventListener('input', function () {
        var v = parseInt(gapInput.value);
        if (!isNaN(v)) { state.itemGap = clamp(v, 0, 60); applyVars(); }
      });
    }

    /* Letter spacing */
    var lsInput = document.getElementById('hirLetterSpacing');
    if (lsInput) {
      lsInput.addEventListener('input', function () {
        var v = parseFloat(lsInput.value);
        if (!isNaN(v)) { state.letterSpacing = clamp(v, -0.1, 1); applyVars(); }
      });
    }

    /* Line height */
    var lhInput = document.getElementById('hirLineHeight');
    if (lhInput) {
      lhInput.addEventListener('input', function () {
        var v = parseFloat(lhInput.value);
        if (!isNaN(v)) { state.lineHeight = clamp(v, 0.8, 3); applyVars(); }
      });
    }

    /* Text color */
    var textPicker = document.getElementById('hirTextPicker');
    var textHex    = document.getElementById('hirTextHex');
    var textSwatch = document.getElementById('hirTextSwatch');
    if (textPicker) {
      textPicker.addEventListener('input', function () {
        state.textColor = textPicker.value;
        if (textHex) textHex.value = textPicker.value.toUpperCase();
        if (textSwatch) textSwatch.style.background = textPicker.value;
        applyVars();
      });
    }
    if (textHex) {
      textHex.addEventListener('input', function () {
        var v = textHex.value.trim();
        if (!/^#[0-9a-fA-F]{6}$/.test(v)) return;
        state.textColor = v;
        if (textPicker) textPicker.value = v;
        if (textSwatch) textSwatch.style.background = v;
        applyVars();
      });
    }

    /* Card radius */
    var radiusInput = document.getElementById('hirCardRadius');
    if (radiusInput) {
      radiusInput.addEventListener('input', function () {
        var v = parseInt(radiusInput.value);
        if (!isNaN(v)) { state.cardRadius = clamp(v, 0, 60); applyVars(); }
      });
    }

    /* Card ratio */
    bindSegment('hirRatioSegment', function (val) {
      state.ratio = val;
      buildWidgetHTML();
    });

    /* Reset */
    var resetBtn = document.getElementById('hirReset');
    if (resetBtn) resetBtn.addEventListener('click', resetAll);
  }

  function bindSegment(id, onChange) {
    var seg = document.getElementById(id);
    if (!seg) return;
    seg.querySelectorAll('.inspector__layout-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        seg.querySelectorAll('.inspector__layout-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        onChange(btn.dataset.value);
      });
    });
  }

  /* ── Reset ── */
  function resetAll() {
    state.items         = makeItems();
    state.fontSize      = 48;
    state.fontWeight    = 800;
    state.letterSpacing = 0.06;
    state.lineHeight    = 1.1;
    state.itemGap       = 12;
    state.textColor     = '#ffffff';
    state.cardRadius    = 14;
    state.ratio         = 'portrait';
    state.nextId        = 6;

    if (detailEl) detailEl.classList.remove('open');
    currentDetailItem = null;

    buildWidgetHTML();
    renderItemList();

    var sizeInput = document.getElementById('hirFontSize');
    if (sizeInput) sizeInput.value = 48;
    var lsInput = document.getElementById('hirLetterSpacing');
    var gapInput = document.getElementById('hirItemGap');
    if (gapInput) gapInput.value = 12;
    if (lsInput) lsInput.value = 0.06;
    var lhInput = document.getElementById('hirLineHeight');
    if (lhInput) lhInput.value = 1.1;
    var textPicker = document.getElementById('hirTextPicker');
    if (textPicker) textPicker.value = '#ffffff';
    var textHex = document.getElementById('hirTextHex');
    if (textHex) textHex.value = '#FFFFFF';
    var textSwatch = document.getElementById('hirTextSwatch');
    if (textSwatch) textSwatch.style.background = '#ffffff';
    var radiusInput = document.getElementById('hirCardRadius');
    if (radiusInput) radiusInput.value = 14;

    var wseg = document.getElementById('hirWeightSegment');
    if (wseg) wseg.querySelectorAll('.inspector__layout-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.value === '800');
    });
    var rseg = document.getElementById('hirRatioSegment');
    if (rseg) rseg.querySelectorAll('.inspector__layout-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.value === 'portrait');
    });
  }

  /* ── Init ── */
  buildWidgetHTML();
  renderItemList();
  bindInspector();
  detailEl = createDetailPanel();

})();
