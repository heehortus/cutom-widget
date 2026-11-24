/* =====================================
   Hero Main Slide Widget — Controller
   ===================================== */

(function () {
  'use strict';

  /* ── State ── */
  var nextId = 4;

  var settings = {
    autoplay:            true,
    delay:               5,
    effect:              'slide',
    headerHeight:        0,
    headerHeightMobile:  0,
    textHex:             '#FFFFFF',
    textOpacity:         100,
    lineHex:             '#FFFFFF',
    lineOpacity:         100,
    overlayStrength:     100,
    titleSize:           72,
    descSize:            20
  };

  var slides = [
    { id: 1, imgSrc: '', imgAlt: '', overlayHex: '#1A1A1A', overlayOpacity: 100, title: 'Title', desc: 'Description' },
    { id: 2, imgSrc: '', imgAlt: '', overlayHex: '#1A1A1A', overlayOpacity: 100, title: 'Title', desc: 'Description' },
    { id: 3, imgSrc: '', imgAlt: '', overlayHex: '#1A1A1A', overlayOpacity: 100, title: 'Title', desc: 'Description' }
  ];

  var dragSrcId          = null;
  var currentDetailSlide = null;
  var detailEl           = null;
  var slideshowController = null;

  /* ── DOM refs ── */
  var wrap        = document.getElementById('hmsWrap');
  var slideListEl = document.getElementById('hmsSlideList');
  var inspectorEl = document.getElementById('hmsInspector');

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

  /* ── Render widget ── */
  function renderWidget() {
    var slidesHtml = slides.map(function (slide, i) {
      var imgHtml = slide.imgSrc
        ? '<img class="iw-hero__img" src="' + escAttr(slide.imgSrc) + '" alt="' + escAttr(slide.imgAlt) + '" draggable="false">'
        : '<div class="iw-hero__img-fallback"></div>';
      return (
        '<div class="iw-hero__slide" role="group" aria-roledescription="slide"' +
        ' id="hms-slide-' + i + '" data-color="' + escAttr(slide.overlayHex) + '"' +
        ' data-opacity="' + slide.overlayOpacity + '"' +
        ' data-state="inactive" aria-hidden="true"' +
        ' data-id="' + slide.id + '">' +
          imgHtml +
          '<div class="iw-hero__overlay" aria-hidden="true"></div>' +
          '<div class="iw-hero__content">' +
            '<div class="iw-hero__title editor-content" role="heading" aria-level="2">' + esc(slide.title) + '</div>' +
            '<p class="iw-hero__desc">' + esc(slide.desc) + '</p>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    var segsHtml = slides.map(function (slide, i) {
      return (
        '<button type="button" class="iw-hero__seg" role="tab"' +
        ' id="hms-seg-' + i + '" aria-controls="hms-slide-' + i + '"' +
        ' aria-selected="false" data-state="inactive">' +
        '<span class="iw-hero__fill" aria-hidden="true"></span>' +
        '</button>'
      );
    }).join('');

    wrap.innerHTML =
      '<div class="iw-hero__viewport">' +
        '<div class="iw-hero__track">' + slidesHtml + '</div>' +
      '</div>' +
      '<div class="iw-hero__progress" role="tablist" aria-label="슬라이드 선택">' + segsHtml + '</div>';

    applyStyle();
    initSlideshow();
  }

  /* ── Apply style ── */
  function applyStyle() {
    var textColor = hexToRgba(settings.textHex, settings.textOpacity) || settings.textHex;
    var lineColor = hexToRgba(settings.lineHex, settings.lineOpacity) || settings.lineHex;

    wrap.style.setProperty('--text-color',       textColor);
    wrap.style.setProperty('--line-color',       lineColor);
    wrap.style.setProperty('--overlay-strength', settings.overlayStrength + '%');
    wrap.style.setProperty('--header-height',    settings.headerHeight + 'px');
    wrap.style.setProperty('--header-height-m',  settings.headerHeightMobile + 'px');
    wrap.style.setProperty('--title-size',       settings.titleSize + 'px');
    wrap.style.setProperty('--desc-size',        settings.descSize + 'px');
    wrap.style.setProperty('--delay',            settings.delay + 's');
    wrap.setAttribute('data-autoplay', settings.autoplay ? 'true' : 'false');
    wrap.setAttribute('data-effect',   settings.effect);
    wrap.setAttribute('data-count',    String(slides.length));

    var textSwatch = document.getElementById('hmsTextSwatch');
    var lineSwatch = document.getElementById('hmsLineSwatch');
    if (textSwatch) textSwatch.style.background = textColor;
    if (lineSwatch) lineSwatch.style.background = lineColor;
  }

  /* ── Init slideshow logic ── */
  function initSlideshow() {
    if (slideshowController) {
      slideshowController.abort();
    }
    slideshowController = new AbortController();
    var signal = slideshowController.signal;
    var opts   = { signal: signal };

    var track    = wrap.querySelector('.iw-hero__track');
    var viewport = wrap.querySelector('.iw-hero__viewport');
    var progress = wrap.querySelector('.iw-hero__progress');
    var slideEls = wrap.querySelectorAll('.iw-hero__slide');
    var segs     = wrap.querySelectorAll('.iw-hero__seg');
    var total    = slideEls.length;

    if (total === 0) return;

    /* Apply per-slide overlay colors */
    for (var i = 0; i < total; i++) {
      var color   = slideEls[i].getAttribute('data-color');
      var opacity = parseFloat(slideEls[i].getAttribute('data-opacity') || '100');
      if (color) {
        var rgba = hexToRgba(color, opacity) || color;
        slideEls[i].style.setProperty('--slide-color', rgba);
      }
    }

    /* Label segments for accessibility */
    for (var i = 0; i < segs.length; i++) {
      segs[i].setAttribute('aria-label', (i + 1) + ' / ' + total + ' 슬라이드');
    }

    var isFade    = settings.effect === 'fade';
    var isAutoplay = settings.autoplay && total > 1;
    var current   = 0;
    var startX    = null;

    function goTo(index) {
      current = ((index % total) + total) % total;
      if (!isFade) {
        track.style.transform = 'translateX(' + (-current * 100) + '%)';
      }
      for (var i = 0; i < total; i++) {
        var active = i === current;
        slideEls[i].setAttribute('data-state', active ? 'active' : 'inactive');
        slideEls[i].setAttribute('aria-hidden', active ? 'false' : 'true');
      }
      for (var i = 0; i < segs.length; i++) {
        var active = i === current;
        segs[i].setAttribute('data-state', active ? 'active' : 'inactive');
        segs[i].setAttribute('aria-selected', active ? 'true' : 'false');
      }
    }

    function goNext() { goTo(current + 1); }
    function goPrev() { goTo(current - 1); }
    function setPaused(paused) { wrap.setAttribute('data-paused', paused ? 'true' : 'false'); }

    function handleFillEnd(e) {
      if (!isAutoplay) return;
      if (!e.target.classList.contains('iw-hero__fill')) return;
      goNext();
    }

    function handleSegClick(e) {
      var seg = e.target.closest('.iw-hero__seg');
      if (!seg) return;
      for (var i = 0; i < segs.length; i++) {
        if (segs[i] === seg) { goTo(i); return; }
      }
    }

    function handlePointerDown(e) { startX = e.clientX; }
    function handlePointerUp(e) {
      if (startX === null || total < 2) return;
      var diff = e.clientX - startX;
      startX = null;
      if (Math.abs(diff) < 50) return;
      if (diff < 0) goNext(); else goPrev();
    }
    function resetPointer() { startX = null; }

    function handleKeydown(e) {
      if (total < 2) return;
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft')  goPrev();
    }

    goTo(0);

    progress.addEventListener('animationend', handleFillEnd, opts);
    progress.addEventListener('click',        handleSegClick, opts);
    viewport.addEventListener('pointerdown',  handlePointerDown, opts);
    viewport.addEventListener('pointerup',    handlePointerUp, opts);
    viewport.addEventListener('pointercancel',resetPointer, opts);
    viewport.addEventListener('pointerleave', resetPointer, opts);
    wrap.addEventListener('keydown',          handleKeydown, opts);
    wrap.addEventListener('pointerenter',     function () { setPaused(true);  }, opts);
    wrap.addEventListener('pointerleave',     function () { setPaused(false); }, opts);
    wrap.addEventListener('focusin',          function () { setPaused(true);  }, opts);
    wrap.addEventListener('focusout',         function () { setPaused(false); }, opts);
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
      '<div class="inspector__detail-body" id="hmsDetailBody"></div>';
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

    /* ─ 배경 이미지 ─ */
    var imgField = document.createElement('div');
    imgField.className = 'inspector__field';
    var thumbSrc = slide.imgSrc
      ? '<img src="' + escAttr(slide.imgSrc) + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">'
      : UPLOAD_SVG;
    imgField.innerHTML =
      '<label class="inspector__field-label">배경 이미지</label>' +
      '<div style="display:flex;flex-direction:column;gap:6px">' +
        '<div class="inspector__img-upload' + (slide.imgSrc ? ' inspector__img-upload--filled' : '') + '" id="hmsImgUpload">' +
          '<div class="inspector__img-thumb' + (slide.imgSrc ? ' inspector__img-thumb--filled' : '') + '" id="hmsImgThumb">' +
            thumbSrc +
          '</div>' +
          '<button class="inspector__img-clear" id="hmsImgClear" type="button" title="이미지 제거">&#x2715;</button>' +
          '<input type="file" accept="image/*" id="hmsImgFile" style="display:none">' +
        '</div>' +
        '<input type="text" class="inspector__card-name-input" id="hmsImgUrl"' +
        ' placeholder="또는 URL 입력"' +
        ' value="' + (slide.imgSrc && slide.imgSrc.startsWith('data:') ? '' : escAttr(slide.imgSrc || '')) + '">' +
      '</div>';

    var uploadWrap = imgField.querySelector('#hmsImgUpload');
    var thumb      = imgField.querySelector('#hmsImgThumb');
    var clearBtn   = imgField.querySelector('#hmsImgClear');
    var fileInput  = imgField.querySelector('#hmsImgFile');
    var urlInput   = imgField.querySelector('#hmsImgUrl');

    function setSlideImg(src) {
      slide.imgSrc = src;
      var slideEl = wrap.querySelector('.iw-hero__slide[data-id="' + slide.id + '"]');
      if (!slideEl) return;
      var imgEl      = slideEl.querySelector('.iw-hero__img');
      var fallbackEl = slideEl.querySelector('.iw-hero__img-fallback');
      if (src) {
        if (fallbackEl) fallbackEl.remove();
        if (!imgEl) {
          imgEl = document.createElement('img');
          imgEl.className = 'iw-hero__img';
          imgEl.alt = slide.imgAlt || '';
          imgEl.setAttribute('draggable', 'false');
          slideEl.insertBefore(imgEl, slideEl.firstChild);
        }
        imgEl.src = src;
      } else {
        if (imgEl) imgEl.remove();
        if (!slideEl.querySelector('.iw-hero__img-fallback')) {
          var fb = document.createElement('div');
          fb.className = 'iw-hero__img-fallback';
          slideEl.insertBefore(fb, slideEl.firstChild);
        }
      }
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

    /* ─ 이미지 대체 텍스트 ─ */
    var altField = document.createElement('div');
    altField.className = 'inspector__field';
    altField.innerHTML =
      '<label class="inspector__field-label">이미지 대체 텍스트</label>' +
      '<input class="inspector__card-name-input" type="text"' +
      ' value="' + escAttr(slide.imgAlt) + '" placeholder="이미지 설명" style="width:100%">';
    altField.querySelector('input').addEventListener('input', function (e) {
      slide.imgAlt = e.target.value;
      var imgEl = wrap.querySelector('.iw-hero__slide[data-id="' + slide.id + '"] .iw-hero__img');
      if (imgEl) imgEl.alt = slide.imgAlt;
    });
    bodyEl.appendChild(altField);

    /* ─ 오버레이 색상 ─ */
    var overlayField = document.createElement('div');
    overlayField.className = 'inspector__field';
    var overlayRgba = hexToRgba(slide.overlayHex, slide.overlayOpacity) || slide.overlayHex;
    overlayField.innerHTML =
      '<label class="inspector__field-label">오버레이 색상</label>' +
      '<div class="inspector__color-row">' +
        '<span class="inspector__swatch" id="hmsSlideOvSwatch" style="background:' + overlayRgba + '">' +
          '<input type="color" class="inspector__color-native" id="hmsSlideOvPicker" value="' + escAttr(slide.overlayHex) + '">' +
        '</span>' +
        '<input type="text" class="inspector__hex-input" id="hmsSlideOvHex" value="' + escAttr(slide.overlayHex) + '" maxlength="7" spellcheck="false">' +
        '<input type="number" class="inspector__opacity-input" id="hmsSlideOvOpacity" value="' + slide.overlayOpacity + '" min="0" max="100">' +
        '<span class="inspector__pct">%</span>' +
      '</div>';

    var ovSwatch  = overlayField.querySelector('#hmsSlideOvSwatch');
    var ovPicker  = overlayField.querySelector('#hmsSlideOvPicker');
    var ovHex     = overlayField.querySelector('#hmsSlideOvHex');
    var ovOpacity = overlayField.querySelector('#hmsSlideOvOpacity');

    function updateSlideOverlay() {
      var rgba = hexToRgba(slide.overlayHex, slide.overlayOpacity) || slide.overlayHex;
      ovSwatch.style.background = rgba;
      var slideEl = wrap.querySelector('.iw-hero__slide[data-id="' + slide.id + '"]');
      if (slideEl) {
        slideEl.setAttribute('data-color',   slide.overlayHex);
        slideEl.setAttribute('data-opacity', slide.overlayOpacity);
        slideEl.style.setProperty('--slide-color', rgba);
      }
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

    /* ─ 제목 ─ */
    var titleField = document.createElement('div');
    titleField.className = 'inspector__field';
    titleField.innerHTML =
      '<label class="inspector__field-label">제목</label>' +
      '<textarea class="vc-desc-input" rows="3" placeholder="슬라이드 제목">' + esc(slide.title) + '</textarea>';
    titleField.querySelector('textarea').addEventListener('input', function (e) {
      slide.title = e.target.value;
      var titleEl = wrap.querySelector('.iw-hero__slide[data-id="' + slide.id + '"] .iw-hero__title');
      if (titleEl) titleEl.textContent = slide.title;
      var rowName = slideListEl.querySelector('.inspector__item-row[data-id="' + slide.id + '"] .inspector__item-name');
      if (rowName) rowName.textContent = slide.title || '슬라이드';
    });
    bodyEl.appendChild(titleField);

    /* ─ 설명 ─ */
    var descField = document.createElement('div');
    descField.className = 'inspector__field';
    descField.innerHTML =
      '<label class="inspector__field-label">설명</label>' +
      '<textarea class="vc-desc-input" rows="2" placeholder="슬라이드 설명">' + esc(slide.desc) + '</textarea>';
    descField.querySelector('textarea').addEventListener('input', function (e) {
      slide.desc = e.target.value;
      var descEl = wrap.querySelector('.iw-hero__slide[data-id="' + slide.id + '"] .iw-hero__desc');
      if (descEl) descEl.textContent = slide.desc;
    });
    bodyEl.appendChild(descField);

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
    var bodyEl = detailEl.querySelector('#hmsDetailBody');
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
  document.getElementById('hmsAddSlide').addEventListener('click', function () {
    if (slides.length >= 10) return;
    var newSlide = {
      id: nextId++,
      imgSrc:        '',
      imgAlt:        '',
      overlayHex:    '#1A1A1A',
      overlayOpacity: 100,
      title:         'Title',
      desc:          'Description'
    };
    slides.push(newSlide);
    renderWidget();
    renderInspectorItems();
    openDetail(newSlide);
  });

  /* ── Autoplay toggle ── */
  var autoplayBtn = document.getElementById('hmsAutoplay');
  autoplayBtn.addEventListener('click', function () {
    settings.autoplay = !settings.autoplay;
    autoplayBtn.classList.toggle('active', settings.autoplay);
    renderWidget();
  });

  /* ── Delay ── */
  document.getElementById('hmsDelay').addEventListener('input', function (e) {
    settings.delay = clamp(e.target.value, 2, 30);
    wrap.style.setProperty('--delay', settings.delay + 's');
    wrap.setAttribute('data-delay', settings.delay);
  });

  /* ── Effect ── */
  var effectSlideBtn = document.getElementById('hmsEffectSlide');
  var effectFadeBtn  = document.getElementById('hmsEffectFade');

  function setEffect(val) {
    settings.effect = val;
    effectSlideBtn.classList.toggle('active', val === 'slide');
    effectFadeBtn.classList.toggle('active',  val === 'fade');
    renderWidget();
  }

  effectSlideBtn.addEventListener('click', function () { setEffect('slide'); });
  effectFadeBtn.addEventListener('click',  function () { setEffect('fade');  });

  /* ── Header height ── */
  document.getElementById('hmsHeaderH').addEventListener('input', function (e) {
    settings.headerHeight = clamp(e.target.value, 0, 200);
    wrap.style.setProperty('--header-height', settings.headerHeight + 'px');
  });

  document.getElementById('hmsHeaderHM').addEventListener('input', function (e) {
    settings.headerHeightMobile = clamp(e.target.value, 0, 200);
    wrap.style.setProperty('--header-height-m', settings.headerHeightMobile + 'px');
  });

  /* ── Color helpers ── */
  function bindColor(pickerId, hexId, opId, swatchId, hexKey, opKey) {
    var picker  = document.getElementById(pickerId);
    var hexEl   = document.getElementById(hexId);
    var opEl    = opId    ? document.getElementById(opId)    : null;
    var swatchEl = swatchId ? document.getElementById(swatchId) : null;

    picker.addEventListener('input', function () {
      settings[hexKey] = picker.value.toUpperCase();
      hexEl.value = settings[hexKey];
      applyStyle();
    });
    hexEl.addEventListener('input', function () {
      var v = hexEl.value;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        settings[hexKey] = v.toUpperCase();
        picker.value = v;
        applyStyle();
      }
    });
    if (opEl) opEl.addEventListener('input', function () {
      settings[opKey] = clamp(opEl.value, 0, 100);
      applyStyle();
    });
  }

  function bindNum(id, key, min, max, cb) {
    document.getElementById(id).addEventListener('input', function (e) {
      settings[key] = clamp(e.target.value, min, max);
      cb ? cb() : applyStyle();
    });
  }

  /* ── Wire style controls ── */
  bindColor('hmsTextPicker', 'hmsTextHex', 'hmsTextOpacity', 'hmsTextSwatch', 'textHex', 'textOpacity');
  bindColor('hmsLinePicker', 'hmsLineHex', 'hmsLineOpacity', 'hmsLineSwatch', 'lineHex', 'lineOpacity');

  bindNum('hmsOverlayStrength', 'overlayStrength', 0, 100, function () {
    wrap.style.setProperty('--overlay-strength', settings.overlayStrength + '%');
  });

  bindNum('hmsTitleSize', 'titleSize', 12, 120, function () {
    wrap.style.setProperty('--title-size', settings.titleSize + 'px');
  });
  bindNum('hmsDescSize', 'descSize', 10, 60, function () {
    wrap.style.setProperty('--desc-size', settings.descSize + 'px');
  });

  /* ── Section collapse ── */
  inspectorEl.querySelectorAll('.inspector__sec-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.closest('.inspector__section').classList.toggle('collapsed');
    });
  });

  /* ── Inspector close ── */
  document.getElementById('hmsInspectorClose').addEventListener('click', function () {
    inspectorEl.style.display = 'none';
  });

  /* ── Widget delete ── */
  document.getElementById('hmsDelete').addEventListener('click', function () {
    if (confirm('위젯을 삭제하시겠습니까?')) {
      wrap.remove();
      inspectorEl.style.display = 'none';
    }
  });

  /* ── Init ── */
  detailEl = createDetailPanel();
  renderWidget();
  renderInspectorItems();

})();
