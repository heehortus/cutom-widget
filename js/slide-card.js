/* =====================================
   Slide Card Widget — Controller
   ===================================== */

(function () {
  'use strict';

  /* ── State ── */
  var nextId = 5;

  var slides = [
    { id: 1, imgUrl: '', title: 'Title', subtitle: 'Description', overlayHex: '#000000', overlayOpacity: 0, linkUrl: '', newTab: false, dateStart: '', timeStart: '', dateEnd: '', timeEnd: '' },
    { id: 2, imgUrl: '', title: 'Title', subtitle: 'Description', overlayHex: '#000000', overlayOpacity: 0, linkUrl: '', newTab: false, dateStart: '', timeStart: '', dateEnd: '', timeEnd: '' },
    { id: 3, imgUrl: '', title: 'Title', subtitle: 'Description', overlayHex: '#000000', overlayOpacity: 0, linkUrl: '', newTab: false, dateStart: '', timeStart: '', dateEnd: '', timeEnd: '' },
    { id: 4, imgUrl: '', title: 'Title', subtitle: 'Description', overlayHex: '#000000', overlayOpacity: 0, linkUrl: '', newTab: false, dateStart: '', timeStart: '', dateEnd: '', timeEnd: '' }
  ];

  var settings = {
    titleSize:       24,
    titleHex:        '#FFFFFF',
    titleOpacity:    100,
    subtitleSize:    16,
    subtitleHex:     '#FFFFFF',
    subtitleOpacity: 100,
    position:        'bot-left',
    titleGap:        6,
    cardRatio:       1.34,
    cardWidth:       342,
    cardGap:         30,
    paddingV:        32,
    paddingH:        38,
    borderRadius:    12,
    arrowStyle:      'chevron',
    arrowHex:        '#4B515B',
    arrowOpacity:    100,
    arrowBgHex:      '#FFFFFF',
    arrowBgOpacity:  100,
    centerScale:     true,
    hoverScale:      true,
    autoplay:        true,
    autoplaySpeed:   3000,
    animStyle:       'none',
    animDuration:    0.7,
    animDelay:       0
  };

  /* Must match --center-scale in slide-card.css */
  var CENTER_SCALE_VALUE = 1.15;

  var dragSrcId          = null;
  var currentDetailSlide = null;
  var detailEl           = null;
  var carouselCleanup    = null;

  /* ── DOM refs ── */
  var wrap        = document.getElementById('slideCardWrap');
  var slideListEl = document.getElementById('scSlideList');
  var inspectorEl = document.getElementById('slideCardInspector');

  /* ── Helpers ── */
  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escAttr(str) {
    return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function clamp(val, min, max) {
    return Math.min(max, Math.max(min, parseFloat(val) || min));
  }

  function hexToRgba(hex, opacity) {
    var h = (hex || '').replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return 'rgba(' +
      parseInt(h.slice(0, 2), 16) + ',' +
      parseInt(h.slice(2, 4), 16) + ',' +
      parseInt(h.slice(4, 6), 16) + ',' +
      (opacity / 100) + ')';
  }

  /* ── SVG constants ── */
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
    '<line x1="5" y1="6" x2="5" y2="10"/><line x1="9" y1="6" x2="9" y2="10"/>' +
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

  var CHEVRON_PREV_SVG =
    '<svg class="iw-arrow-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2"' +
    ' stroke-linecap="round" stroke-linejoin="round" width="16" height="16">' +
    '<polyline points="10,3 5,8 10,13"/></svg>';

  var CHEVRON_NEXT_SVG =
    '<svg class="iw-arrow-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2"' +
    ' stroke-linecap="round" stroke-linejoin="round" width="16" height="16">' +
    '<polyline points="6,3 11,8 6,13"/></svg>';

  var LINE_PREV_SVG =
    '<svg class="iw-arrow-line" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"' +
    ' stroke-linecap="round" stroke-linejoin="round" width="16" height="16">' +
    '<line x1="12" y1="8" x2="4" y2="8"/><polyline points="7,5 4,8 7,11"/></svg>';

  var LINE_NEXT_SVG =
    '<svg class="iw-arrow-line" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"' +
    ' stroke-linecap="round" stroke-linejoin="round" width="16" height="16">' +
    '<line x1="4" y1="8" x2="12" y2="8"/><polyline points="9,5 12,8 9,11"/></svg>';

  /* ── Build widget HTML ── */
  function buildWidgetHTML() {
    var cardsHtml = slides.map(function (slide, i) {
      var titleText = slide.title
        ? esc(slide.title)
        : '<span class="sc-ph">Title</span>';
      var subtitleText = slide.subtitle
        ? esc(slide.subtitle)
        : '<span class="sc-ph">Description</span>';

      var r = parseInt((slide.overlayHex || '#000000').replace('#', '').slice(0, 2), 16);
      var g = parseInt((slide.overlayHex || '#000000').replace('#', '').slice(2, 4), 16);
      var b = parseInt((slide.overlayHex || '#000000').replace('#', '').slice(4, 6), 16);
      var a = (slide.overlayOpacity || 0) / 100;
      var overlayColor = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
      var overlayTransparent = 'rgba(' + r + ',' + g + ',' + b + ',0)';
      var overlayStyle = 'background-image:linear-gradient(to top,' + overlayColor + ' 0%,' + overlayTransparent + ' 60%)';

      var bgHtml = slide.imgUrl
        ? '<img src="' + escAttr(slide.imgUrl) + '" alt="">'
        : '';

      var innerHtml =
        '<div class="iw-card-bg">' + bgHtml + '</div>' +
        '<div class="iw-card-overlay" style="' + overlayStyle + '"></div>' +
        '<div class="iw-card-content">' +
          '<div class="iw-card-title">' + titleText + '</div>' +
          '<div class="iw-card-subtitle">' + subtitleText + '</div>' +
        '</div>';

      var cardInner = slide.linkUrl
        ? '<a class="iw-card-link" href="' + escAttr(slide.linkUrl) + '"' +
          (slide.newTab ? ' target="_blank" rel="noopener"' : '') + '>' + innerHtml + '</a>'
        : innerHtml;

      return (
        '<article class="iw-card" data-index="' + i + '" data-id="' + slide.id + '">' +
        cardInner +
        '</article>'
      );
    }).join('');

    var centerScaleAttr = settings.centerScale ? 'on' : 'off';
    var hoverScaleAttr  = settings.hoverScale  ? 'on' : 'off';

    return (
      '<section id="iw-root" class="iw-root"' +
      ' data-anim="' + escAttr(settings.animStyle) + '"' +
      ' data-position="' + escAttr(settings.position) + '"' +
      ' data-arrow="' + escAttr(settings.arrowStyle) + '"' +
      ' data-center-scale="' + centerScaleAttr + '"' +
      ' data-hover-scale="' + hoverScaleAttr + '"' +
      '>' +
        '<div class="iw-viewport">' +
          '<div class="iw-track">' + cardsHtml + '</div>' +
        '</div>' +
        '<button class="iw-btn" id="iw-prev" aria-label="이전">' +
          CHEVRON_PREV_SVG + LINE_PREV_SVG +
        '</button>' +
        '<button class="iw-btn" id="iw-next" aria-label="다음">' +
          CHEVRON_NEXT_SVG + LINE_NEXT_SVG +
        '</button>' +
      '</section>'
    );
  }

  /* ── Apply CSS vars ── */
  function applyVars(rootEl) {
    rootEl.style.setProperty('--card-radius',     settings.borderRadius  + 'px');
    rootEl.style.setProperty('--content-pad-v',   settings.paddingV      + 'px');
    rootEl.style.setProperty('--content-pad-h',   settings.paddingH      + 'px');
    rootEl.style.setProperty('--title-size',      settings.titleSize     + 'px');
    rootEl.style.setProperty('--title-gap',       settings.titleGap      + 'px');
    rootEl.style.setProperty('--subtitle-size',   settings.subtitleSize  + 'px');
    rootEl.style.setProperty('--card-w',          settings.cardWidth     + 'px');
    rootEl.style.setProperty('--card-gap',        settings.cardGap       + 'px');
    rootEl.style.setProperty('--card-ratio',      settings.cardRatio     + '');
    rootEl.style.setProperty('--anim-duration',   settings.animDuration  + 's');
    rootEl.style.setProperty('--anim-delay',      settings.animDelay     + 's');

    var titleColor    = hexToRgba(settings.titleHex,    settings.titleOpacity)    || settings.titleHex;
    var subtitleColor = hexToRgba(settings.subtitleHex, settings.subtitleOpacity) || settings.subtitleHex;
    var arrowColor    = hexToRgba(settings.arrowHex,    settings.arrowOpacity)    || settings.arrowHex;
    var arrowBgColor  = hexToRgba(settings.arrowBgHex,  settings.arrowBgOpacity)  || settings.arrowBgHex;

    rootEl.style.setProperty('--title-color',    titleColor);
    rootEl.style.setProperty('--subtitle-color', subtitleColor);
    rootEl.style.setProperty('--arrow-color',    arrowColor);
    rootEl.style.setProperty('--arrow-bg',       arrowBgColor);

    /* Update inspector swatches */
    var titleSwatch    = document.getElementById('scTitleSwatch');
    var subtitleSwatch = document.getElementById('scSubtitleSwatch');
    var arrowSwatch    = document.getElementById('scArrowSwatch');
    var arrowBgSwatch  = document.getElementById('scArrowBgSwatch');

    if (titleSwatch)    titleSwatch.style.background    = titleColor;
    if (subtitleSwatch) subtitleSwatch.style.background = subtitleColor;
    if (arrowSwatch)    arrowSwatch.style.background    = arrowColor;
    if (arrowBgSwatch)  arrowBgSwatch.style.background  = arrowBgColor;
  }

  /* ── Init carousel ── */
  function initCarousel(rootEl) {
    /* Cleanup previous instance */
    if (carouselCleanup) {
      carouselCleanup();
      carouselCleanup = null;
    }

    if (!rootEl) return;

    var cardEls = rootEl.querySelectorAll('.iw-card');
    var total   = cardEls.length;

    if (total === 0) return;

    /* Entrance animation — in editor just set animated immediately */
    if (settings.animStyle !== 'none') {
      for (var ai = 0; ai < cardEls.length; ai++) {
        cardEls[ai].setAttribute('data-state', 'animated');
      }
    }

    var track    = rootEl.querySelector('.iw-track');
    var viewport = rootEl.querySelector('.iw-viewport');
    var prevBtn  = rootEl.querySelector('#iw-prev');
    var nextBtn  = rootEl.querySelector('#iw-next');

    if (!track || !viewport) return;

    var currentIndex = 0;
    var cardW        = 0;
    var gap          = 0;
    var vpW          = 0;
    var autoplayTimer  = null;
    var rafId          = null;
    var isDragging     = false;
    var dragStartX     = 0;
    var dragCurrentX   = 0;
    var dragOffsetX    = 0;
    var resizeObserver = null;

    function syncDims() {
      cardW = settings.cardWidth;
      gap   = settings.cardGap;
      vpW   = rootEl.offsetWidth;
      positionTo(currentIndex, false);
      markCenter();
    }

    function getOffset(index) {
      var totalCardW   = cardW + gap;
      var centerOffset = (vpW - cardW) / 2;
      /* When center-scale is on, the center card gets margin = expand on each side.
         This shifts its layout position right by expand, so offset must compensate. */
      var expand = settings.centerScale ? cardW * (CENTER_SCALE_VALUE - 1) / 2 : 0;
      return -(index * totalCardW) + centerOffset - gap - expand;
    }

    function positionTo(index, animated) {
      var offset = getOffset(index);
      if (animated) {
        track.style.transition = 'transform var(--card-transition)';
      } else {
        track.style.transition = 'none';
      }
      track.style.transform = 'translateX(' + offset + 'px)';
      /* Apply center scale */
      markCenter();
    }

    function markCenter() {
      var cards = rootEl.querySelectorAll('.iw-card');
      for (var i = 0; i < cards.length; i++) {
        cards[i].setAttribute('data-center', i === currentIndex ? 'true' : 'false');
      }
    }

    function navigate(dir) {
      currentIndex = (currentIndex + dir + total) % total;
      positionTo(currentIndex, true);
    }

    function startAutoplay() {
      stopAutoplay();
      if (!settings.autoplay || total < 2) return;
      autoplayTimer = setInterval(function () {
        navigate(1);
      }, settings.autoplaySpeed);
    }

    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    /* Touch / mouse drag */
    function onDragStart(e) {
      isDragging   = true;
      dragStartX   = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
      dragCurrentX = dragStartX;
      dragOffsetX  = 0;
      track.style.transition = 'none';
      stopAutoplay();
    }

    function onDragMove(e) {
      if (!isDragging) return;
      var x = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
      dragOffsetX = x - dragStartX;
      var base = getOffset(currentIndex);
      track.style.transform = 'translateX(' + (base + dragOffsetX) + 'px)';
    }

    function onDragEnd() {
      if (!isDragging) return;
      isDragging = false;
      if (Math.abs(dragOffsetX) > 60) {
        navigate(dragOffsetX < 0 ? 1 : -1);
      } else {
        positionTo(currentIndex, true);
      }
      startAutoplay();
    }

    /* Bind events */
    viewport.addEventListener('mousedown',  onDragStart);
    window.addEventListener('mousemove',   onDragMove);
    window.addEventListener('mouseup',     onDragEnd);
    viewport.addEventListener('touchstart', onDragStart, { passive: true });
    viewport.addEventListener('touchmove',  onDragMove,  { passive: true });
    viewport.addEventListener('touchend',   onDragEnd);

    if (prevBtn) prevBtn.addEventListener('click', function () { navigate(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { navigate(1);  });

    /* Hover pause autoplay */
    rootEl.addEventListener('mouseenter', stopAutoplay);
    rootEl.addEventListener('mouseleave', startAutoplay);

    /* ResizeObserver */
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(function () {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(syncDims);
      });
      resizeObserver.observe(rootEl);
    }

    syncDims();
    startAutoplay();

    /* Cleanup */
    carouselCleanup = function () {
      stopAutoplay();
      if (rafId) cancelAnimationFrame(rafId);
      if (resizeObserver) resizeObserver.disconnect();
      viewport.removeEventListener('mousedown',  onDragStart);
      window.removeEventListener('mousemove',   onDragMove);
      window.removeEventListener('mouseup',     onDragEnd);
      viewport.removeEventListener('touchstart', onDragStart);
      viewport.removeEventListener('touchmove',  onDragMove);
      viewport.removeEventListener('touchend',   onDragEnd);
    };
  }

  /* ── Render widget ── */
  function renderWidget() {
    wrap.innerHTML = buildWidgetHTML();
    var rootEl = wrap.querySelector('#iw-root');
    if (rootEl) {
      applyVars(rootEl);
      initCarousel(rootEl);
    }
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
          '슬라이드' +
        '</button>' +
        '<button class="inspector__detail-close" type="button">&#x2715;</button>' +
      '</div>' +
      '<div class="inspector__detail-body" id="scDetailBody"></div>';
    inspectorEl.appendChild(panel);

    panel.querySelector('.inspector__detail-back').addEventListener('click', function () {
      panel.classList.remove('open');
      currentDetailSlide = null;
    });
    panel.querySelector('.inspector__detail-close').addEventListener('click', function () {
      panel.classList.remove('open');
      currentDetailSlide = null;
      var closeBtn = inspectorEl.querySelector('.inspector__close');
      if (closeBtn) closeBtn.click();
    });

    return panel;
  }

  /* ── Render detail body ── */
  function renderDetailBody(bodyEl, slide) {
    bodyEl.innerHTML = '';

    /* ─ 이미지 ─ */
    var imgField = document.createElement('div');
    imgField.className = 'inspector__field';
    var thumbSrc = slide.imgUrl
      ? '<img src="' + escAttr(slide.imgUrl) + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">'
      : UPLOAD_SVG;
    imgField.innerHTML =
      '<label class="inspector__field-label">이미지</label>' +
      '<div style="display:flex;flex-direction:column;gap:6px">' +
        '<div class="inspector__img-upload' + (slide.imgUrl ? ' inspector__img-upload--filled' : '') + '" id="scImgUpload">' +
          '<div class="inspector__img-thumb' + (slide.imgUrl ? ' inspector__img-thumb--filled' : '') + '" id="scImgThumb">' +
            thumbSrc +
          '</div>' +
          '<button class="inspector__img-clear" id="scImgClear" type="button" title="이미지 제거">&#x2715;</button>' +
          '<input type="file" accept="image/*" id="scImgFile" style="display:none">' +
        '</div>' +
        '<input type="text" class="inspector__card-name-input" id="scImgUrl"' +
        ' placeholder="또는 URL 입력"' +
        ' value="' + (slide.imgUrl && slide.imgUrl.startsWith('data:') ? '' : escAttr(slide.imgUrl || '')) + '">' +
      '</div>';

    var uploadWrap = imgField.querySelector('#scImgUpload');
    var thumb      = imgField.querySelector('#scImgThumb');
    var clearBtn   = imgField.querySelector('#scImgClear');
    var fileInput  = imgField.querySelector('#scImgFile');
    var urlInput   = imgField.querySelector('#scImgUrl');

    function setSlideImg(src) {
      slide.imgUrl = src;
      renderWidget();
    }

    thumb.addEventListener('click', function () { fileInput.click(); });

    fileInput.addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        setSlideImg(ev.target.result);
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
      setSlideImg('');
      urlInput.value = '';
      thumb.innerHTML = UPLOAD_SVG;
      thumb.classList.remove('inspector__img-thumb--filled');
      uploadWrap.classList.remove('inspector__img-upload--filled');
      fileInput.value = '';
    });

    urlInput.addEventListener('input', function (e) {
      var src = e.target.value.trim();
      setSlideImg(src);
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

    /* ─ 타이틀 ─ */
    var titleField = document.createElement('div');
    titleField.className = 'inspector__field';
    titleField.innerHTML =
      '<label class="inspector__field-label">타이틀</label>' +
      '<input class="inspector__card-name-input" type="text"' +
      ' value="' + escAttr(slide.title) + '" placeholder="타이틀" style="width:100%">';
    titleField.querySelector('input').addEventListener('input', function (e) {
      slide.title = e.target.value;
      /* Live update card DOM */
      var rootEl = wrap.querySelector('#iw-root');
      if (rootEl) {
        var cardEl = rootEl.querySelector('.iw-card[data-id="' + slide.id + '"] .iw-card-title');
        if (cardEl) {
          cardEl.textContent = slide.title;
          if (!slide.title) {
            var ph = document.createElement('span');
            ph.className = 'sc-ph';
            ph.textContent = 'Title';
            cardEl.innerHTML = '';
            cardEl.appendChild(ph);
          }
        }
      }
      /* Update list row label */
      var rowEl = slideListEl.querySelector('.inspector__item-row[data-id="' + slide.id + '"] .inspector__item-name');
      if (rowEl) rowEl.textContent = slide.title || '슬라이드';
    });
    bodyEl.appendChild(titleField);

    /* ─ 서브텍스트 ─ */
    var subtitleField = document.createElement('div');
    subtitleField.className = 'inspector__field';
    subtitleField.innerHTML =
      '<label class="inspector__field-label">서브텍스트</label>' +
      '<input class="inspector__card-name-input" type="text"' +
      ' value="' + escAttr(slide.subtitle) + '" placeholder="서브텍스트" style="width:100%">';
    subtitleField.querySelector('input').addEventListener('input', function (e) {
      slide.subtitle = e.target.value;
      var rootEl = wrap.querySelector('#iw-root');
      if (rootEl) {
        var subEl = rootEl.querySelector('.iw-card[data-id="' + slide.id + '"] .iw-card-subtitle');
        if (subEl) {
          subEl.textContent = slide.subtitle;
          if (!slide.subtitle) {
            var ph = document.createElement('span');
            ph.className = 'sc-ph';
            ph.textContent = 'Description';
            subEl.innerHTML = '';
            subEl.appendChild(ph);
          }
        }
      }
    });
    bodyEl.appendChild(subtitleField);

    /* ─ 오버레이 색상 ─ */
    var overlayField = document.createElement('div');
    overlayField.className = 'inspector__field';
    var overlayRgba = hexToRgba(slide.overlayHex, slide.overlayOpacity) || slide.overlayHex;
    overlayField.innerHTML =
      '<label class="inspector__field-label">오버레이 색상</label>' +
      '<div class="inspector__color-row">' +
        '<span class="inspector__swatch" id="scSlideOvSwatch" style="background:' + overlayRgba + '">' +
          '<input type="color" class="inspector__color-native" id="scSlideOvPicker" value="' + escAttr(slide.overlayHex) + '">' +
        '</span>' +
        '<input type="text" class="inspector__hex-input" id="scSlideOvHex" value="' + escAttr(slide.overlayHex) + '" maxlength="7" spellcheck="false">' +
        '<input type="number" class="inspector__opacity-input" id="scSlideOvOpacity" value="' + slide.overlayOpacity + '" min="0" max="100">' +
        '<span class="inspector__pct">%</span>' +
      '</div>';

    var ovSwatch  = overlayField.querySelector('#scSlideOvSwatch');
    var ovPicker  = overlayField.querySelector('#scSlideOvPicker');
    var ovHex     = overlayField.querySelector('#scSlideOvHex');
    var ovOpacity = overlayField.querySelector('#scSlideOvOpacity');

    function updateSlideOverlay() {
      var rgba = hexToRgba(slide.overlayHex, slide.overlayOpacity) || slide.overlayHex;
      ovSwatch.style.background = rgba;
      renderWidget();
    }

    ovPicker.addEventListener('input', function () {
      slide.overlayHex = ovPicker.value.toUpperCase();
      ovHex.value = slide.overlayHex;
      updateSlideOverlay();
    });
    ovHex.addEventListener('input', function () {
      var v = ovHex.value;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        slide.overlayHex = v.toUpperCase();
        ovPicker.value = v;
        updateSlideOverlay();
      }
    });
    ovOpacity.addEventListener('input', function () {
      slide.overlayOpacity = clamp(ovOpacity.value, 0, 100);
      updateSlideOverlay();
    });
    bodyEl.appendChild(overlayField);

    /* ─ 링크 URL ─ */
    var linkField = document.createElement('div');
    linkField.className = 'inspector__field';
    linkField.innerHTML =
      '<label class="inspector__field-label">링크 URL</label>' +
      '<input class="inspector__card-name-input" type="text"' +
      ' value="' + escAttr(slide.linkUrl) + '" placeholder="https://" style="width:100%">';
    linkField.querySelector('input').addEventListener('input', function (e) {
      slide.linkUrl = e.target.value.trim();
      renderWidget();
    });
    bodyEl.appendChild(linkField);

    /* ─ 새 창으로 열기 ─ */
    var newTabField = document.createElement('div');
    newTabField.className = 'inspector__field';
    newTabField.innerHTML =
      '<label class="inspector__field-label">새 창으로 열기</label>' +
      '<button class="inspector__onoff' + (slide.newTab ? ' active' : '') + '" id="scNewTab" type="button"></button>';
    newTabField.querySelector('#scNewTab').addEventListener('click', function () {
      slide.newTab = !slide.newTab;
      this.classList.toggle('active', slide.newTab);
      renderWidget();
    });
    bodyEl.appendChild(newTabField);

    /* ─ 시작 날짜 / 시간 ─ */
    var startField = document.createElement('div');
    startField.className = 'inspector__field';
    startField.innerHTML =
      '<label class="inspector__field-label">시작 날짜</label>' +
      '<input class="inspector__card-name-input" type="date" value="' + escAttr(slide.dateStart) + '" style="width:100%">';
    startField.querySelector('input').addEventListener('input', function (e) {
      slide.dateStart = e.target.value;
    });
    bodyEl.appendChild(startField);

    var startTimeField = document.createElement('div');
    startTimeField.className = 'inspector__field';
    startTimeField.innerHTML =
      '<label class="inspector__field-label">시작 시간</label>' +
      '<input class="inspector__card-name-input" type="time" value="' + escAttr(slide.timeStart) + '" style="width:100%">';
    startTimeField.querySelector('input').addEventListener('input', function (e) {
      slide.timeStart = e.target.value;
    });
    bodyEl.appendChild(startTimeField);

    /* ─ 종료 날짜 / 시간 ─ */
    var endField = document.createElement('div');
    endField.className = 'inspector__field';
    endField.innerHTML =
      '<label class="inspector__field-label">종료 날짜</label>' +
      '<input class="inspector__card-name-input" type="date" value="' + escAttr(slide.dateEnd) + '" style="width:100%">';
    endField.querySelector('input').addEventListener('input', function (e) {
      slide.dateEnd = e.target.value;
    });
    bodyEl.appendChild(endField);

    var endTimeField = document.createElement('div');
    endTimeField.className = 'inspector__field';
    endTimeField.innerHTML =
      '<label class="inspector__field-label">종료 시간</label>' +
      '<input class="inspector__card-name-input" type="time" value="' + escAttr(slide.timeEnd) + '" style="width:100%">';
    endTimeField.querySelector('input').addEventListener('input', function (e) {
      slide.timeEnd = e.target.value;
    });
    bodyEl.appendChild(endTimeField);

    /* ─ 슬라이드 삭제 ─ */
    var deleteWrap = document.createElement('div');
    deleteWrap.style.marginTop = '8px';
    deleteWrap.innerHTML =
      '<button class="inspector__delete-btn" type="button">' + DELETE_SVG + '슬라이드 삭제</button>';
    deleteWrap.querySelector('button').addEventListener('click', function () {
      if (slides.length <= 1) return;
      detailEl.classList.remove('open');
      currentDetailSlide = null;
      slides = slides.filter(function (s) { return s.id !== slide.id; });
      renderWidget();
      renderInspectorItems();
    });
    bodyEl.appendChild(deleteWrap);
  }

  function openDetail(slide) {
    currentDetailSlide = slide;
    var bodyEl = detailEl.querySelector('#scDetailBody');
    renderDetailBody(bodyEl, slide);
    detailEl.classList.add('open');
  }

  /* ── Render inspector items ── */
  function renderInspectorItems() {
    slideListEl.innerHTML = '';
    slides.forEach(function (slide) {
      var row = document.createElement('div');
      row.className = 'inspector__item-row';
      row.dataset.id = slide.id;
      row.innerHTML =
        '<span class="inspector__drag">' + DRAG_SVG + '</span>' +
        '<span class="inspector__item-name">' + esc(slide.title || '슬라이드') + '</span>' +
        '<span class="inspector__item-arrow">' + ARROW_SVG + '</span>';

      row.addEventListener('click', function (e) {
        if (e.target.closest('.inspector__drag')) return;
        openDetail(slide);
      });

      setupDragDrop(row, slide.id);
      slideListEl.appendChild(row);
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
      var rect = row.getBoundingClientRect();
      var mid  = rect.top + rect.height / 2;
      row.classList.add(e.clientY < mid ? 'drag-over-top' : 'drag-over-bottom');
    });
    row.addEventListener('drop', function (e) {
      e.preventDefault();
      if (dragSrcId === null || dragSrcId === id) return;
      var rect   = row.getBoundingClientRect();
      var mid    = rect.top + rect.height / 2;
      var before = e.clientY < mid;
      var srcIdx = slides.findIndex(function (s) { return s.id === dragSrcId; });
      var moved  = slides.splice(srcIdx, 1)[0];
      var dstIdx = slides.findIndex(function (s) { return s.id === id; });
      slides.splice(before ? dstIdx : dstIdx + 1, 0, moved);
      renderWidget();
      renderInspectorItems();
    });
  }

  function clearDragIndicators() {
    slideListEl.querySelectorAll('.inspector__item-row').forEach(function (r) {
      r.classList.remove('drag-over-top', 'drag-over-bottom');
    });
  }

  /* ── Add slide ── */
  document.getElementById('scAddSlide').addEventListener('click', function () {
    var newSlide = {
      id: nextId++,
      imgUrl:        '',
      title:         'Title',
      subtitle:      'Description',
      overlayHex:    '#000000',
      overlayOpacity: 0,
      linkUrl:       '',
      newTab:        false,
      dateStart:     '',
      timeStart:     '',
      dateEnd:       '',
      timeEnd:       ''
    };
    slides.push(newSlide);
    renderWidget();
    renderInspectorItems();
    openDetail(newSlide);
  });

  /* ── Color binding helper ── */
  function bindColor(pickerId, hexId, opId, hexKey, opKey, cb) {
    var picker = document.getElementById(pickerId);
    var hexEl  = document.getElementById(hexId);
    var opEl   = opId ? document.getElementById(opId) : null;
    if (!picker || !hexEl) return;

    picker.addEventListener('input', function () {
      settings[hexKey] = picker.value.toUpperCase();
      hexEl.value = settings[hexKey];
      cb ? cb() : renderWidget();
    });
    hexEl.addEventListener('input', function () {
      var v = hexEl.value;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        settings[hexKey] = v.toUpperCase();
        picker.value = v;
        cb ? cb() : renderWidget();
      }
    });
    if (opEl) opEl.addEventListener('input', function () {
      settings[opKey] = clamp(opEl.value, 0, 100);
      cb ? cb() : renderWidget();
    });
  }

  /* ── Num binding helper ── */
  function bindNum(id, stateKey, min, max, cb) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', function (e) {
      settings[stateKey] = clamp(e.target.value, min, max);
      cb ? cb() : renderWidget();
    });
  }

  /* ── Wire colors ── */
  function applyVarsOnly() {
    var rootEl = wrap.querySelector('#iw-root');
    if (rootEl) applyVars(rootEl);
  }

  bindColor('scTitlePicker',    'scTitleHex',    'scTitleOpacity',    'titleHex',    'titleOpacity',    applyVarsOnly);
  bindColor('scSubtitlePicker', 'scSubtitleHex', 'scSubtitleOpacity', 'subtitleHex', 'subtitleOpacity', applyVarsOnly);
  bindColor('scArrowPicker',    'scArrowHex',    'scArrowOpacity',    'arrowHex',    'arrowOpacity',    applyVarsOnly);
  bindColor('scArrowBgPicker',  'scArrowBgHex',  'scArrowBgOpacity',  'arrowBgHex',  'arrowBgOpacity',  applyVarsOnly);

  /* ── Wire num inputs ── */
  bindNum('scTitleSize',     'titleSize',     10, 80,  applyVarsOnly);
  bindNum('scSubtitleSize',  'subtitleSize',  10, 60,  applyVarsOnly);
  bindNum('scTitleGap',      'titleGap',      0,  40,  applyVarsOnly);
  bindNum('scCardWidth',     'cardWidth',     100, 800, renderWidget);
  bindNum('scCardGap',       'cardGap',       0,  100, renderWidget);
  bindNum('scPaddingV',      'paddingV',      0,  100, applyVarsOnly);
  bindNum('scPaddingH',      'paddingH',      0,  100, applyVarsOnly);
  bindNum('scBorderRadius',  'borderRadius',  0,  100, applyVarsOnly);
  bindNum('scAutoplaySpeed', 'autoplaySpeed', 500, 10000, renderWidget);
  bindNum('scAnimDuration',  'animDuration',  0.1, 3,   applyVarsOnly);
  bindNum('scAnimDelay',     'animDelay',     0,   5,   applyVarsOnly);

  /* ── Position select ── */
  document.getElementById('scPosition').addEventListener('change', function (e) {
    settings.position = e.target.value;
    var rootEl = wrap.querySelector('#iw-root');
    if (rootEl) rootEl.setAttribute('data-position', settings.position);
  });

  /* ── Card ratio select ── */
  document.getElementById('scCardRatio').addEventListener('change', function (e) {
    settings.cardRatio = parseFloat(e.target.value);
    renderWidget();
  });

  /* ── Arrow segment ── */
  document.getElementById('scArrowSegment').addEventListener('click', function (e) {
    var btn = e.target.closest('.inspector__seg-btn');
    if (!btn) return;
    var val = btn.dataset.value;
    settings.arrowStyle = val;
    document.querySelectorAll('#scArrowSegment .inspector__seg-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.value === val);
    });
    var rootEl = wrap.querySelector('#iw-root');
    if (rootEl) rootEl.setAttribute('data-arrow', val);
  });

  /* ── Center scale toggle ── */
  document.getElementById('scCenterScale').addEventListener('click', function () {
    settings.centerScale = !settings.centerScale;
    this.classList.toggle('active', settings.centerScale);
    renderWidget();
  });

  /* ── Hover scale toggle ── */
  document.getElementById('scHoverScale').addEventListener('click', function () {
    settings.hoverScale = !settings.hoverScale;
    this.classList.toggle('active', settings.hoverScale);
    var rootEl = wrap.querySelector('#iw-root');
    if (rootEl) rootEl.setAttribute('data-hover-scale', settings.hoverScale ? 'on' : 'off');
  });

  /* ── Autoplay toggle ── */
  document.getElementById('scAutoplay').addEventListener('click', function () {
    settings.autoplay = !settings.autoplay;
    this.classList.toggle('active', settings.autoplay);
    document.getElementById('scAutoplaySpeedField').style.display = settings.autoplay ? '' : 'none';
    renderWidget();
  });

  /* ── Anim style select ── */
  document.getElementById('scAnimStyle').addEventListener('change', function (e) {
    settings.animStyle = e.target.value;
    renderWidget();
  });

  /* ── Section collapse ── */
  inspectorEl.querySelectorAll('.inspector__sec-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.closest('.inspector__section').classList.toggle('collapsed');
    });
  });

  /* ── Inspector close ── */
  document.getElementById('scInspectorClose').addEventListener('click', function () {
    inspectorEl.style.display = 'none';
  });

  /* ── Reset ── */
  function resetAll() {
    nextId = 5;

    slides = [
      { id: 1, imgUrl: '', title: 'Title', subtitle: 'Description', overlayHex: '#000000', overlayOpacity: 0, linkUrl: '', newTab: false, dateStart: '', timeStart: '', dateEnd: '', timeEnd: '' },
      { id: 2, imgUrl: '', title: 'Title', subtitle: 'Description', overlayHex: '#000000', overlayOpacity: 0, linkUrl: '', newTab: false, dateStart: '', timeStart: '', dateEnd: '', timeEnd: '' },
      { id: 3, imgUrl: '', title: 'Title', subtitle: 'Description', overlayHex: '#000000', overlayOpacity: 0, linkUrl: '', newTab: false, dateStart: '', timeStart: '', dateEnd: '', timeEnd: '' },
      { id: 4, imgUrl: '', title: 'Title', subtitle: 'Description', overlayHex: '#000000', overlayOpacity: 0, linkUrl: '', newTab: false, dateStart: '', timeStart: '', dateEnd: '', timeEnd: '' }
    ];

    settings.titleSize       = 24;
    settings.titleHex        = '#FFFFFF';
    settings.titleOpacity    = 100;
    settings.subtitleSize    = 16;
    settings.subtitleHex     = '#FFFFFF';
    settings.subtitleOpacity = 100;
    settings.position        = 'bot-left';
    settings.titleGap        = 6;
    settings.cardRatio       = 1.34;
    settings.cardWidth       = 342;
    settings.cardGap         = 30;
    settings.paddingV        = 32;
    settings.paddingH        = 38;
    settings.borderRadius    = 12;
    settings.arrowStyle      = 'chevron';
    settings.arrowHex        = '#4B515B';
    settings.arrowOpacity    = 100;
    settings.arrowBgHex      = '#FFFFFF';
    settings.arrowBgOpacity  = 100;
    settings.centerScale     = true;
    settings.hoverScale      = true;
    settings.autoplay        = true;
    settings.autoplaySpeed   = 3000;
    settings.animStyle       = 'none';
    settings.animDuration    = 0.7;
    settings.animDelay       = 0;

    /* Sync form inputs */
    document.getElementById('scTitleSize').value      = 24;
    document.getElementById('scTitlePicker').value    = '#ffffff';
    document.getElementById('scTitleHex').value       = '#FFFFFF';
    document.getElementById('scTitleOpacity').value   = 100;

    document.getElementById('scSubtitleSize').value      = 16;
    document.getElementById('scSubtitlePicker').value    = '#ffffff';
    document.getElementById('scSubtitleHex').value       = '#FFFFFF';
    document.getElementById('scSubtitleOpacity').value   = 100;

    document.getElementById('scPosition').value       = 'bot-left';
    document.getElementById('scTitleGap').value       = 6;

    document.getElementById('scCardRatio').value      = '1.34';
    document.getElementById('scCardWidth').value      = 342;
    document.getElementById('scCardGap').value        = 30;
    document.getElementById('scPaddingV').value       = 32;
    document.getElementById('scPaddingH').value       = 38;
    document.getElementById('scBorderRadius').value   = 12;

    document.getElementById('scArrowPicker').value    = '#4b515b';
    document.getElementById('scArrowHex').value       = '#4B515B';
    document.getElementById('scArrowOpacity').value   = 100;

    document.getElementById('scArrowBgPicker').value  = '#ffffff';
    document.getElementById('scArrowBgHex').value     = '#FFFFFF';
    document.getElementById('scArrowBgOpacity').value = 100;

    document.getElementById('scCenterScale').classList.add('active');
    document.getElementById('scHoverScale').classList.add('active');
    document.getElementById('scAutoplay').classList.add('active');
    document.getElementById('scAutoplaySpeedField').style.display = '';
    document.getElementById('scAutoplaySpeed').value = 3000;

    document.querySelectorAll('#scArrowSegment .inspector__seg-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.value === 'chevron');
    });

    document.getElementById('scAnimStyle').value     = 'none';
    document.getElementById('scAnimDuration').value  = 0.7;
    document.getElementById('scAnimDelay').value     = 0;

    if (detailEl) detailEl.classList.remove('open');
    currentDetailSlide = null;

    renderWidget();
    renderInspectorItems();
  }

  document.getElementById('scReset').addEventListener('click', resetAll);

  /* ── Replay ── */
  document.getElementById('scReplay').addEventListener('click', function () {
    renderWidget();
  });

  /* ── Init ── */
  detailEl = createDetailPanel();
  renderWidget();
  renderInspectorItems();

  /* Sync initial toggle button states from settings */
  document.getElementById('scCenterScale').classList.toggle('active', settings.centerScale);
  document.getElementById('scHoverScale').classList.toggle('active', settings.hoverScale);
  document.getElementById('scAutoplay').classList.toggle('active', settings.autoplay);
  document.getElementById('scAutoplaySpeedField').style.display = settings.autoplay ? '' : 'none';

})();
