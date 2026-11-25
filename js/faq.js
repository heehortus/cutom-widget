/* =====================================
   FAQ Widget Editor — Controller
   ===================================== */

(function () {
  'use strict';

  /* ── State ── */
  var nextId = 4;
  var items = [
    { id: 1, q: 'Power Absorption', a: 'Korean yarn is split evenly and stably, so it has higher bulkiness and better absorbency.\nYou can expect about 150% functional superiority compared to Chinese products.', open: true },
    { id: 2, q: 'Lint free', a: 'Our fabric is designed to minimize lint and fiber shedding, keeping your environment clean.', open: false },
    { id: 3, q: 'Long lasting', a: 'Built with premium materials that maintain quality and appearance through extended use.', open: false }
  ];

  var dragSrcId = null;

  var textStyle = {
    qSize:    18,
    qHex:     '#1a1a1a',
    qOpacity: 100,
    aSize:    14,
    aHex:     '#6b7280',
    aOpacity: 100
  };

  var maxWidth = 760;
  var bgEnabled = false;
  var bgHex     = '#F5F5F5';

  /* ── Detail panel ── */
  var currentDetailItem = null;
  var detailEl = null;

  /* ── DOM refs ── */
  var faqWidget   = document.getElementById('faqWidget');
  var faqItemList = document.getElementById('faqItemList');

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
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  var ARROW_SVG =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"' +
    ' stroke-linecap="round" stroke-linejoin="round" width="12" height="12">' +
    '<polyline points="6,3 10,8 6,13"/></svg>';

  var DRAG_SVG =
    '<svg viewBox="0 0 8 14" fill="currentColor" width="8" height="14">' +
    '<circle cx="2" cy="2" r="1.2"/><circle cx="6" cy="2" r="1.2"/>' +
    '<circle cx="2" cy="7" r="1.2"/><circle cx="6" cy="7" r="1.2"/>' +
    '<circle cx="2" cy="12" r="1.2"/><circle cx="6" cy="12" r="1.2"/></svg>';

  var DELETE_SVG =
    '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"' +
    ' stroke-linecap="round" stroke-linejoin="round" width="13" height="13">' +
    '<polyline points="1,3 13,3"/><path d="M4,3V2.5A.5.5,0,0,1,4.5,2h5A.5.5,0,0,1,10,2.5V3"/>' +
    '<rect x="2" y="3" width="10" height="9" rx="1"/>' +
    '<line x1="5" y1="6" x2="5" y2="10"/><line x1="9" y1="6" x2="9" y2="10"/></svg>';

  /* ── Apply text style to widget ── */
  function applyTextStyle() {
    var qColor = hexToRgba(textStyle.qHex, textStyle.qOpacity) || textStyle.qHex;
    var aColor = hexToRgba(textStyle.aHex, textStyle.aOpacity) || textStyle.aHex;

    faqWidget.style.setProperty('--faq-q-size',  textStyle.qSize + 'px');
    faqWidget.style.setProperty('--faq-q-color', qColor);
    faqWidget.style.setProperty('--faq-a-size',  textStyle.aSize + 'px');
    faqWidget.style.setProperty('--faq-a-color', aColor);

    document.getElementById('faqQSwatchWrap').style.background = qColor;
    document.getElementById('faqASwatchWrap').style.background  = aColor;
  }

  /* ── Render widget ── */
  function renderWidget() {
    faqWidget.style.maxWidth = maxWidth + 'px';
    faqWidget.innerHTML = '';

    items.forEach(function (item) {
      var el = document.createElement('div');
      el.className = 'faq-item' + (item.open ? ' faq-item--open' : '');
      el.dataset.id = item.id;
      el.innerHTML =
        '<button class="faq-item__header" type="button">' +
          '<span class="faq-item__question">' + esc(item.q) + '</span>' +
          '<span class="faq-item__icon">' + (item.open ? '&#8722;' : '&#43;') + '</span>' +
        '</button>' +
        '<div class="faq-item__body">' +
          '<div class="faq-item__body-inner">' +
            '<div class="faq-item__body-pad">' +
              '<p class="faq-item__answer">' + esc(item.a) + '</p>' +
            '</div>' +
          '</div>' +
        '</div>';

      el.querySelector('.faq-item__header').addEventListener('click', function () {
        item.open = !item.open;
        el.classList.toggle('faq-item--open', item.open);
        el.querySelector('.faq-item__icon').innerHTML = item.open ? '&#8722;' : '&#43;';
      });

      faqWidget.appendChild(el);
    });

    applyTextStyle();
  }

  /* ── Detail panel ── */
  function createDetailPanel() {
    var inspectorEl = document.querySelector('#faqInspector');
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
      '<div class="inspector__detail-body" id="faqDetailBody"></div>';
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

    /* 질문 */
    var qField = document.createElement('div');
    qField.className = 'inspector__field';
    qField.innerHTML =
      '<label class="inspector__field-label">질문</label>' +
      '<input class="inspector__card-name-input" type="text"' +
      ' value="' + escAttr(item.q) + '" placeholder="질문" style="width:100%">';
    qField.querySelector('input').addEventListener('input', function (e) {
      item.q = e.target.value;
      var el = faqWidget.querySelector('[data-id="' + item.id + '"] .faq-item__question');
      if (el) el.textContent = item.q;
      var rowEl = faqItemList.querySelector('[data-id="' + item.id + '"] .inspector__item-name');
      if (rowEl) rowEl.textContent = item.q || '새 질문';
    });
    bodyEl.appendChild(qField);

    /* 답변 */
    var aField = document.createElement('div');
    aField.className = 'inspector__field';
    aField.innerHTML =
      '<label class="inspector__field-label">답변</label>' +
      '<textarea class="inspector__card-role-input" placeholder="답변" rows="5"' +
      ' style="width:100%;resize:vertical">' + esc(item.a) + '</textarea>';
    aField.querySelector('textarea').addEventListener('input', function (e) {
      item.a = e.target.value;
      var el = faqWidget.querySelector('[data-id="' + item.id + '"] .faq-item__answer');
      if (el) el.textContent = item.a;
    });
    bodyEl.appendChild(aField);

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
    var bodyEl = detailEl.querySelector('#faqDetailBody');
    renderDetailBody(bodyEl, item);
    detailEl.classList.add('open');
  }

  /* ── Render inspector item list ── */
  function renderInspectorItems() {
    faqItemList.innerHTML = '';

    items.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'inspector__item-row';
      row.dataset.id = item.id;
      row.innerHTML =
        '<span class="inspector__drag">' + DRAG_SVG + '</span>' +
        '<span class="inspector__item-name">' + esc(item.q || '새 질문') + '</span>' +
        '<span class="inspector__item-arrow">' + ARROW_SVG + '</span>';

      row.addEventListener('click', function (e) {
        if (e.target.closest('.inspector__drag')) return;
        openDetail(item);
      });

      setupDragDrop(row, item.id);
      faqItemList.appendChild(row);
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
      var mid = row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2;
      row.classList.add(e.clientY < mid ? 'drag-over-top' : 'drag-over-bottom');
    });

    row.addEventListener('drop', function (e) {
      e.preventDefault();
      if (dragSrcId === null || dragSrcId === id) return;

      var mid    = row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2;
      var before = e.clientY < mid;
      var srcIdx = items.findIndex(function (it) { return it.id === dragSrcId; });
      var moved  = items.splice(srcIdx, 1)[0];
      var dstIdx = items.findIndex(function (it) { return it.id === id; });
      items.splice(before ? dstIdx : dstIdx + 1, 0, moved);

      renderWidget();
      renderInspectorItems();
    });
  }

  function clearDragIndicators() {
    faqItemList.querySelectorAll('.inspector__item-row').forEach(function (r) {
      r.classList.remove('drag-over-top', 'drag-over-bottom');
    });
  }

  /* ── Add item ── */
  document.getElementById('addFaqItem').addEventListener('click', function () {
    var id = nextId++;
    var newItem = { id: id, q: '새 질문', a: '답변을 입력하세요.', open: false };
    items.push(newItem);
    renderWidget();
    renderInspectorItems();
    openDetail(newItem);
  });

  /* ── Text style controls ── */
  function bindColorControl(pickerId, hexId, opacityId, stateHexKey, stateOpacityKey) {
    var picker  = document.getElementById(pickerId);
    var hexEl   = document.getElementById(hexId);
    var opEl    = opacityId ? document.getElementById(opacityId) : null;

    picker.addEventListener('input', function () {
      textStyle[stateHexKey] = picker.value.toUpperCase();
      hexEl.value = textStyle[stateHexKey];
      applyTextStyle();
    });

    hexEl.addEventListener('input', function () {
      var v = hexEl.value;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        textStyle[stateHexKey] = v.toUpperCase();
        picker.value = v;
        applyTextStyle();
      }
    });

    if (opEl) {
      opEl.addEventListener('input', function () {
        textStyle[stateOpacityKey] = clamp(opEl.value, 0, 100);
        applyTextStyle();
      });
    }
  }

  document.getElementById('faqQSize').addEventListener('input', function (e) {
    textStyle.qSize = clamp(e.target.value, 8, 80);
    faqWidget.style.setProperty('--faq-q-size', textStyle.qSize + 'px');
  });

  document.getElementById('faqASize').addEventListener('input', function (e) {
    textStyle.aSize = clamp(e.target.value, 8, 60);
    faqWidget.style.setProperty('--faq-a-size', textStyle.aSize + 'px');
  });

  bindColorControl('faqQColorPicker', 'faqQColorHex', 'faqQColorOpacity', 'qHex', 'qOpacity');
  bindColorControl('faqAColorPicker', 'faqAColorHex', 'faqAColorOpacity', 'aHex', 'aOpacity');

  /* ── Max width ── */
  document.getElementById('faqMaxWidth').addEventListener('input', function (e) {
    maxWidth = clamp(e.target.value, 320, 1400);
    faqWidget.style.maxWidth = maxWidth + 'px';
  });

  /* ── Background color toggle ── */
  function applyBg() {
    faqWidget.style.setProperty('--faq-row-bg', bgEnabled ? bgHex : 'transparent');
  }

  var bgToggleBtn   = document.getElementById('faqBgToggle');
  var bgColorWrap   = document.getElementById('faqBgColorWrap');
  var bgPicker      = document.getElementById('faqBgColorPicker');
  var bgHexEl       = document.getElementById('faqBgColorHex');
  var bgSwatchEl    = document.getElementById('faqBgSwatchWrap');

  bgToggleBtn.addEventListener('click', function () {
    bgEnabled = !bgEnabled;
    bgToggleBtn.classList.toggle('active', bgEnabled);
    bgToggleBtn.setAttribute('aria-pressed', bgEnabled);
    bgColorWrap.style.display = bgEnabled ? '' : 'none';
    if (bgEnabled) bgSwatchEl.style.background = bgHex;
    applyBg();
  });

  bgPicker.addEventListener('input', function () {
    bgHex = bgPicker.value.toUpperCase();
    bgHexEl.value = bgHex;
    bgSwatchEl.style.background = bgHex;
    applyBg();
  });

  bgHexEl.addEventListener('input', function () {
    var v = bgHexEl.value;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      bgHex = v.toUpperCase();
      bgPicker.value = v;
      bgSwatchEl.style.background = bgHex;
      applyBg();
    }
  });

  /* ── Section collapse ── */
  document.getElementById('faqInspector').querySelectorAll('.inspector__sec-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.closest('.inspector__section').classList.toggle('collapsed');
    });
  });

  /* ── Inspector close ── */
  document.getElementById('faqInspectorClose').addEventListener('click', function () {
    document.getElementById('faqInspector').style.display = 'none';
  });

  /* ── Reset ── */

  function resetAll() {
    if (detailEl) detailEl.classList.remove('open');
    currentDetailItem = null;

    nextId = 4;
    items = [
      { id: 1, q: 'Power Absorption', a: 'Korean yarn is split evenly and stably, so it has higher bulkiness and better absorbency.\nYou can expect about 150% functional superiority compared to Chinese products.', open: true },
      { id: 2, q: 'Lint free', a: 'Our fabric is designed to minimize lint and fiber shedding, keeping your environment clean.', open: false },
      { id: 3, q: 'Long lasting', a: 'Built with premium materials that maintain quality and appearance through extended use.', open: false }
    ];
    textStyle = { qSize: 18, qHex: '#1a1a1a', qOpacity: 100, aSize: 14, aHex: '#6b7280', aOpacity: 100 };
    maxWidth   = 760;
    bgEnabled  = false;
    bgHex      = '#F5F5F5';

    /* 인스펙터 inputs 동기화 */
    document.getElementById('faqMaxWidth').value      = 760;
    document.getElementById('faqQSize').value         = 18;
    document.getElementById('faqQColorPicker').value  = '#1a1a1a';
    document.getElementById('faqQColorHex').value     = '#1A1A1A';
    document.getElementById('faqQColorOpacity').value = 100;
    document.getElementById('faqASize').value         = 14;
    document.getElementById('faqAColorPicker').value  = '#6b7280';
    document.getElementById('faqAColorHex').value     = '#6B7280';
    document.getElementById('faqAColorOpacity').value = 100;

    var bgToggle = document.getElementById('faqBgToggle');
    var bgWrap   = document.getElementById('faqBgColorWrap');
    bgToggle.classList.remove('active');
    bgToggle.setAttribute('aria-pressed', 'false');
    bgWrap.style.display = 'none';
    document.getElementById('faqBgColorPicker').value = '#f5f5f5';
    document.getElementById('faqBgColorHex').value    = '#F5F5F5';

    renderWidget();
    renderInspectorItems();
  }

  document.getElementById('faqReset').addEventListener('click', resetAll);

  /* ── Init ── */
  detailEl = createDetailPanel();
  renderWidget();
  renderInspectorItems();

})();
