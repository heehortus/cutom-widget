/* =====================================
   Map Widget — Google Maps
   ===================================== */
(function () {
  'use strict';

  /* ── 상수 ── */
  var GOOGLE_ZOOM = [8, 11, 13, 15, 17];

  var DEFAULT_STATE = {
    title:      '오시는 길',
    titleSize:  28,
    titleAlign: 'left',
    address:   '서울특별시청',
    width:     1200,
    height:    450,
    zoomLevel: 3,
    infoLayout: 'grid',
    info: {
      phone:   '000-0000-0000',
      hours:   '평일 09:00 ~ 18:00 (점심 12:00 ~ 13:00) / 주말 · 공휴일 휴무',
      email:   'info@info.com'
    }
  };

  var DEFAULT_STYLE = {
    borderRadius:  10,
    shadow:        true,
    shadowBlur:    16,
    shadowY:       2,
    shadowOpacity: 12
  };

  /* ── State ── */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  var state = clone(DEFAULT_STATE);
  var style = Object.assign({}, DEFAULT_STYLE);

  /* ── Helpers ── */
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function googleZoom() {
    return GOOGLE_ZOOM[Math.max(0, Math.min(4, state.zoomLevel - 1))];
  }

  function googleEmbedUrl() {
    var q = encodeURIComponent(state.address.trim());
    return 'https://maps.google.com/maps?q=' + q + '&output=embed&hl=ko&z=' + googleZoom();
  }

  /* ── Render ── */
  function renderWidget() {
    var el = document.getElementById('mapWidget');
    if (!el) return;
    el.style.width  = state.width  + 'px';
    el.style.height = state.height + 'px';

    if (!state.address.trim()) { showPlaceholder(el); return; }

    el.innerHTML =
      '<iframe src="' + esc(googleEmbedUrl()) + '"' +
      ' width="100%" height="100%"' +
      ' style="border:0;display:block;"' +
      ' allowfullscreen="" loading="lazy"' +
      ' referrerpolicy="no-referrer-when-downgrade"></iframe>';
  }

  /* ── 텍스트 ── */
  function renderTitle() {
    var t = document.getElementById('mapTitle');
    if (!t) return;
    t.textContent    = state.title;
    t.hidden         = !state.title;
    t.style.width    = state.width + 'px';
    t.style.fontSize = state.titleSize + 'px';
    t.style.textAlign = state.titleAlign;

    document.querySelectorAll('#mapTitleAlign [data-align]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-align') === state.titleAlign);
    });
  }

  /* ── 보조 텍스트 ── */
  function renderInfo() {
    var box = document.getElementById('mapInfo');
    if (!box) return;
    box.style.width = state.width + 'px';
    box.classList.toggle('map-info--grid', state.infoLayout === 'grid');
    box.classList.toggle('map-info--list', state.infoLayout === 'list');

    box.querySelectorAll('[data-info]').forEach(function (dd) {
      dd.textContent = state.info[dd.getAttribute('data-info')] || '';
    });

    document.querySelectorAll('#mapInfoLayout [data-layout]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-layout') === state.infoLayout);
    });
  }

  function syncInfoInputs() {
    document.querySelectorAll('[data-info-input]').forEach(function (input) {
      input.value = state.info[input.getAttribute('data-info-input')] || '';
    });
    document.getElementById('mapAddressInput').value = state.address;
  }

  /* ── Placeholder ── */
  function showPlaceholder(el) {
    el.innerHTML =
      '<div class="map-placeholder">' +
        '<svg class="map-placeholder__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>' +
        '<p class="map-placeholder__msg">주소를 검색하세요</p>' +
      '</div>';
  }

  /* ── 스타일 적용 ── */
  function applyStyle() {
    var el = document.getElementById('mapWidget');
    if (!el) return;
    el.style.borderRadius = style.borderRadius + 'px';
    el.style.boxShadow = style.shadow
      ? '0 ' + style.shadowY + 'px ' + style.shadowBlur + 'px rgba(0,0,0,' + (style.shadowOpacity / 100).toFixed(2) + ')'
      : 'none';
  }

  /* ── Inspector 섹션 토글 ── */
  function initSectionToggles() {
    document.querySelectorAll('#mapInspector .inspector__sec-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.closest('.inspector__section').classList.toggle('collapsed');
      });
    });
  }

  /* 숫자 입력 공통 처리 */
  function bindNumber(id, min, max, onValue, eventName) {
    document.getElementById(id).addEventListener(eventName || 'input', function () {
      var v = parseInt(this.value, 10);
      if (isNaN(v)) return;
      onValue(Math.max(min, Math.min(max, v)));
    });
  }

  /* ── Init ── */
  function init() {
    if (!document.getElementById('mapWidget')) return;

    initSectionToggles();

    document.getElementById('mapInspectorClose').addEventListener('click', function () {
      document.getElementById('mapInspector').style.display = 'none';
    });

    /* 텍스트 */
    document.getElementById('mapTitleInput').addEventListener('input', function () {
      state.title = this.value.trim();
      renderTitle();
    });
    bindNumber('mapTitleSize', 12, 64, function (v) {
      state.titleSize = v;
      renderTitle();
    });
    document.querySelectorAll('#mapTitleAlign [data-align]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.titleAlign = b.getAttribute('data-align');
        renderTitle();
      });
    });

    /* 보조 텍스트 */
    document.querySelectorAll('[data-info-input]').forEach(function (input) {
      input.addEventListener('input', function () {
        state.info[input.getAttribute('data-info-input')] = input.value;
        renderInfo();
      });
    });
    document.querySelectorAll('#mapInfoLayout [data-layout]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.infoLayout = b.getAttribute('data-layout');
        renderInfo();
      });
    });

    /* 주소 검색 */
    /* 구글맵 검색 (건물·상호명) — 보조 텍스트 주소와는 별개 */
    var searchInput = document.getElementById('mapAddressInput');
    function doSearch() {
      var q = (searchInput.value || '').trim();
      if (!q) return;
      state.address = q;
      renderWidget();
    }
    document.getElementById('mapSearchBtn').addEventListener('click', doSearch);
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') doSearch();
    });

    /* 크기 (iframe은 100%라 컨테이너 크기만 바꾸면 됨) */
    bindNumber('mapWidth', 200, 1400, function (v) {
      state.width = v;
      document.getElementById('mapWidget').style.width = v + 'px';
      renderTitle();
      renderInfo();
    });
    bindNumber('mapHeight', 150, 1000, function (v) {
      state.height = v;
      document.getElementById('mapWidget').style.height = v + 'px';
    });

    /* 확대 레벨 */
    bindNumber('mapZoomLevel', 1, 5, function (v) {
      state.zoomLevel = v;
      if (state.address.trim()) renderWidget();
    }, 'change');

    /* 스타일 */
    bindNumber('mapBorderRadius', 0, 60,  function (v) { style.borderRadius  = v; applyStyle(); });
    bindNumber('mapShadowBlur',   0, 60,  function (v) { style.shadowBlur    = v; applyStyle(); });
    bindNumber('mapShadowY',      0, 40,  function (v) { style.shadowY       = v; applyStyle(); });
    bindNumber('mapShadowOpacity',0, 100, function (v) { style.shadowOpacity = v; applyStyle(); });

    var shadowToggle  = document.getElementById('mapShadowToggle');
    var shadowOptions = document.getElementById('mapShadowOptions');
    shadowToggle.addEventListener('click', function () {
      style.shadow = !style.shadow;
      shadowToggle.classList.toggle('active', style.shadow);
      shadowOptions.style.display = style.shadow ? '' : 'none';
      applyStyle();
    });

    /* 위젯 초기화 */
    document.getElementById('mapReset').addEventListener('click', function () {
      state = clone(DEFAULT_STATE);
      style = Object.assign({}, DEFAULT_STYLE);

      document.getElementById('mapTitleInput').value    = DEFAULT_STATE.title;
      document.getElementById('mapTitleSize').value     = DEFAULT_STATE.titleSize;
      document.getElementById('mapWidth').value         = DEFAULT_STATE.width;
      document.getElementById('mapHeight').value        = DEFAULT_STATE.height;
      document.getElementById('mapZoomLevel').value     = DEFAULT_STATE.zoomLevel;
      document.getElementById('mapBorderRadius').value  = DEFAULT_STYLE.borderRadius;
      document.getElementById('mapShadowBlur').value    = DEFAULT_STYLE.shadowBlur;
      document.getElementById('mapShadowY').value       = DEFAULT_STYLE.shadowY;
      document.getElementById('mapShadowOpacity').value = DEFAULT_STYLE.shadowOpacity;
      shadowToggle.classList.add('active');
      shadowOptions.style.display = '';

      syncInfoInputs();
      renderTitle();
      renderInfo();
      renderWidget();
      applyStyle();
    });

    syncInfoInputs();
    renderTitle();
    renderInfo();
    renderWidget();
    applyStyle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 0);
  }

})();