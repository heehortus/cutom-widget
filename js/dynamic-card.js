/* =====================================
   Dynamic Card (Card Stack) Widget Editor
   ===================================== */

(function () {
  'use strict';

  /* ── Widget constants ── */
  var STAGGER_MS   = 60;
  var STAGE_PAD    = 40;
  var EDGE_PAD     = 0;
  var BUMP_DIST    = 14;
  var BUMP_HOLD_MS = 140;
  var BUMP_OUT     = 'transform 120ms ease-out';
  var BUMP_BACK    = 'transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)';
  var CENTER_BAND  = '-50% 0px -50% 0px';

  /* ── State ── */
  var nextId = 7;
  var items = [
    { id: 1, image: '', title: '카드 제목' },
    { id: 2, image: '', title: '카드 제목' },
    { id: 3, image: '', title: '카드 제목' },
    { id: 4, image: '', title: '카드 제목' },
    { id: 5, image: '', title: '카드 제목' },
    { id: 6, image: '', title: '카드 제목' }
  ];

  var style = {
    cardWidth:        260,
    cardHeight:       340,
    gap:              24,
    rotateMax:        6,
    repeat:           true,
    cardBg:           '#CED4DA',
    cardBgOpacity:    100,
    titleColor:       '#FFFFFF',
    titleColorOpacity:100,
    arrowColor:       '#1A1A1A',
    arrowColorOpacity:100,
    arrowBg:          '#E8E8E8',
    arrowBgOpacity:   100,
    radius:           16,
    duration:         700,
    titleSize:        16,
    titleWeight:      600,
    dimHeight:        55
  };

  var dragSrcId   = null;
  var currentRO   = null;  /* active ResizeObserver ref for cleanup */
  var isFirstRender = true;

  /* ── DOM refs ── */
  var container   = document.getElementById('dynamicCardContainer');
  var itemListEl  = document.getElementById('dynamicCardItemList');

  /* ── Detail Panel ── */
  var currentDetailItem = null;
  var detailEl = null;

  var UPLOAD_SVG_DC = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="8,10 8,3"/><polyline points="5,6 8,3 11,6"/><path d="M3 12v.5A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5V12"/></svg>';

  function createDetailPanel() {
    var inspectorEl = document.querySelector('#dynamicCardInspector');
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
      '<div class="inspector__detail-body" id="dcDetailBody"></div>';
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
      '<div class="inspector__img-upload' + (item.image ? ' inspector__img-upload--filled' : '') + '">' +
        '<div class="inspector__img-thumb' + (item.image ? ' inspector__img-thumb--filled' : '') + '">' +
          (item.image ? '<img src="' + escAttr(item.image) + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">' : UPLOAD_SVG_DC) +
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
        item.image = ev.target.result;
        updateCardInPlace(item.id, 'image', item.image);
        thumb.innerHTML = '<img src="' + item.image + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">';
        thumb.classList.add('inspector__img-thumb--filled');
        uploadWrap.classList.add('inspector__img-upload--filled');
        fileInput.value = '';
      };
      reader.readAsDataURL(file);
    });
    clearBtn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      item.image = '';
      updateCardInPlace(item.id, 'image', '');
      thumb.innerHTML = UPLOAD_SVG_DC;
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
      '<input class="inspector__card-name-input" type="text" value="' + escAttr(item.title) + '" placeholder="카드 제목" style="width:100%">';
    titleField.querySelector('input').addEventListener('input', function (e) {
      item.title = e.target.value;
      updateCardInPlace(item.id, 'title', item.title);
      var rowEl = itemListEl.querySelector('[data-id="' + item.id + '"] .inspector__item-name');
      if (rowEl) rowEl.textContent = e.target.value || '카드 제목';
    });
    bodyEl.appendChild(titleField);

    /* 삭제 버튼 */
    var deleteWrap = document.createElement('div');
    deleteWrap.style.marginTop = '8px';
    deleteWrap.innerHTML =
      '<button class="inspector__delete-btn" type="button">' +
        '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><polyline points="1,3 13,3"/><path d="M4,3V2.5A.5.5,0,0,1,4.5,2h5A.5.5,0,0,1,10,2.5V3"/><rect x="2" y="3" width="10" height="9" rx="1"/><line x1="5" y1="6" x2="5" y2="10"/><line x1="9" y1="6" x2="9" y2="10"/></svg>' +
        '카드 삭제' +
      '</button>';
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
    var bodyEl = detailEl.querySelector('#dcDetailBody');
    renderDetailBody(bodyEl, item);
    detailEl.classList.add('open');
  }

  /* ── Helpers ── */
  function hexToRgba(hex, opacity) {
    var h = hex.replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return 'rgba(' +
      parseInt(h.slice(0, 2), 16) + ',' +
      parseInt(h.slice(2, 4), 16) + ',' +
      parseInt(h.slice(4, 6), 16) + ',' +
      (opacity / 100) + ')';
  }

  function clampInt(val, min, max) {
    return Math.min(max, Math.max(min, parseInt(val) || min));
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escAttr(str) {
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ── Build widget HTML ── */
  function buildWidgetHTML(startSpread) {
    var arrowPrev =
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">' +
        '<path d="M15 5L8 12L15 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
    var arrowNext =
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">' +
        '<path d="M9 5L16 12L9 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';

    var cardsHTML = items.map(function (item) {
      return '<article class="iw-cardstack__card" data-id="' + item.id + '">' +
        '<div class="iw-cardstack__inner">' +
          (item.image ? '<img class="iw-cardstack__img" src="' + escAttr(item.image) + '" alt="">' : '') +
          '<div class="iw-cardstack__title editor-content"><p>' + esc(item.title) + '</p></div>' +
        '</div>' +
      '</article>';
    }).join('');

    return '<section class="iw-cardstack"' +
      ' data-state="' + (startSpread ? 'spread' : 'stacked') + '"' +
      ' data-draggable="false" data-dragging="false"' +
      ' data-card-width="' + style.cardWidth + '"' +
      ' data-card-height="' + style.cardHeight + '"' +
      ' data-gap="' + style.gap + '"' +
      ' data-rotate-max="' + style.rotateMax + '"' +
      ' data-repeat="' + style.repeat + '">' +
      '<div class="iw-cardstack__nav">' +
        '<button type="button" class="iw-cardstack__arrow" data-dir="prev" data-state="disabled" aria-label="이전 카드">' + arrowPrev + '</button>' +
        '<button type="button" class="iw-cardstack__arrow" data-dir="next" data-state="enabled"  aria-label="다음 카드">' + arrowNext + '</button>' +
      '</div>' +
      '<div class="iw-cardstack__stage">' + cardsHTML + '</div>' +
    '</section>';
  }

  /* ── Apply CSS vars to widget root ── */
  function applyCSSVarsToRoot(rootEl) {
    var cardBg   = hexToRgba(style.cardBg,    style.cardBgOpacity)    || style.cardBg;
    var titleC   = hexToRgba(style.titleColor, style.titleColorOpacity) || style.titleColor;
    var arrowC   = hexToRgba(style.arrowColor, style.arrowColorOpacity) || style.arrowColor;
    var arrowBg  = hexToRgba(style.arrowBg,   style.arrowBgOpacity)   || style.arrowBg;

    rootEl.style.setProperty('--color-card-bg',   cardBg);
    rootEl.style.setProperty('--color-title',      titleC);
    rootEl.style.setProperty('--color-arrow',      arrowC);
    rootEl.style.setProperty('--color-arrow-bg',   arrowBg);
    rootEl.style.setProperty('--radius-card',      style.radius   + 'px');
    rootEl.style.setProperty('--duration-spread',  style.duration + 'ms');
    rootEl.style.setProperty('--title-size',       style.titleSize + 'px');
    rootEl.style.setProperty('--title-weight',     String(style.titleWeight));
    rootEl.style.setProperty('--dim-height',       style.dimHeight + '%');

    document.getElementById('dcCardBgSwatchWrap').style.background    = cardBg;
    document.getElementById('dcTitleColorSwatchWrap').style.background = titleC;
    document.getElementById('dcArrowColorSwatchWrap').style.background = arrowC;
    document.getElementById('dcArrowBgSwatchWrap').style.background    = arrowBg;
  }

  /* ── Init widget behavior ── */
  function initWidgetBehavior(rootEl, skipAnimation) {
    var stage   = rootEl.querySelector('.iw-cardstack__stage');
    var cards   = rootEl.querySelectorAll('.iw-cardstack__card');
    var prevBtn = rootEl.querySelector('.iw-cardstack__arrow[data-dir="prev"]');
    var nextBtn = rootEl.querySelector('.iw-cardstack__arrow[data-dir="next"]');
    if (!stage || !cards.length) return;

    var baseW     = parseFloat(rootEl.getAttribute('data-card-width'))  || style.cardWidth;
    var baseH     = parseFloat(rootEl.getAttribute('data-card-height')) || style.cardHeight;
    var gap       = parseFloat(rootEl.getAttribute('data-gap'))          || style.gap;
    var rotateMax = parseFloat(rootEl.getAttribute('data-rotate-max'))  || style.rotateMax;
    var repeat    = rootEl.getAttribute('data-repeat') === 'true';

    var cardW = baseW;
    var cardH = baseH;
    var dragX = 0;
    var minDrag = 0;
    var dragging = false;
    var pointerStartX = 0;
    var dragStartX = 0;
    var bumpTimers = [];

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function isSpread() {
      return rootEl.getAttribute('data-state') === 'spread';
    }

    function updateNav() {
      if (!prevBtn || !nextBtn) return;
      prevBtn.setAttribute('data-state', dragX < 0        ? 'enabled' : 'disabled');
      nextBtn.setAttribute('data-state', dragX > minDrag  ? 'enabled' : 'disabled');
    }

    function applyState() {
      var spread  = isSpread();
      var count   = cards.length;
      var stageW  = stage.offsetWidth;
      var spacing = cardW + gap;
      var stackX  = (stageW - cardW) / 2;
      var isMobile = window.innerWidth <= 768;

      for (var i = 0; i < count; i++) {
        var angle = (spread || isMobile) ? 0 : (count > 1 ? (i / (count - 1)) * 2 * rotateMax - rotateMax : 0);
        var x     = spread ? EDGE_PAD + i * spacing + dragX : stackX;
        cards[i].style.transform      = 'translate(' + x + 'px, -50%) rotate(' + angle + 'deg)';
        cards[i].style.transitionDelay = dragging ? '0ms' : (i * STAGGER_MS) + 'ms';
        cards[i].style.zIndex          = String(i + 1);
      }

      rootEl.setAttribute('data-draggable', String(spread && minDrag < 0));
      updateNav();
    }

    function setTransition(enabled) {
      for (var i = 0; i < cards.length; i++) {
        cards[i].style.transition = enabled ? '' : 'none';
      }
    }

    function layout() {
      var count  = cards.length;
      var stageW = stage.offsetWidth;
      cardW = Math.min(baseW, Math.round(stageW * 0.9));
      cardH = Math.round(cardW * (baseH / baseW));

      var totalW = count * cardW + (count - 1) * gap;
      minDrag = Math.min(0, stageW - totalW - EDGE_PAD);
      dragX   = clamp(dragX, minDrag, 0);

      for (var i = 0; i < count; i++) {
        cards[i].style.width  = cardW + 'px';
        cards[i].style.height = cardH + 'px';
      }
      stage.style.height = (cardH + STAGE_PAD) + 'px';
      applyState();
    }

    /* Bump animation on hover */
    function bumpCard(card, index, event) {
      if (!isSpread() || dragging) return;
      var inner = card.querySelector('.iw-cardstack__inner');
      if (!inner) return;

      var rect = card.getBoundingClientRect();
      var dx   = rect.left + rect.width  / 2 - event.clientX;
      var dy   = rect.top  + rect.height / 2 - event.clientY;
      var len  = Math.sqrt(dx * dx + dy * dy) || 1;
      dx = (dx / len) * BUMP_DIST;
      dy = (dy / len) * BUMP_DIST;

      if (bumpTimers[index]) clearTimeout(bumpTimers[index]);
      inner.style.transition = BUMP_OUT;
      inner.style.transform  = 'translate(' + dx + 'px,' + dy + 'px)';

      bumpTimers[index] = setTimeout(function () {
        inner.style.transition = BUMP_BACK;
        inner.style.transform  = 'translate(0,0)';
        bumpTimers[index] = null;
      }, BUMP_HOLD_MS);
    }

    for (var i = 0; i < cards.length; i++) {
      (function (card, idx) {
        card.addEventListener('pointerenter', function (e) { bumpCard(card, idx, e); });
      }(cards[i], i));
    }

    /* Arrow buttons */
    function stepTo(direction) {
      if (!isSpread() || minDrag >= 0) return;
      var spacing = cardW + gap;
      dragX = clamp(dragX + direction * spacing, minDrag, 0);
      /* no stagger for arrow steps */
      for (var i = 0; i < cards.length; i++) cards[i].style.transitionDelay = '0ms';
      applyState();
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { stepTo(1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { stepTo(-1); });

    /* Drag */
    stage.addEventListener('pointerdown', function (e) {
      if (!isSpread() || minDrag >= 0) return;
      dragging = true;
      pointerStartX = e.clientX;
      dragStartX    = dragX;
      rootEl.setAttribute('data-dragging', 'true');
      setTransition(false);
      stage.setPointerCapture(e.pointerId);
    });

    stage.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      dragX = clamp(dragStartX + (e.clientX - pointerStartX), minDrag, 0);
      applyState();
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      rootEl.setAttribute('data-dragging', 'false');
      setTransition(true);
      applyState();
    }

    stage.addEventListener('pointerup',     endDrag);
    stage.addEventListener('pointercancel', endDrag);
    stage.addEventListener('pointerleave',  endDrag);

    /* IntersectionObserver: stacked → spread animation */
    var io = new IntersectionObserver(function (entries) {
      for (var j = 0; j < entries.length; j++) {
        if (entries[j].isIntersecting) {
          rootEl.setAttribute('data-state', 'spread');
          applyState();
          if (!repeat) io.unobserve(stage);
        } else if (repeat) {
          dragX = 0;
          rootEl.setAttribute('data-state', 'stacked');
          applyState();
        }
      }
    }, { rootMargin: CENTER_BAND, threshold: 0 });

    io.observe(stage);

    /* ResizeObserver */
    if (currentRO) currentRO.disconnect();
    currentRO = new ResizeObserver(layout);
    currentRO.observe(stage);
    window.addEventListener('resize', layout);

    /* Initial layout — skip animation for re-renders */
    if (skipAnimation) {
      setTransition(false);
      layout();
      setTimeout(function () { setTransition(true); }, 50);
    } else {
      layout();
    }
  }

  /* ── Render widget ── */
  function renderWidget() {
    var spread = !isFirstRender;
    isFirstRender = false;

    if (currentRO) { currentRO.disconnect(); currentRO = null; }

    container.innerHTML = buildWidgetHTML(spread);
    var rootEl = container.querySelector('.iw-cardstack');
    if (!rootEl) return;

    applyCSSVarsToRoot(rootEl);
    initWidgetBehavior(rootEl, spread /* skipAnimation on re-render */);
  }

  /* ── Update CSS vars only (no re-render) ── */
  function updateCSSVars() {
    var rootEl = container.querySelector('.iw-cardstack');
    if (rootEl) applyCSSVarsToRoot(rootEl);
  }

  /* ── Update a single card in-place ── */
  function updateCardInPlace(id, field, value) {
    var cardEl = container.querySelector('.iw-cardstack__card[data-id="' + id + '"]');
    if (!cardEl) return;

    if (field === 'title') {
      var titleEl = cardEl.querySelector('.iw-cardstack__title p');
      if (titleEl) titleEl.textContent = value;
    }

    if (field === 'image') {
      var innerEl = cardEl.querySelector('.iw-cardstack__inner');
      var imgEl   = cardEl.querySelector('.iw-cardstack__img');
      if (value) {
        if (!imgEl) {
          imgEl = document.createElement('img');
          imgEl.className = 'iw-cardstack__img';
          imgEl.alt = '';
          innerEl.insertBefore(imgEl, innerEl.firstChild);
        }
        imgEl.src = value;
      } else {
        if (imgEl) imgEl.remove();
      }
    }
  }

  /* ── Render inspector item list ── */
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
        '<span class="inspector__item-name">' + esc(item.title || '카드 제목') + '</span>' +
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

  /* ── Drag & drop reorder ── */
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
      var rect = row.getBoundingClientRect();
      var mid  = rect.top + rect.height / 2;
      row.classList.add(e.clientY < mid ? 'drag-over-top' : 'drag-over-bottom');
    });

    row.addEventListener('drop', function (e) {
      e.preventDefault();
      if (dragSrcId === null || dragSrcId === id) return;

      var rect   = row.getBoundingClientRect();
      var before = e.clientY < rect.top + rect.height / 2;
      var srcIdx = items.findIndex(function (it) { return it.id === dragSrcId; });
      var moved  = items.splice(srcIdx, 1)[0];
      var dstIdx = items.findIndex(function (it) { return it.id === id; });
      items.splice(before ? dstIdx : dstIdx + 1, 0, moved);

      renderWidget();
      renderInspectorItems();
    });
  }

  function clearDragIndicators() {
    itemListEl.querySelectorAll('.inspector__item-row').forEach(function (r) {
      r.classList.remove('drag-over-top', 'drag-over-bottom');
    });
  }

  /* ── Add card ── */
  document.getElementById('addDynamicCard').addEventListener('click', function () {
    var newItem = { id: nextId++, image: '', title: '카드 제목' };
    items.push(newItem);
    renderWidget();
    renderInspectorItems();
    openDetail(newItem);
  });

  /* ── Layout controls (require re-render to pick up new baseW/H/gap/rotate) ── */
  function bindLayoutInput(id, key, min, max) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', function () {
      style[key] = clampInt(el.value, min, max);
      renderWidget();
    });
  }

  bindLayoutInput('dcCardWidth',  'cardWidth',  80,  600);
  bindLayoutInput('dcCardHeight', 'cardHeight', 80,  800);
  bindLayoutInput('dcGap',        'gap',         0,  120);
  bindLayoutInput('dcRotateMax',  'rotateMax',   0,   45);

  /* ── Style controls (CSS vars only, no re-render) ── */
  function bindStyleInput(id, key, min, max) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', function () {
      style[key] = clampInt(el.value, min, max);
      updateCSSVars();
    });
  }

  bindStyleInput('dcRadius',    'radius',    0, 60);
  bindStyleInput('dcDuration',  'duration',  0, 3000);
  bindStyleInput('dcTitleSize', 'titleSize', 8, 80);
  bindStyleInput('dcDimHeight', 'dimHeight', 0, 100);

  document.getElementById('dcTitleWeight').addEventListener('change', function () {
    style.titleWeight = parseInt(this.value, 10);
    updateCSSVars();
  });

  document.getElementById('dcRepeat').addEventListener('change', function () {
    style.repeat = this.checked;
    var rootEl = container.querySelector('.iw-cardstack');
    if (rootEl) rootEl.setAttribute('data-repeat', String(style.repeat));
  });

  /* ── Color pair binding ── */
  function bindColorPair(pickerId, hexId, opacityId, hexKey, opacityKey) {
    var picker    = document.getElementById(pickerId);
    var hexEl     = document.getElementById(hexId);
    var opacityEl = opacityId ? document.getElementById(opacityId) : null;

    if (!picker || !hexEl) return;

    picker.addEventListener('input', function () {
      style[hexKey] = picker.value.toUpperCase();
      hexEl.value   = style[hexKey];
      updateCSSVars();
    });

    hexEl.addEventListener('input', function () {
      var v = hexEl.value;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        style[hexKey] = v.toUpperCase();
        picker.value  = v;
        updateCSSVars();
      }
    });

    if (opacityEl) {
      opacityEl.addEventListener('input', function () {
        style[opacityKey] = clampInt(opacityEl.value, 0, 100);
        updateCSSVars();
      });
    }
  }

  bindColorPair('dcCardBgPicker',     'dcCardBgHex',     'dcCardBgOpacity',     'cardBg',     'cardBgOpacity');
  bindColorPair('dcTitleColorPicker', 'dcTitleColorHex', 'dcTitleColorOpacity', 'titleColor', 'titleColorOpacity');
  bindColorPair('dcArrowColorPicker', 'dcArrowColorHex', 'dcArrowColorOpacity', 'arrowColor', 'arrowColorOpacity');
  bindColorPair('dcArrowBgPicker',    'dcArrowBgHex',    'dcArrowBgOpacity',    'arrowBg',    'arrowBgOpacity');

  /* ── Section collapse ── */
  document.getElementById('dynamicCardInspector').querySelectorAll('.inspector__sec-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.closest('.inspector__section').classList.toggle('collapsed');
    });
  });

  /* ── Inspector close ── */
  document.getElementById('dynamicCardInspectorClose').addEventListener('click', function () {
    document.getElementById('dynamicCardInspector').style.display = 'none';
  });

  /* ── Reset ── */

  function resetAll() {
    if (detailEl) detailEl.classList.remove('open');
    currentDetailItem = null;

    nextId = 7;
    items = [
      { id: 1, image: '', title: '카드 제목' },
      { id: 2, image: '', title: '카드 제목' },
      { id: 3, image: '', title: '카드 제목' },
      { id: 4, image: '', title: '카드 제목' },
      { id: 5, image: '', title: '카드 제목' },
      { id: 6, image: '', title: '카드 제목' }
    ];
    style = {
      cardWidth:        260,
      cardHeight:       340,
      gap:              24,
      rotateMax:        6,
      repeat:           true,
      cardBg:           '#CED4DA',
      cardBgOpacity:    100,
      titleColor:       '#FFFFFF',
      titleColorOpacity:100,
      arrowColor:       '#1A1A1A',
      arrowColorOpacity:100,
      arrowBg:          '#E8E8E8',
      arrowBgOpacity:   100,
      radius:           16,
      duration:         700,
      titleSize:        16,
      titleWeight:      600,
      dimHeight:        55
    };
    isFirstRender = true;

    /* 인스펙터 inputs 동기화 */
    document.getElementById('dcCardWidth').value       = 260;
    document.getElementById('dcCardHeight').value      = 340;
    document.getElementById('dcGap').value             = 24;
    document.getElementById('dcRotateMax').value       = 6;
    document.getElementById('dcRadius').value          = 16;
    document.getElementById('dcDuration').value        = 700;
    document.getElementById('dcTitleSize').value       = 16;
    document.getElementById('dcTitleWeight').value     = '600';
    document.getElementById('dcDimHeight').value       = 55;
    document.getElementById('dcRepeat').checked        = true;
    document.getElementById('dcCardBgPicker').value    = '#ced4da';
    document.getElementById('dcCardBgHex').value       = '#CED4DA';
    document.getElementById('dcCardBgOpacity').value   = 100;
    document.getElementById('dcTitleColorPicker').value = '#ffffff';
    document.getElementById('dcTitleColorHex').value    = '#FFFFFF';
    document.getElementById('dcTitleColorOpacity').value = 100;
    document.getElementById('dcArrowColorPicker').value = '#1a1a1a';
    document.getElementById('dcArrowColorHex').value    = '#1A1A1A';
    document.getElementById('dcArrowColorOpacity').value = 100;
    document.getElementById('dcArrowBgPicker').value   = '#e8e8e8';
    document.getElementById('dcArrowBgHex').value      = '#E8E8E8';
    document.getElementById('dcArrowBgOpacity').value  = 100;

    renderWidget();
    renderInspectorItems();
  }

  document.getElementById('dynamicCardReset').addEventListener('click', resetAll);

  /* ── Init ── */
  detailEl = createDetailPanel();
  renderWidget();
  renderInspectorItems();

})();
