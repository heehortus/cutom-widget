/* =====================================
   Value Card Widget — Controller
   ===================================== */

(function () {
  'use strict';

  /* ── State ── */
  var nextId = 4;

  var content = {
    title:        '',
    desc:         '',
    linkVisible:  true,
    linkLabel:    'View More',
    linkUrl:      ''
  };

  var style = {
    titleHex:         '#212529',  /* --clr-900 */
    titleOpacity:     100,
    descHex:          '#6B7280',  /* --clr-body */
    descOpacity:      100,
    cardTitleHex:     '#FFFFFF',  /* --clr-white */
    cardTitleOpacity: 100,
    overlayHex:       '#000000',  /* --clr-black */
    overlayOpacity:   45,
    titleSize:        40,
    descSize:         20,
    cardTitleSize:    26
  };

  var cards = [
    { id: 1, imgUrl: '', title: '' },
    { id: 2, imgUrl: '', title: '' },
    { id: 3, imgUrl: '', title: '' }
  ];

  var dragSrcId         = null;
  var currentDetailCard = null;
  var detailEl          = null;

  /* ── DOM refs ── */
  var wrap        = document.getElementById('valueCardWrap');
  var cardListEl  = document.getElementById('vcCardList');
  var inspectorEl = document.getElementById('valueCardInspector');

  /* ── Helpers ── */
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
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

  /* ── SVG constants ── */
  var PLACEHOLDER_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"' +
    ' stroke-linecap="round" stroke-linejoin="round" width="32" height="32">' +
    '<rect x="3" y="3" width="18" height="18" rx="3"/>' +
    '<circle cx="8.5" cy="8.5" r="1.5"/>' +
    '<polyline points="21,15 16,10 5,21"/></svg>';

  var LINK_ARROW_SVG =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"' +
    ' stroke-linecap="round" stroke-linejoin="round" width="13" height="13">' +
    '<polyline points="4,8 12,8"/><polyline points="8,4 12,8 8,12"/></svg>';

  var UPLOAD_SVG =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"' +
    ' stroke-linecap="round" stroke-linejoin="round" width="14" height="14">' +
    '<polyline points="8,10 8,3"/><polyline points="5,6 8,3 11,6"/>' +
    '<path d="M3 12v.5A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5V12"/>' +
    '</svg>';

  var DELETE_SVG =
    '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"' +
    ' stroke-linecap="round" stroke-linejoin="round" width="13" height="13">' +
    '<polyline points="1,3 13,3"/>' +
    '<path d="M4,3V2.5A.5.5,0,0,1,4.5,2h5A.5.5,0,0,1,10,2.5V3"/>' +
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
    var titleContent = content.title
      ? esc(content.title)
      : '<span class="vc-ph">타이틀</span>';

    var descContent = content.desc
      ? esc(content.desc)
      : '<span class="vc-ph">설명</span>';

    var linkHtml = '';
    if (content.linkVisible) {
      var linkLabel = content.linkLabel
        ? esc(content.linkLabel)
        : '<span class="vc-ph">링크 텍스트</span>';
      linkHtml =
        '<a class="vc-link" href="' + escAttr(content.linkUrl || '#') + '" target="_blank">' +
        linkLabel + ' ' + LINK_ARROW_SVG +
        '</a>';
    }

    var headerHtml =
      '<div class="vc-header">' +
        '<h2 class="vc-title">' + titleContent + '</h2>' +
        '<div class="vc-header__right">' +
          '<p class="vc-desc">' + descContent + '</p>' +
          linkHtml +
        '</div>' +
      '</div>';

    var cardsHtml = cards.map(function (card, i) {
      var imgHtml = card.imgUrl
        ? '<img class="vc-card__img" src="' + escAttr(card.imgUrl) + '" alt="">'
        : '<div class="vc-card__placeholder">' + PLACEHOLDER_SVG + '</div>';
      var cardTitle = card.title
        ? esc(card.title)
        : '<span class="vc-card-ph">카드 제목</span>';
      var delay = ' style="animation-delay:' + (i * 0.1 + 0.15) + 's"';
      return (
        '<div class="vc-card"' +
        ' data-id="' + card.id + '"' + delay + '>' +
          imgHtml +
          '<div class="vc-card__overlay"></div>' +
          '<p class="vc-card__title">' + cardTitle + '</p>' +
        '</div>'
      );
    }).join('');

    wrap.innerHTML = headerHtml + '<div class="vc-grid">' + cardsHtml + '</div>';

    applyStyle();
  }

  /* ── Apply style ── */
  function applyStyle() {
    var titleColor     = hexToRgba(style.titleHex,     style.titleOpacity)     || style.titleHex;
    var descColor      = hexToRgba(style.descHex,      style.descOpacity)      || style.descHex;
    var cardTitleColor = hexToRgba(style.cardTitleHex, style.cardTitleOpacity) || style.cardTitleHex;
    var overlayColor   = hexToRgba(style.overlayHex,   style.overlayOpacity)   || style.overlayHex;

    wrap.style.setProperty('--vc-title-color',      titleColor);
    wrap.style.setProperty('--vc-desc-color',       descColor);
    wrap.style.setProperty('--vc-card-title-color', cardTitleColor);
    wrap.style.setProperty('--vc-overlay-color',    overlayColor);
    wrap.style.setProperty('--vc-title-size',       style.titleSize     + 'px');
    wrap.style.setProperty('--vc-desc-size',        style.descSize      + 'px');
    wrap.style.setProperty('--vc-card-title-size',  style.cardTitleSize + 'px');

    var titleSwatch     = document.getElementById('vcTitleSwatch');
    var descSwatch      = document.getElementById('vcDescSwatch');
    var cardTitleSwatch = document.getElementById('vcCardTitleSwatch');
    var overlaySwatch   = document.getElementById('vcOverlaySwatch');
    if (titleSwatch)     titleSwatch.style.background     = titleColor;
    if (descSwatch)      descSwatch.style.background      = descColor;
    if (cardTitleSwatch) cardTitleSwatch.style.background = cardTitleColor;
    if (overlaySwatch)   overlaySwatch.style.background   = overlayColor;
  }

  /* ── Detail panel ── */
  function createDetailPanel() {
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
      '<div class="inspector__detail-body" id="vcDetailBody"></div>';
    inspectorEl.appendChild(panel);

    panel.querySelector('.inspector__detail-back').addEventListener('click', function () {
      panel.classList.remove('open');
      currentDetailCard = null;
    });
    panel.querySelector('.inspector__detail-close').addEventListener('click', function () {
      panel.classList.remove('open');
      currentDetailCard = null;
      var closeBtn = inspectorEl.querySelector('.inspector__close');
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
    var thumbSrc = card.imgUrl
      ? '<img src="' + escAttr(card.imgUrl) + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">'
      : UPLOAD_SVG;
    imgField.innerHTML =
      '<label class="inspector__field-label">이미지</label>' +
      '<div style="display:flex;flex-direction:column;gap:6px">' +
        '<div class="inspector__img-upload' + (card.imgUrl ? ' inspector__img-upload--filled' : '') + '" id="vcCardImgUpload">' +
          '<div class="inspector__img-thumb' + (card.imgUrl ? ' inspector__img-thumb--filled' : '') + '" id="vcCardImgThumb">' +
            thumbSrc +
          '</div>' +
          '<button class="inspector__img-clear" id="vcCardImgClear" type="button" title="이미지 제거">&#x2715;</button>' +
          '<input type="file" accept="image/*" id="vcCardImgFile" style="display:none">' +
        '</div>' +
        '<input type="text" class="inspector__card-name-input" id="vcCardImgUrl"' +
        ' placeholder="또는 URL 입력"' +
        ' value="' + (card.imgUrl && card.imgUrl.startsWith('data:') ? '' : escAttr(card.imgUrl || '')) + '">' +
      '</div>';

    var uploadWrap = imgField.querySelector('#vcCardImgUpload');
    var thumb      = imgField.querySelector('#vcCardImgThumb');
    var clearBtn   = imgField.querySelector('#vcCardImgClear');
    var fileInput  = imgField.querySelector('#vcCardImgFile');
    var urlInput   = imgField.querySelector('#vcCardImgUrl');

    function setCardImg(src) {
      card.imgUrl = src;
      var cardEl = wrap.querySelector('.vc-card[data-id="' + card.id + '"]');
      if (!cardEl) return;
      var imgEl = cardEl.querySelector('.vc-card__img');
      var phEl  = cardEl.querySelector('.vc-card__placeholder');
      if (src) {
        if (phEl) phEl.remove();
        if (!imgEl) {
          imgEl = document.createElement('img');
          imgEl.className = 'vc-card__img';
          imgEl.alt = '';
          cardEl.insertBefore(imgEl, cardEl.firstChild);
        }
        imgEl.src = src;
      } else {
        if (imgEl) imgEl.remove();
        if (!cardEl.querySelector('.vc-card__placeholder')) {
          var ph = document.createElement('div');
          ph.className = 'vc-card__placeholder';
          ph.innerHTML = PLACEHOLDER_SVG;
          cardEl.insertBefore(ph, cardEl.firstChild);
        }
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

    /* 카드 타이틀 */
    var titleField = document.createElement('div');
    titleField.className = 'inspector__field';
    titleField.innerHTML =
      '<label class="inspector__field-label">카드 타이틀</label>' +
      '<input class="inspector__card-name-input" type="text"' +
      ' value="' + escAttr(card.title) + '" placeholder="카드 제목" style="width:100%">';
    titleField.querySelector('input').addEventListener('input', function (e) {
      card.title = e.target.value;
      var el = wrap.querySelector('.vc-card[data-id="' + card.id + '"] .vc-card__title');
      if (el) el.textContent = card.title;
      var rowEl = cardListEl.querySelector('.inspector__item-row[data-id="' + card.id + '"] .inspector__item-name');
      if (rowEl) rowEl.textContent = card.title || '카드';
    });
    bodyEl.appendChild(titleField);

    /* 삭제 */
    var deleteWrap = document.createElement('div');
    deleteWrap.style.marginTop = '8px';
    deleteWrap.innerHTML =
      '<button class="inspector__delete-btn" type="button">' + DELETE_SVG + '카드 삭제</button>';
    deleteWrap.querySelector('button').addEventListener('click', function () {
      if (cards.length <= 1) return;
      detailEl.classList.remove('open');
      currentDetailCard = null;
      cards = cards.filter(function (c) { return c.id !== card.id; });
      renderWidget();
      renderInspectorItems();
    });
    bodyEl.appendChild(deleteWrap);
  }

  function openDetail(card) {
    currentDetailCard = card;
    var bodyEl = detailEl.querySelector('#vcDetailBody');
    renderDetailBody(bodyEl, card);
    detailEl.classList.add('open');
  }

  /* ── Render inspector items ── */
  function renderInspectorItems() {
    cardListEl.innerHTML = '';
    cards.forEach(function (card) {
      var row = document.createElement('div');
      row.className = 'inspector__item-row';
      row.dataset.id = card.id;
      row.innerHTML =
        '<span class="inspector__drag">' + DRAG_SVG + '</span>' +
        '<span class="inspector__item-name">' + esc(card.title || '카드') + '</span>' +
        '<span class="inspector__item-arrow">' + ARROW_SVG + '</span>';

      row.addEventListener('click', function (e) {
        if (e.target.closest('.inspector__drag')) return;
        openDetail(card);
      });

      setupDragDrop(row, card.id);
      cardListEl.appendChild(row);
    });
  }

  /* ── Drag & drop ── */
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
      var mid = row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2;
      row.classList.add(e.clientY < mid ? 'drag-over-top' : 'drag-over-bottom');
    });
    row.addEventListener('drop', function (e) {
      e.preventDefault();
      if (dragSrcId === null || dragSrcId === id) return;
      var mid    = row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2;
      var before = e.clientY < mid;
      var srcIdx = cards.findIndex(function (c) { return c.id === dragSrcId; });
      var moved  = cards.splice(srcIdx, 1)[0];
      var dstIdx = cards.findIndex(function (c) { return c.id === id; });
      cards.splice(before ? dstIdx : dstIdx + 1, 0, moved);
      renderWidget();
      renderInspectorItems();
    });
  }

  function clearDragIndicators() {
    cardListEl.querySelectorAll('.inspector__item-row').forEach(function (r) {
      r.classList.remove('drag-over-top', 'drag-over-bottom');
    });
  }

  /* ── Add card ── */
  document.getElementById('vcAddCard').addEventListener('click', function () {
    if (cards.length >= 8) return;
    var newCard = { id: nextId++, imgUrl: '', title: '' };
    cards.push(newCard);
    renderWidget();
    renderInspectorItems();
    openDetail(newCard);
  });

  /* ── Content controls ── */
  document.getElementById('vcTitle').addEventListener('input', function (e) {
    content.title = e.target.value;
    var el = wrap.querySelector('.vc-title');
    if (el) el.textContent = content.title;
  });

  document.getElementById('vcDesc').addEventListener('input', function (e) {
    content.desc = e.target.value;
    var el = wrap.querySelector('.vc-desc');
    if (content.desc) {
      if (!el) {
        renderWidget();
      } else {
        el.textContent = content.desc;
      }
    } else {
      if (el) el.remove();
    }
  });

  var linkToggle = document.getElementById('vcLinkToggle');
  var linkFields = document.getElementById('vcLinkFields');

  linkToggle.addEventListener('click', function () {
    content.linkVisible = !content.linkVisible;
    linkToggle.classList.toggle('active', content.linkVisible);
    linkFields.style.display = content.linkVisible ? '' : 'none';
    renderWidget();
  });

  document.getElementById('vcLinkLabel').addEventListener('input', function (e) {
    content.linkLabel = e.target.value;
    if (content.linkVisible) renderWidget();
  });

  document.getElementById('vcLinkUrl').addEventListener('input', function (e) {
    content.linkUrl = e.target.value;
    if (content.linkVisible) {
      var el = wrap.querySelector('.vc-link');
      if (el) el.href = content.linkUrl || '#';
    }
  });

  /* ── Style helpers ── */
  function bindColor(pickerId, hexId, opId, hexKey, opKey) {
    var picker = document.getElementById(pickerId);
    var hexEl  = document.getElementById(hexId);
    var opEl   = opId ? document.getElementById(opId) : null;
    picker.addEventListener('input', function () {
      style[hexKey] = picker.value.toUpperCase();
      hexEl.value = style[hexKey];
      applyStyle();
    });
    hexEl.addEventListener('input', function () {
      var v = hexEl.value;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        style[hexKey] = v.toUpperCase();
        picker.value = v;
        applyStyle();
      }
    });
    if (opEl) opEl.addEventListener('input', function () {
      style[opKey] = clamp(opEl.value, 0, 100);
      applyStyle();
    });
  }

  function bindNum(id, key, min, max, cb) {
    document.getElementById(id).addEventListener('input', function (e) {
      style[key] = clamp(e.target.value, min, max);
      cb ? cb() : applyStyle();
    });
  }

  /* ── Wire text size controls ── */
  bindNum('vcTitleSize',     'titleSize',     12, 80, function () {
    wrap.style.setProperty('--vc-title-size', style.titleSize + 'px');
  });
  bindNum('vcDescSize',      'descSize',      10, 40, function () {
    wrap.style.setProperty('--vc-desc-size', style.descSize + 'px');
  });
  bindNum('vcCardTitleSize', 'cardTitleSize', 12, 60, function () {
    wrap.style.setProperty('--vc-card-title-size', style.cardTitleSize + 'px');
  });

  /* ── Wire color controls ── */
  bindColor('vcTitlePicker',     'vcTitleHex',     'vcTitleOpacity',     'titleHex',     'titleOpacity');
  bindColor('vcDescPicker',      'vcDescHex',      'vcDescOpacity',      'descHex',      'descOpacity');
  bindColor('vcCardTitlePicker', 'vcCardTitleHex', 'vcCardTitleOpacity', 'cardTitleHex', 'cardTitleOpacity');
  bindColor('vcOverlayPicker',   'vcOverlayHex',   'vcOverlayOpacity',   'overlayHex',   'overlayOpacity');

  /* ── Section collapse ── */
  inspectorEl.querySelectorAll('.inspector__sec-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.closest('.inspector__section').classList.toggle('collapsed');
    });
  });

  /* ── Inspector close ── */
  document.getElementById('vcInspectorClose').addEventListener('click', function () {
    inspectorEl.style.display = 'none';
  });

  /* ── Reset ── */
  function resetAll() {
    nextId = 4;
    content.title       = '';
    content.desc        = '';
    content.linkVisible = true;
    content.linkLabel   = 'View More';
    content.linkUrl     = '';

    style.titleHex         = '#212529';
    style.titleOpacity     = 100;
    style.descHex          = '#6B7280';
    style.descOpacity      = 100;
    style.cardTitleHex     = '#FFFFFF';
    style.cardTitleOpacity = 100;
    style.overlayHex       = '#000000';
    style.overlayOpacity   = 45;
    style.titleSize        = 40;
    style.descSize         = 20;
    style.cardTitleSize    = 26;

    cards = [
      { id: 1, imgUrl: '', title: '' },
      { id: 2, imgUrl: '', title: '' },
      { id: 3, imgUrl: '', title: '' }
    ];

    /* sync form inputs */
    document.getElementById('vcTitle').value     = '';
    document.getElementById('vcDesc').value      = '';
    document.getElementById('vcLinkLabel').value = 'View More';
    document.getElementById('vcLinkUrl').value   = '';

    var linkToggleEl = document.getElementById('vcLinkToggle');
    linkToggleEl.classList.add('active');
    document.getElementById('vcLinkFields').style.display = '';

    document.getElementById('vcTitleSize').value     = 40;
    document.getElementById('vcDescSize').value      = 20;
    document.getElementById('vcCardTitleSize').value = 26;

    document.getElementById('vcTitlePicker').value     = '#212529';
    document.getElementById('vcTitleHex').value        = '#212529';
    document.getElementById('vcTitleOpacity').value    = 100;

    document.getElementById('vcDescPicker').value      = '#6b7280';
    document.getElementById('vcDescHex').value         = '#6B7280';
    document.getElementById('vcDescOpacity').value     = 100;

    document.getElementById('vcCardTitlePicker').value     = '#ffffff';
    document.getElementById('vcCardTitleHex').value        = '#FFFFFF';
    document.getElementById('vcCardTitleOpacity').value    = 100;

    document.getElementById('vcOverlayPicker').value      = '#000000';
    document.getElementById('vcOverlayHex').value         = '#000000';
    document.getElementById('vcOverlayOpacity').value     = 45;

    if (detailEl) detailEl.classList.remove('open');
    currentDetailCard = null;

    renderWidget();
    renderInspectorItems();
  }

  document.getElementById('vcReset').addEventListener('click', resetAll);

  /* ── Replay animation ── */
  document.getElementById('vcReplay').addEventListener('click', function () {
    renderWidget();
  });

  /* ── Init ── */
  detailEl = createDetailPanel();
  renderWidget();
  renderInspectorItems();

})();
