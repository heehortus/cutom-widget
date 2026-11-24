/* =====================================
   Logo Marquee Widget — Controller
   ===================================== */

(function () {
  'use strict';

  /* ── State ── */
  var nextId = 7;

  var content = {
    title:        '파트너사를 소개합니다',
    titleSize:    42,
    titleHex:     '#212529',
    titleOpacity: 100,
    desc:         '우리와 함께하는 비즈니스 파트너',
    descSize:     18,
    descHex:      '#6B7280',
    descOpacity:  100,
    align:        'center'
  };

  var settings = {
    speed:      20,
    logoW:      120,
    logoH:      48,
    gap:        60,
    direction:  'left',
    pauseHover: true,
    bgHex:      '#FFFFFF',
    bgOpacity:  100
  };

  var logos = [
    { id: 1, imgUrl: '', alt: 'Logo 1' },
    { id: 2, imgUrl: '', alt: 'Logo 2' },
    { id: 3, imgUrl: '', alt: 'Logo 3' },
    { id: 4, imgUrl: '', alt: 'Logo 4' },
    { id: 5, imgUrl: '', alt: 'Logo 5' },
    { id: 6, imgUrl: '', alt: 'Logo 6' }
  ];

  /* ── Default snapshots (for reset) ── */
  var DEFAULT_CONTENT  = JSON.parse(JSON.stringify(content));
  var DEFAULT_SETTINGS = JSON.parse(JSON.stringify(settings));
  var DEFAULT_LOGOS    = JSON.parse(JSON.stringify(logos));

  var dragSrcId          = null;
  var currentDetailLogo  = null;
  var detailEl           = null;

  /* ── DOM refs ── */
  var wrapEl      = document.getElementById('logoMarqueeWrap');
  var inspectorEl = document.getElementById('logoMarqueeInspector');

  /* ── SVG constants ── */
  var DRAG_SVG =
    '<svg viewBox="0 0 8 14" fill="currentColor" width="8" height="14">' +
    '<circle cx="2" cy="2" r="1.2"/><circle cx="6" cy="2" r="1.2"/>' +
    '<circle cx="2" cy="7" r="1.2"/><circle cx="6" cy="7" r="1.2"/>' +
    '<circle cx="2" cy="12" r="1.2"/><circle cx="6" cy="12" r="1.2"/></svg>';

  var UPLOAD_SVG =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"' +
    ' stroke-linecap="round" stroke-linejoin="round" width="12" height="12">' +
    '<polyline points="8,10 8,3"/><polyline points="5,6 8,3 11,6"/>' +
    '<path d="M3 12v.5A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5V12"/>' +
    '</svg>';

  var DELETE_SVG =
    '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"' +
    ' stroke-linecap="round" stroke-linejoin="round" width="12" height="12">' +
    '<polyline points="1,3 13,3"/><path d="M4,3V2.5A.5.5,0,0,1,4.5,2h5A.5.5,0,0,1,10,2.5V3"/>' +
    '<rect x="2" y="3" width="10" height="9" rx="1"/>' +
    '<line x1="5" y1="6" x2="5" y2="10"/><line x1="9" y1="6" x2="9" y2="10"/></svg>';

  var ARROW_SVG =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"' +
    ' stroke-linecap="round" stroke-linejoin="round" width="12" height="12">' +
    '<polyline points="6,3 10,8 6,13"/></svg>';

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
    return Math.min(max, Math.max(min, parseInt(val) || min));
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
    var titleColor = hexToRgba(content.titleHex, content.titleOpacity) || content.titleHex;
    var descColor  = hexToRgba(content.descHex,  content.descOpacity)  || content.descHex;
    var bgColor    = hexToRgba(settings.bgHex,   settings.bgOpacity)   || settings.bgHex;

    var pauseHoverVal = settings.pauseHover ? 'on' : 'off';

    /* Header */
    var titleHtml = '';
    if (content.title) {
      titleHtml = '<h2 class="lm-title">' + esc(content.title) + '</h2>';
    } else {
      titleHtml = '<h2 class="lm-title lm-ph" style="opacity:0.35">파트너사를 소개합니다</h2>';
    }

    var descHtml = '';
    if (content.desc) {
      descHtml = '<p class="lm-desc">' + esc(content.desc) + '</p>';
    } else {
      descHtml = '<p class="lm-desc lm-ph" style="opacity:0.35">우리와 함께하는 비즈니스 파트너</p>';
    }

    /* Logos (original + clone for seamless loop) */
    var logoItems = logos.map(function (logo) {
      var inner = logo.imgUrl
        ? '<img src="' + escAttr(logo.imgUrl) + '" alt="' + escAttr(logo.alt) + '">'
        : '<span>LOGO</span>';
      var phClass = logo.imgUrl ? '' : ' lm-item--ph';
      return '<div class="lm-item' + phClass + '">' + inner + '</div>';
    }).join('');

    var cloneItems = logos.map(function (logo) {
      var inner = logo.imgUrl
        ? '<img src="' + escAttr(logo.imgUrl) + '" alt="' + escAttr(logo.alt) + '">'
        : '<span>LOGO</span>';
      var phClass = logo.imgUrl ? '' : ' lm-item--ph';
      return '<div class="lm-item' + phClass + '" aria-hidden="true">' + inner + '</div>';
    }).join('');

    return (
      '<div class="lm-root"' +
        ' id="lm-root"' +
        ' data-direction="' + escAttr(settings.direction) + '"' +
        ' data-align="'     + escAttr(content.align)      + '"' +
        ' data-pause-hover="' + escAttr(pauseHoverVal)    + '">' +
        '<div class="lm-header">' +
          titleHtml +
          descHtml +
        '</div>' +
        '<div class="lm-marquee">' +
          '<div class="lm-track">' +
            logoItems +
            cloneItems +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  /* ── Apply CSS variables ── */
  function applyVars(rootEl) {
    if (!rootEl) return;

    var titleColor = hexToRgba(content.titleHex, content.titleOpacity) || content.titleHex;
    var descColor  = hexToRgba(content.descHex,  content.descOpacity)  || content.descHex;
    var bgColor    = hexToRgba(settings.bgHex,   settings.bgOpacity)   || settings.bgHex;

    rootEl.style.setProperty('--lm-title-size',  content.titleSize  + 'px');
    rootEl.style.setProperty('--lm-desc-size',   content.descSize   + 'px');
    rootEl.style.setProperty('--lm-title-color', titleColor);
    rootEl.style.setProperty('--lm-desc-color',  descColor);
    rootEl.style.setProperty('--lm-bg',          bgColor);
    rootEl.style.setProperty('--lm-logo-w',      settings.logoW     + 'px');
    rootEl.style.setProperty('--lm-logo-h',      settings.logoH     + 'px');
    rootEl.style.setProperty('--lm-gap',         settings.gap       + 'px');
    rootEl.style.setProperty('--lm-speed',       settings.speed     + 's');

    /* Sync swatches */
    var titleSwatch = document.getElementById('lmTitleSwatch');
    var descSwatch  = document.getElementById('lmDescSwatch');
    var bgSwatch    = document.getElementById('lmBgSwatch');
    if (titleSwatch) titleSwatch.style.background = titleColor;
    if (descSwatch)  descSwatch.style.background  = descColor;
    if (bgSwatch)    bgSwatch.style.background    = bgColor;
  }

  /* ── Render widget ── */
  function renderWidget() {
    wrapEl.innerHTML = buildWidgetHTML();
    var rootEl = document.getElementById('lm-root');
    applyVars(rootEl);

    /* Restart animation cleanly */
    var track = rootEl ? rootEl.querySelector('.lm-track') : null;
    if (track) {
      track.style.animation = 'none';
      track.getBoundingClientRect(); /* force reflow */
      track.style.animation = '';
    }
  }

  /* ── Apply vars only (no full re-render) ── */
  function applyVarsOnly() {
    var rootEl = document.getElementById('lm-root');
    applyVars(rootEl);
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
          '로고' +
        '</button>' +
        '<button class="inspector__detail-close" type="button">&#x2715;</button>' +
      '</div>' +
      '<div class="inspector__detail-body" id="lmDetailBody"></div>';
    inspectorEl.appendChild(panel);

    panel.querySelector('.inspector__detail-back').addEventListener('click', function () {
      panel.classList.remove('open');
      currentDetailLogo = null;
    });
    panel.querySelector('.inspector__detail-close').addEventListener('click', function () {
      panel.classList.remove('open');
      currentDetailLogo = null;
      var closeBtn = inspectorEl.querySelector('.inspector__close');
      if (closeBtn) closeBtn.click();
    });

    return panel;
  }

  /* ── Render detail body ── */
  function renderDetailBody(bodyEl, logo) {
    bodyEl.innerHTML = '';

    /* 이미지 */
    var imgField = document.createElement('div');
    imgField.className = 'inspector__field';
    var thumbSrc = logo.imgUrl
      ? '<img src="' + escAttr(logo.imgUrl) + '" alt="" style="width:100%;height:100%;object-fit:contain;display:block;">'
      : UPLOAD_SVG;
    imgField.innerHTML =
      '<label class="inspector__field-label">이미지</label>' +
      '<div style="display:flex;flex-direction:column;gap:6px">' +
        '<div class="inspector__img-upload' + (logo.imgUrl ? ' inspector__img-upload--filled' : '') + '" id="lmImgUpload">' +
          '<div class="inspector__img-thumb' + (logo.imgUrl ? ' inspector__img-thumb--filled' : '') + '" id="lmImgThumb">' +
            thumbSrc +
          '</div>' +
          '<button class="inspector__img-clear" id="lmImgClear" type="button" title="이미지 제거">&#x2715;</button>' +
          '<input type="file" accept="image/*" id="lmImgFile" style="display:none">' +
        '</div>' +
        '<input type="text" class="inspector__card-name-input" id="lmImgUrl"' +
        ' placeholder="또는 URL 입력"' +
        ' value="' + (logo.imgUrl && logo.imgUrl.startsWith('data:') ? '' : escAttr(logo.imgUrl || '')) + '">' +
      '</div>';

    var uploadWrap = imgField.querySelector('#lmImgUpload');
    var thumb      = imgField.querySelector('#lmImgThumb');
    var clearBtn   = imgField.querySelector('#lmImgClear');
    var fileInput  = imgField.querySelector('#lmImgFile');
    var urlInput   = imgField.querySelector('#lmImgUrl');

    function setLogoImg(src) {
      logo.imgUrl = src;
      renderWidget();
      /* update list row preview */
      var rowEl = document.querySelector('#lmLogoList .inspector__item-row[data-id="' + logo.id + '"]');
      if (rowEl) {
        var nameEl = rowEl.querySelector('.inspector__item-name');
        if (nameEl) nameEl.textContent = logo.alt || 'Logo';
      }
    }

    thumb.addEventListener('click', function () { fileInput.click(); });

    fileInput.addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        setLogoImg(ev.target.result);
        urlInput.value = '';
        thumb.innerHTML = '<img src="' + ev.target.result.replace(/"/g, '&quot;') + '" alt="" style="width:100%;height:100%;object-fit:contain;display:block;">';
        thumb.classList.add('inspector__img-thumb--filled');
        uploadWrap.classList.add('inspector__img-upload--filled');
        fileInput.value = '';
      };
      reader.readAsDataURL(file);
    });

    clearBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      setLogoImg('');
      urlInput.value = '';
      thumb.innerHTML = UPLOAD_SVG;
      thumb.classList.remove('inspector__img-thumb--filled');
      uploadWrap.classList.remove('inspector__img-upload--filled');
      fileInput.value = '';
    });

    urlInput.addEventListener('input', function (e) {
      var src = e.target.value.trim();
      setLogoImg(src);
      if (src) {
        thumb.innerHTML = '<img src="' + src.replace(/"/g, '&quot;') + '" alt="" style="width:100%;height:100%;object-fit:contain;display:block;">';
        thumb.classList.add('inspector__img-thumb--filled');
        uploadWrap.classList.add('inspector__img-upload--filled');
      } else {
        thumb.innerHTML = UPLOAD_SVG;
        thumb.classList.remove('inspector__img-thumb--filled');
        uploadWrap.classList.remove('inspector__img-upload--filled');
      }
    });

    bodyEl.appendChild(imgField);

    /* Alt 텍스트 */
    var altField = document.createElement('div');
    altField.className = 'inspector__field';
    altField.innerHTML =
      '<label class="inspector__field-label">Alt 텍스트</label>' +
      '<input class="inspector__card-name-input" type="text"' +
      ' value="' + escAttr(logo.alt) + '" placeholder="로고 설명" style="width:100%">';
    altField.querySelector('input').addEventListener('input', function (e) {
      logo.alt = e.target.value;
      var rowEl = document.querySelector('#lmLogoList .inspector__item-row[data-id="' + logo.id + '"]');
      if (rowEl) {
        var nameEl = rowEl.querySelector('.inspector__item-name');
        if (nameEl) nameEl.textContent = logo.alt || 'Logo';
      }
    });
    bodyEl.appendChild(altField);

    /* 삭제 */
    var deleteWrap = document.createElement('div');
    deleteWrap.style.marginTop = '8px';
    deleteWrap.innerHTML =
      '<button class="inspector__delete-btn" type="button">' + DELETE_SVG + '로고 삭제</button>';
    deleteWrap.querySelector('button').addEventListener('click', function () {
      if (logos.length <= 1) return;
      detailEl.classList.remove('open');
      currentDetailLogo = null;
      logos = logos.filter(function (l) { return l.id !== logo.id; });
      renderWidget();
      renderInspectorItems();
    });
    bodyEl.appendChild(deleteWrap);
  }

  function openDetail(logo) {
    currentDetailLogo = logo;
    var bodyEl = detailEl.querySelector('#lmDetailBody');
    renderDetailBody(bodyEl, logo);
    detailEl.classList.add('open');
  }

  /* ── Render inspector logo list ── */
  function renderInspectorItems() {
    var listEl = document.getElementById('lmLogoList');
    if (!listEl) return;
    listEl.innerHTML = '';

    logos.forEach(function (logo) {
      var row = document.createElement('div');
      row.className = 'inspector__item-row';
      row.dataset.id = logo.id;
      row.innerHTML =
        '<span class="inspector__drag">' + DRAG_SVG + '</span>' +
        '<span class="inspector__item-name">' + esc(logo.alt || 'Logo') + '</span>' +
        '<span class="inspector__item-arrow">' + ARROW_SVG + '</span>';

      row.addEventListener('click', function (e) {
        if (e.target.closest('.inspector__drag')) return;
        openDetail(logo);
      });

      setupDragDrop(row, logo.id);
      listEl.appendChild(row);
    });
  }

  /* ── Drag & drop ── */
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
      var srcIdx = logos.findIndex(function (l) { return l.id === dragSrcId; });
      var moved  = logos.splice(srcIdx, 1)[0];
      var dstIdx = logos.findIndex(function (l) { return l.id === id; });
      logos.splice(before ? dstIdx : dstIdx + 1, 0, moved);
      renderWidget();
      renderInspectorItems();
    });
  }

  function clearDragIndicators() {
    var listEl = document.getElementById('lmLogoList');
    if (!listEl) return;
    listEl.querySelectorAll('.lm-logo-row').forEach(function (r) {
      r.classList.remove('drag-over-top', 'drag-over-bottom');
    });
  }

  /* ── bindColor helper ── */
  function bindColor(pickerId, hexId, opacityId, swatchId, key, namespace, cb) {
    var picker = document.getElementById(pickerId);
    var hexEl  = document.getElementById(hexId);
    var opEl   = opacityId ? document.getElementById(opacityId) : null;
    if (!picker || !hexEl) return;

    picker.addEventListener('input', function () {
      var val = picker.value.toUpperCase();
      if (namespace === 'content') content[key] = val;
      else settings[key] = val;
      hexEl.value = val;
      cb ? cb() : applyVarsOnly();
    });

    hexEl.addEventListener('input', function () {
      var v = hexEl.value;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        var val = v.toUpperCase();
        if (namespace === 'content') content[key] = val;
        else settings[key] = val;
        picker.value = v;
        cb ? cb() : applyVarsOnly();
      }
    });

    if (opEl) {
      var opKey = key.replace('Hex', 'Opacity');
      opEl.addEventListener('input', function () {
        var val = clamp(opEl.value, 0, 100);
        if (namespace === 'content') content[opKey] = val;
        else settings[opKey] = val;
        cb ? cb() : applyVarsOnly();
      });
    }
  }

  /* ── bindNum helper ── */
  /* namespace: 'content' | 'settings' — resolved at call time so reassignment in resetAll works */
  function bindNum(inputId, namespace, key, min, max, cb) {
    var el = document.getElementById(inputId);
    if (!el) return;
    el.addEventListener('input', function (e) {
      var val = clamp(e.target.value, min, max);
      if (namespace === 'content') content[key] = val;
      else settings[key] = val;
      cb ? cb() : applyVarsOnly();
    });
  }

  /* ── Reset all ── */
  function resetAll() {
    content  = JSON.parse(JSON.stringify(DEFAULT_CONTENT));
    settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    logos    = JSON.parse(JSON.stringify(DEFAULT_LOGOS));
    nextId   = 7;

    /* Sync all form inputs */
    var titleTextEl = document.getElementById('lmTitleText');
    var descTextEl  = document.getElementById('lmDescText');
    if (titleTextEl) titleTextEl.value = content.title;
    if (descTextEl)  descTextEl.value  = content.desc;

    var titleSizeEl = document.getElementById('lmTitleSize');
    var descSizeEl  = document.getElementById('lmDescSize');
    if (titleSizeEl) titleSizeEl.value = content.titleSize;
    if (descSizeEl)  descSizeEl.value  = content.descSize;

    var titlePickerEl = document.getElementById('lmTitlePicker');
    var titleHexEl    = document.getElementById('lmTitleHex');
    var titleOpEl     = document.getElementById('lmTitleOpacity');
    if (titlePickerEl) titlePickerEl.value = content.titleHex;
    if (titleHexEl)    titleHexEl.value    = content.titleHex;
    if (titleOpEl)     titleOpEl.value     = content.titleOpacity;

    var descPickerEl = document.getElementById('lmDescPicker');
    var descHexEl    = document.getElementById('lmDescHex');
    var descOpEl     = document.getElementById('lmDescOpacity');
    if (descPickerEl) descPickerEl.value = content.descHex;
    if (descHexEl)    descHexEl.value    = content.descHex;
    if (descOpEl)     descOpEl.value     = content.descOpacity;

    var speedEl = document.getElementById('lmSpeed');
    var logoWEl = document.getElementById('lmLogoW');
    var logoHEl = document.getElementById('lmLogoH');
    var gapEl   = document.getElementById('lmGap');
    if (speedEl) speedEl.value = settings.speed;
    if (logoWEl) logoWEl.value = settings.logoW;
    if (logoHEl) logoHEl.value = settings.logoH;
    if (gapEl)   gapEl.value  = settings.gap;

    var bgPickerEl = document.getElementById('lmBgPicker');
    var bgHexEl    = document.getElementById('lmBgHex');
    var bgOpEl     = document.getElementById('lmBgOpacity');
    if (bgPickerEl) bgPickerEl.value = settings.bgHex;
    if (bgHexEl)    bgHexEl.value    = settings.bgHex;
    if (bgOpEl)     bgOpEl.value     = settings.bgOpacity;

    /* Sync segments */
    document.querySelectorAll('#lmAlignSegment .inspector__layout-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.value === content.align);
    });
    document.querySelectorAll('#lmDirSegment .inspector__layout-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.value === settings.direction);
    });

    /* Sync pause hover toggle */
    var pauseBtn = document.getElementById('lmPauseHover');
    if (pauseBtn) {
      pauseBtn.classList.toggle('active', settings.pauseHover);
      pauseBtn.setAttribute('aria-pressed', settings.pauseHover);
    }

    if (detailEl) detailEl.classList.remove('open');
    currentDetailLogo = null;

    renderWidget();
    renderInspectorItems();
  }

  /* ── Init ── */
  detailEl = createDetailPanel();
  renderWidget();
  renderInspectorItems();

  /* Sync initial form values */
  var titleTextEl = document.getElementById('lmTitleText');
  var descTextEl  = document.getElementById('lmDescText');
  if (titleTextEl) titleTextEl.value = content.title;
  if (descTextEl)  descTextEl.value  = content.desc;

  /* ── Wire: title/desc text inputs ── */
  titleTextEl && titleTextEl.addEventListener('input', function (e) {
    content.title = e.target.value;
    renderWidget();
  });

  descTextEl && descTextEl.addEventListener('input', function (e) {
    content.desc = e.target.value;
    renderWidget();
  });

  /* ── Wire: title size ── */
  bindNum('lmTitleSize', 'content', 'titleSize', 12, 120, function () {
    var rootEl = document.getElementById('lm-root');
    if (rootEl) rootEl.style.setProperty('--lm-title-size', content.titleSize + 'px');
  });

  /* ── Wire: desc size ── */
  bindNum('lmDescSize', 'content', 'descSize', 8, 60, function () {
    var rootEl = document.getElementById('lm-root');
    if (rootEl) rootEl.style.setProperty('--lm-desc-size', content.descSize + 'px');
  });

  /* ── Wire: logo dimensions & gap & speed → re-render ── */
  bindNum('lmLogoW',  'settings', 'logoW',  40,  400, renderWidget);
  bindNum('lmLogoH',  'settings', 'logoH',  16,  200, renderWidget);
  bindNum('lmGap',    'settings', 'gap',    0,   240, renderWidget);
  bindNum('lmSpeed',  'settings', 'speed',  2,   120, renderWidget);

  /* ── Wire: color pickers ── */
  bindColor('lmTitlePicker', 'lmTitleHex', 'lmTitleOpacity', 'lmTitleSwatch', 'titleHex', 'content', applyVarsOnly);
  bindColor('lmDescPicker',  'lmDescHex',  'lmDescOpacity',  'lmDescSwatch',  'descHex',  'content', applyVarsOnly);
  bindColor('lmBgPicker',    'lmBgHex',    'lmBgOpacity',    'lmBgSwatch',    'bgHex',    'settings', applyVarsOnly);

  /* ── Wire: align segment ── */
  document.querySelectorAll('#lmAlignSegment .inspector__layout-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      content.align = btn.dataset.value;
      document.querySelectorAll('#lmAlignSegment .inspector__layout-btn').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });
      var rootEl = document.getElementById('lm-root');
      if (rootEl) rootEl.setAttribute('data-align', content.align);
    });
  });

  /* ── Wire: direction segment ── */
  document.querySelectorAll('#lmDirSegment .inspector__layout-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      settings.direction = btn.dataset.value;
      document.querySelectorAll('#lmDirSegment .inspector__layout-btn').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });
      renderWidget();
    });
  });

  /* ── Wire: pause hover toggle ── */
  var pauseBtn = document.getElementById('lmPauseHover');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', function () {
      settings.pauseHover = !settings.pauseHover;
      pauseBtn.classList.toggle('active', settings.pauseHover);
      pauseBtn.setAttribute('aria-pressed', settings.pauseHover);
      var rootEl = document.getElementById('lm-root');
      if (rootEl) rootEl.setAttribute('data-pause-hover', settings.pauseHover ? 'on' : 'off');
    });
  }

  /* Sync initial toggle states */
  var pauseHoverBtn = document.getElementById('lmPauseHover');
  if (pauseHoverBtn) {
    pauseHoverBtn.classList.toggle('active', settings.pauseHover);
    pauseHoverBtn.setAttribute('aria-pressed', settings.pauseHover);
  }

  /* ── Wire: add logo ── */
  var addLogoBtn = document.getElementById('lmAddLogo');
  if (addLogoBtn) {
    addLogoBtn.addEventListener('click', function () {
      var id = nextId++;
      logos.push({ id: id, imgUrl: '', alt: 'Logo ' + id });
      renderWidget();
      renderInspectorItems();
    });
  }

  /* ── Wire: section collapse ── */
  document.getElementById('logoMarqueeInspector').querySelectorAll('.inspector__sec-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.closest('.inspector__section').classList.toggle('collapsed');
    });
  });

  /* ── Wire: inspector close ── */
  var closeBtn = document.getElementById('lmInspectorClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      document.getElementById('logoMarqueeInspector').style.display = 'none';
    });
  }

  /* ── Wire: reset ── */
  var resetBtn = document.getElementById('lmReset');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      resetAll();
    });
  }

  /* ── Wire: replay ── */
  var replayBtn = document.getElementById('lmReplay');
  if (replayBtn) {
    replayBtn.addEventListener('click', function () {
      var rootEl = document.getElementById('lm-root');
      var track  = rootEl ? rootEl.querySelector('.lm-track') : null;
      if (!track) return;
      track.style.animation = 'none';
      track.getBoundingClientRect();
      track.style.animation = '';
    });
  }

})();
