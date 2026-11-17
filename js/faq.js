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

  /* ── Render inspector item list ── */
  function renderInspectorItems() {
    faqItemList.innerHTML = '';

    items.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'inspector__card-item';
      row.dataset.id = item.id;

      row.innerHTML =
        '<span class="inspector__drag">&#8942;&#8942;</span>' +
        '<div class="inspector__card-fields">' +
          '<input class="inspector__card-name-input" type="text"' +
            ' value="' + escAttr(item.q) + '" placeholder="질문">' +
          '<textarea class="inspector__card-role-input faq-answer-input"' +
            ' placeholder="답변" rows="3">' + esc(item.a) + '</textarea>' +
        '</div>' +
        '<button class="inspector__card-delete" type="button" aria-label="삭제">' +
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

      /* Question input */
      row.querySelector('.inspector__card-name-input').addEventListener('input', function (e) {
        item.q = e.target.value;
        var el = faqWidget.querySelector('[data-id="' + item.id + '"] .faq-item__question');
        if (el) el.textContent = item.q;
      });

      /* Answer textarea */
      row.querySelector('.faq-answer-input').addEventListener('input', function (e) {
        item.a = e.target.value;
        var el = faqWidget.querySelector('[data-id="' + item.id + '"] .faq-item__answer');
        if (el) el.textContent = item.a;
      });

      /* Delete */
      row.querySelector('.inspector__card-delete').addEventListener('click', function () {
        if (items.length <= 1) return;
        items = items.filter(function (it) { return it.id !== item.id; });
        renderWidget();
        renderInspectorItems();
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
    faqItemList.querySelectorAll('.inspector__card-item').forEach(function (r) {
      r.classList.remove('drag-over-top', 'drag-over-bottom');
    });
  }

  /* ── Add item ── */
  document.getElementById('addFaqItem').addEventListener('click', function () {
    var id = nextId++;
    items.push({ id: id, q: '새 질문', a: '답변을 입력하세요.', open: false });
    renderWidget();
    renderInspectorItems();
    var newRow = faqItemList.lastElementChild;
    if (newRow) newRow.querySelector('.inspector__card-name-input').focus();
  });

  /* ── Text style controls ── */
  function bindColorControl(pickerId, hexId, opacityId, stateHexKey, stateOpacityKey, swatchId) {
    var picker  = document.getElementById(pickerId);
    var hexEl   = document.getElementById(hexId);
    var opEl    = document.getElementById(opacityId);

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

  bindColorControl('faqQColorPicker', 'faqQColorHex', 'faqQColorOpacity', 'qHex', 'qOpacity', 'faqQSwatchWrap');
  bindColorControl('faqAColorPicker', 'faqAColorHex', 'faqAColorOpacity', 'aHex', 'aOpacity', 'faqASwatchWrap');

  /* ── Max width ── */
  document.getElementById('faqMaxWidth').addEventListener('input', function (e) {
    maxWidth = clamp(e.target.value, 320, 1400);
    faqWidget.style.maxWidth = maxWidth + 'px';
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

  /* ── Widget delete ── */
  document.getElementById('faqDelete').addEventListener('click', function () {
    if (confirm('위젯을 삭제하시겠습니까?')) {
      faqWidget.remove();
      document.getElementById('faqInspector').style.display = 'none';
    }
  });

  /* ── Init ── */
  renderWidget();
  renderInspectorItems();

})();
