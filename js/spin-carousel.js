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

  var state = {
    cards:     makeCards(),
    speed:     12,
    direction: 'left',
    ratio:     'portrait',
    nextId:    7
  };

  var detailEl          = null;
  var currentDetailCard = null;
  var dragSrcId         = null;

  /* ── Helpers ── */
  function clamp(v, mn, mx) { return Math.min(Math.max(v, mn), mx); }
  function escAttr(str) { return String(str).replace(/"/g, '&quot;'); }

  /* ── Build widget HTML ── */
  function buildWidgetHTML() {
    var wrap = document.getElementById('spinCarouselWrap');
    if (!wrap) return;

    var N   = state.cards.length;
    var dim = RATIOS[state.ratio];
    var radius      = Math.max(160, Math.round(N * (dim.w + 50) / (2 * Math.PI)));
    var perspective = Math.round(radius * 3.5);

    var cardsHTML = state.cards.map(function (card, i) {
      var angle = (360 / N) * i;
      var t = 'rotateY(' + angle + 'deg) translateZ(' + radius + 'px)';
      var cls = 'sc-card' + (card.src ? '' : ' sc-card--ph');
      var inner = card.src ? '<img src="' + escAttr(card.src) + '" alt="' + escAttr(card.alt) + '">' : '';
      return '<div class="' + cls + '" style="transform:' + t + '">' + inner + '</div>';
    }).join('');

    wrap.innerHTML =
      '<div class="sc-root" id="scRoot">' +
        '<div class="sc-stage" id="scStage" style="perspective:' + perspective + 'px">' +
          '<div class="sc-scene" id="scScene">' + cardsHTML + '</div>' +
        '</div>' +
      '</div>';

    applyVars();
  }

  /* ── Apply CSS vars & attributes ── */
  function applyVars() {
    var root = document.getElementById('scRoot');
    if (!root) return;
    var dim = RATIOS[state.ratio];
    root.style.setProperty('--sc-speed',  state.speed + 's');
    root.style.setProperty('--sc-card-w', dim.w + 'px');
    root.style.setProperty('--sc-card-h', dim.h + 'px');
    root.setAttribute('data-direction', state.direction);
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

    if (detailEl) detailEl.classList.remove('open');
    currentDetailCard = null;

    buildWidgetHTML();
    renderCardList();

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
