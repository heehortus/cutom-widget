/* =====================================
   Spin Carousel Widget
   ===================================== */
(function () {
  'use strict';

  /* ── Defaults ── */
  var RATIOS = {
    portrait:  { w: 220, h: 293 },
    square:    { w: 240, h: 240 },
    landscape: { w: 280, h: 210 }
  };

  function makeCards() {
    return [1, 2, 3, 4, 5, 6].map(function (i) { return { id: i, src: '', alt: '' }; });
  }

  var DEFAULT_HEADER = {
    title:        '성장은 멈추지 않는다',
    titleSize:    42,
    titleHex:     '#212529',
    titleOpacity: 100,
    desc:         '끊임없이 나아가는 우리의 이야기',
    descSize:     18,
    descHex:      '#6b7280',
    descOpacity:  100,
    align:        'center'
  };

  var state = {
    cards:     makeCards(),
    speed:     12,
    direction: 'left',
    ratio:     'portrait',
    nextId:    7,
    header:    JSON.parse(JSON.stringify(DEFAULT_HEADER))
  };

  var detailEl          = null;
  var currentDetailCard = null;
  var dragSrcId         = null;

  /* ── Helpers ── */
  function clamp(v, mn, mx) { return Math.min(Math.max(v, mn), mx); }
  function escAttr(str) { return String(str).replace(/"/g, '&quot;'); }
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
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

  /* ── Build widget HTML ── */
  function buildWidgetHTML() {
    var wrap = document.getElementById('spinCarouselWrap');
    if (!wrap) return;

    var N   = state.cards.length;
    var dim = RATIOS[state.ratio];
    var radius      = Math.max(160, Math.round(N * (dim.w + 50) / (2 * Math.PI)));
    var perspective = Math.round(radius * 3.5);
    var h = state.header;

    var cardsHTML = state.cards.map(function (card, i) {
      var angle = (360 / N) * i;
      var t = 'rotateY(' + angle + 'deg) translateZ(' + radius + 'px)';
      var cls = 'sc-card' + (card.src ? '' : ' sc-card--ph');
      var inner = card.src ? '<img src="' + escAttr(card.src) + '" alt="' + escAttr(card.alt) + '">' : '';
      return '<div class="' + cls + '" style="transform:' + t + '">' + inner + '</div>';
    }).join('');

    var titleHtml = h.title
      ? '<h2 class="sc-title">' + esc(h.title) + '</h2>'
      : '<h2 class="sc-title sc-ph" style="opacity:0.35">' + esc(DEFAULT_HEADER.title) + '</h2>';

    var descHtml = h.desc
      ? '<p class="sc-desc">' + esc(h.desc) + '</p>'
      : '<p class="sc-desc sc-ph" style="opacity:0.35">' + esc(DEFAULT_HEADER.desc) + '</p>';

    wrap.innerHTML =
      '<div class="sc-wrapper" id="scWrapper" data-align="' + escAttr(h.align) + '">' +
        '<div class="sc-header">' +
          titleHtml +
          descHtml +
        '</div>' +
        '<div class="sc-root" id="scRoot">' +
          '<div class="sc-stage" id="scStage" style="perspective:' + perspective + 'px">' +
            '<div class="sc-scene" id="scScene">' + cardsHTML + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    applyVars();
  }

  /* ── Apply CSS vars & attributes ── */
  function applyVars() {
    var root    = document.getElementById('scRoot');
    var wrapper = document.getElementById('scWrapper');
    if (!root) return;
    var dim = RATIOS[state.ratio];
    root.style.setProperty('--sc-speed',  state.speed + 's');
    root.style.setProperty('--sc-card-w', dim.w + 'px');
    root.style.setProperty('--sc-card-h', dim.h + 'px');
    root.setAttribute('data-direction', state.direction);
    if (wrapper) applyHeaderVars(wrapper);
  }

  function applyHeaderVars(wrapper) {
    var h = state.header;
    var titleColor = hexToRgba(h.titleHex, h.titleOpacity) || h.titleHex;
    var descColor  = hexToRgba(h.descHex,  h.descOpacity)  || h.descHex;
    wrapper.style.setProperty('--sc-title-size',  h.titleSize + 'px');
    wrapper.style.setProperty('--sc-title-color', titleColor);
    wrapper.style.setProperty('--sc-desc-size',   h.descSize  + 'px');
    wrapper.style.setProperty('--sc-desc-color',  descColor);
    wrapper.setAttribute('data-align', h.align);
    /* sync swatches */
    var titleSwatch = document.getElementById('scTitleSwatch');
    var descSwatch  = document.getElementById('scDescSwatch');
    if (titleSwatch) titleSwatch.style.background = titleColor;
    if (descSwatch)  descSwatch.style.background  = descColor;
  }

  /* ── Restart CSS animation (direction change) ── */
  function restartAnim() {
    var scene = document.getElementById('scScene');
    if (!scene) return;
    scene.style.animation = 'none';
    void scene.offsetWidth;
    scene.style.animation = '';
  }

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

  /* ── Detail panel ── */
  function createDetailPanel() {
    var inspector = document.getElementById('spinCarouselInspector');
    var panel = document.createElement('div');
    panel.className = 'inspector__detail';
    panel.innerHTML =
      '<div class="inspector__detail-head">' +
        '<button class="inspector__detail-back" type="button">' +
          '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"' +
          ' stroke-linecap="round" stroke-linejoin="round" width="11" height="11">' +
          '<polyline points="10,3 4,8 10,13"/></svg>' +
          '카드' +
        '</button>' +
        '<button class="inspector__detail-close" type="button">&#x2715;</button>' +
      '</div>' +
      '<div class="inspector__detail-body" id="scDetailBody"></div>';
    inspector.appendChild(panel);

    panel.querySelector('.inspector__detail-back').addEventListener('click', function () {
      panel.classList.remove('open');
      currentDetailCard = null;
    });
    panel.querySelector('.inspector__detail-close').addEventListener('click', function () {
      panel.classList.remove('open');
      currentDetailCard = null;
      var closeBtn = inspector.querySelector('.inspector__close');
      if (closeBtn) closeBtn.click();
    });

    return panel;
  }

  /* ── Render detail body ── */
  function renderDetailBody(bodyEl, card) {
    bodyEl.innerHTML = '';

    /* 이미지 */
    var imgField = document.createElement('div');
    imgField.className = 'inspector__field';
    var thumbSrc = card.src
      ? '<img src="' + escAttr(card.src) + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">'
      : UPLOAD_SVG;
    imgField.innerHTML =
      '<label class="inspector__field-label">이미지</label>' +
      '<div style="display:flex;flex-direction:column;gap:6px">' +
        '<div class="inspector__img-upload' + (card.src ? ' inspector__img-upload--filled' : '') + '" id="scImgUpload">' +
          '<div class="inspector__img-thumb' + (card.src ? ' inspector__img-thumb--filled' : '') + '" id="scImgThumb">' +
            thumbSrc +
          '</div>' +
          '<button class="inspector__img-clear" id="scImgClear" type="button" title="이미지 제거">&#x2715;</button>' +
          '<input type="file" accept="image/*" id="scImgFile" style="display:none">' +
        '</div>' +
        '<input type="text" class="inspector__card-name-input" id="scImgUrl"' +
        ' placeholder="또는 URL 입력"' +
        ' value="' + (card.src && card.src.startsWith('data:') ? '' : escAttr(card.src || '')) + '">' +
      '</div>';

    var uploadWrap = imgField.querySelector('#scImgUpload');
    var thumb      = imgField.querySelector('#scImgThumb');
    var clearBtn   = imgField.querySelector('#scImgClear');
    var fileInput  = imgField.querySelector('#scImgFile');
    var urlInput   = imgField.querySelector('#scImgUrl');

    function setCardImg(src) {
      card.src = src;
      buildWidgetHTML();
      /* 이름 업데이트 */
      var row = document.querySelector('.inspector__item-row[data-id="' + card.id + '"]');
      if (row) {
        var nameEl = row.querySelector('.inspector__item-name');
        if (nameEl) nameEl.textContent = src ? '카드 (이미지)' : '카드 ' + (state.cards.indexOf(card) + 1);
      }
    }

    thumb.addEventListener('click', function () { fileInput.click(); });

    fileInput.addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        setCardImg(ev.target.result);
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
      setCardImg('');
      urlInput.value = '';
      thumb.innerHTML = UPLOAD_SVG;
      thumb.classList.remove('inspector__img-thumb--filled');
      uploadWrap.classList.remove('inspector__img-upload--filled');
      fileInput.value = '';
    });

    urlInput.addEventListener('input', function (e) {
      var src = e.target.value.trim();
      setCardImg(src);
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
      ' value="' + escAttr(card.alt) + '" placeholder="이미지 설명" style="width:100%">';
    altField.querySelector('input').addEventListener('input', function (e) {
      card.alt = e.target.value;
      var imgEl = document.querySelector('.sc-card:nth-child(' + (state.cards.indexOf(card) + 1) + ') img');
      if (imgEl) imgEl.alt = card.alt;
    });
    bodyEl.appendChild(altField);
  }

  function openDetail(card) {
    if (!detailEl) return;
    currentDetailCard = card;
    var bodyEl = detailEl.querySelector('#scDetailBody');
    renderDetailBody(bodyEl, card);
    detailEl.classList.add('open');
  }

  /* ── Render inspector card list ── */
  function renderCardList() {
    var list = document.getElementById('scCardList');
    if (!list) return;

    list.innerHTML = '';
    state.cards.forEach(function (card, i) {
      var row = document.createElement('div');
      row.className = 'inspector__item-row';
      row.dataset.id = card.id;
      row.innerHTML =
        '<span class="inspector__drag">' + DRAG_SVG + '</span>' +
        '<span class="inspector__item-name">카드 ' + (i + 1) + '</span>' +
        '<span class="inspector__item-arrow">' + ARROW_SVG + '</span>';

      row.addEventListener('click', function (e) {
        if (e.target.closest('.inspector__drag')) return;
        openDetail(card);
      });

      setupDragDrop(row, card.id);
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
      var srcIdx = state.cards.findIndex(function (c) { return c.id === dragSrcId; });
      var moved  = state.cards.splice(srcIdx, 1)[0];
      var dstIdx = state.cards.findIndex(function (c) { return c.id === id; });
      state.cards.splice(before ? dstIdx : dstIdx + 1, 0, moved);
      buildWidgetHTML();
      renderCardList();
    });
  }

  function clearDragIndicators() {
    var list = document.getElementById('scCardList');
    if (!list) return;
    list.querySelectorAll('.inspector__item-row').forEach(function (r) {
      r.classList.remove('drag-over-top', 'drag-over-bottom');
    });
  }

  /* ── Color bind helper ── */
  function bindColor(pickerId, hexId, opacityId, swatchId, key) {
    var picker = document.getElementById(pickerId);
    var hexEl  = document.getElementById(hexId);
    var opEl   = opacityId ? document.getElementById(opacityId) : null;
    if (!picker || !hexEl) return;

    function applyColor() {
      var wrapper = document.getElementById('scWrapper');
      if (wrapper) applyHeaderVars(wrapper);
    }

    picker.addEventListener('input', function () {
      var val = picker.value.toUpperCase();
      state.header[key] = val;
      hexEl.value = val;
      applyColor();
    });
    hexEl.addEventListener('input', function () {
      var v = hexEl.value;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        state.header[key] = v.toUpperCase();
        picker.value = v;
        applyColor();
      }
    });
    if (opEl) {
      var opKey = key.replace('Hex', 'Opacity');
      opEl.addEventListener('input', function () {
        state.header[opKey] = clamp(parseFloat(opEl.value) || 0, 0, 100);
        applyColor();
      });
    }
  }

  /* ── Inspector bindings ── */
  function bindInspector() {
    var inspector = document.getElementById('spinCarouselInspector');

    /* Section toggles */
    if (inspector) {
      inspector.querySelectorAll('.inspector__sec-toggle').forEach(function (btn) {
        btn.addEventListener('click', function () {
          btn.closest('.inspector__section').classList.toggle('collapsed');
        });
      });
    }

    /* ── Header: title text ── */
    var scTitleText = document.getElementById('scTitleText');
    if (scTitleText) {
      scTitleText.value = state.header.title;
      scTitleText.addEventListener('input', function () {
        state.header.title = scTitleText.value;
        buildWidgetHTML();
      });
    }

    /* ── Header: desc text ── */
    var scDescText = document.getElementById('scDescText');
    if (scDescText) {
      scDescText.value = state.header.desc;
      scDescText.addEventListener('input', function () {
        state.header.desc = scDescText.value;
        buildWidgetHTML();
      });
    }

    /* ── Header: title size ── */
    var scTitleSize = document.getElementById('scTitleSize');
    if (scTitleSize) {
      scTitleSize.value = state.header.titleSize;
      scTitleSize.addEventListener('input', function () {
        var v = parseFloat(scTitleSize.value);
        if (!isNaN(v)) {
          state.header.titleSize = clamp(v, 12, 120);
          var wrapper = document.getElementById('scWrapper');
          if (wrapper) wrapper.style.setProperty('--sc-title-size', state.header.titleSize + 'px');
        }
      });
    }

    /* ── Header: desc size ── */
    var scDescSize = document.getElementById('scDescSize');
    if (scDescSize) {
      scDescSize.value = state.header.descSize;
      scDescSize.addEventListener('input', function () {
        var v = parseFloat(scDescSize.value);
        if (!isNaN(v)) {
          state.header.descSize = clamp(v, 8, 60);
          var wrapper = document.getElementById('scWrapper');
          if (wrapper) wrapper.style.setProperty('--sc-desc-size', state.header.descSize + 'px');
        }
      });
    }

    /* ── Header: color pickers ── */
    bindColor('scTitlePicker', 'scTitleHex', 'scTitleOpacity', 'scTitleSwatch', 'titleHex');
    bindColor('scDescPicker',  'scDescHex',  'scDescOpacity',  'scDescSwatch',  'descHex');

    /* ── Header: align segment ── */
    bindSegment('scAlignSegment', function (val) {
      state.header.align = val;
      var wrapper = document.getElementById('scWrapper');
      if (wrapper) wrapper.setAttribute('data-align', val);
    });

    /* Add card */
    var addBtn = document.getElementById('scAddCard');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        if (state.cards.length >= 12) return;
        state.cards.push({ id: state.nextId++, src: '', alt: '' });
        buildWidgetHTML();
        renderCardList();
      });
    }

    /* Speed */
    var scSpeed = document.getElementById('scSpeed');
    if (scSpeed) {
      scSpeed.addEventListener('input', function () {
        var v = parseFloat(scSpeed.value);
        if (!isNaN(v)) { state.speed = clamp(v, 2, 60); applyVars(); }
      });
    }

    /* Direction */
    bindSegment('scDirectionSegment', function (val) {
      state.direction = val;
      applyVars();
      restartAnim();
    });

    /* Ratio */
    bindSegment('scRatioSegment', function (val) {
      state.ratio = val;
      buildWidgetHTML();
    });

    /* Reset */
    var scReset = document.getElementById('scReset');
    if (scReset) scReset.addEventListener('click', resetAll);
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
    state.cards     = makeCards();
    state.speed     = 12;
    state.direction = 'left';
    state.ratio     = 'portrait';
    state.nextId    = 7;
    state.header    = JSON.parse(JSON.stringify(DEFAULT_HEADER));

    if (detailEl) detailEl.classList.remove('open');
    currentDetailCard = null;

    buildWidgetHTML();
    renderCardList();

    /* Sync header inputs */
    var el;
    el = document.getElementById('scTitleText');    if (el) el.value = state.header.title;
    el = document.getElementById('scDescText');     if (el) el.value = state.header.desc;
    el = document.getElementById('scTitleSize');    if (el) el.value = state.header.titleSize;
    el = document.getElementById('scDescSize');     if (el) el.value = state.header.descSize;
    el = document.getElementById('scTitlePicker');  if (el) el.value = state.header.titleHex;
    el = document.getElementById('scTitleHex');     if (el) el.value = state.header.titleHex;
    el = document.getElementById('scTitleOpacity'); if (el) el.value = state.header.titleOpacity;
    el = document.getElementById('scDescPicker');   if (el) el.value = state.header.descHex;
    el = document.getElementById('scDescHex');      if (el) el.value = state.header.descHex;
    el = document.getElementById('scDescOpacity');  if (el) el.value = state.header.descOpacity;

    var alignSeg = document.getElementById('scAlignSegment');
    if (alignSeg) alignSeg.querySelectorAll('.inspector__layout-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.value === state.header.align);
    });

    /* Sync carousel inputs */
    var scSpeed = document.getElementById('scSpeed');
    if (scSpeed) scSpeed.value = 12;

    var seg = document.getElementById('scDirectionSegment');
    if (seg) seg.querySelectorAll('.inspector__layout-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.value === 'left');
    });
    var rseg = document.getElementById('scRatioSegment');
    if (rseg) rseg.querySelectorAll('.inspector__layout-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.value === 'portrait');
    });
  }

  /* ── Init ── */
  buildWidgetHTML();
  renderCardList();
  bindInspector();
  detailEl = createDetailPanel();

})();
