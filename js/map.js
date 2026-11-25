/* =====================================
   Map Widget — Google Maps / Kakao Maps
   ===================================== */
(function () {
  'use strict';

  /* ── 상수 ── */
  var ROUGHMAP_CDN = 'https://t1.kakaocdn.net/kakaomapweb/roughmap/loader/prod/roughmapLoader.js';
  var GOOGLE_ZOOM  = [8, 11, 13, 15, 17];

  /* ── State ── */
  var state = {
    provider:    'google',
    address:      '서울특별시청',
    width:        600,
    height:       450,
    zoomLevel:    3,
    kakaoTs:  '',
    kakaoKey: ''
  };

  /* ── Roughmap SDK 로딩 추적 ── */
  var roughmapLoading  = false;
  var roughmapWaiters  = [];

  /* ── 사이즈 변경 디바운스 ── */
  var sizeTimer = null;

  /* ── 스타일 state ── */
  var style = {
    borderRadius: 10,
    shadow:        true,
    shadowBlur:    16,
    shadowY:        2,
    shadowOpacity: 12
  };

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

  /* ══════════════════════════════════════
     Google Maps — iframe embed
  ══════════════════════════════════════ */
  function googleEmbedUrl() {
    var q = encodeURIComponent(state.address);
    var z = googleZoom();
    return 'https://maps.google.com/maps?q=' + q + '&output=embed&hl=ko&z=' + z;
  }

  function renderGoogleMap() {
    var el = document.getElementById('mapWidget');
    if (!el) return;
    el.style.width  = state.width  + 'px';
    el.style.height = state.height + 'px';

    if (!state.address) { showPlaceholder(el, 'address'); return; }

    el.innerHTML =
      '<iframe src="' + esc(googleEmbedUrl()) + '"' +
      ' width="100%" height="100%"' +
      ' style="border:0;display:block;"' +
      ' allowfullscreen="" loading="lazy"' +
      ' referrerpolicy="no-referrer-when-downgrade"></iframe>';
  }

  /* ══════════════════════════════════════
     Kakao Maps — roughmap (API 키 불필요)
  ══════════════════════════════════════ */

  /* Kakao "지도 퍼가기" HTML에서 timestamp / key 파싱 */
  function parseKakaoCode(code) {
    var ts  = code.match(/"timestamp"\s*:\s*"([^"]+)"/);
    var key = code.match(/"key"\s*:\s*"([^"]+)"/);
    if (ts && key) return { timestamp: ts[1], key: key[1] };
    return null;
  }

  /* roughmapLoader 로드 → daum.roughmap.Lander 가 생길 때까지 폴링 */
  function ensureRoughmapLander() {
    if (window.daum && window.daum.roughmap && window.daum.roughmap.Lander) {
      return Promise.resolve();
    }

    return new Promise(function (resolve, reject) {
      roughmapWaiters.push({ resolve: resolve, reject: reject });
      if (roughmapLoading) return; /* 이미 로딩 중이면 대기만 */

      roughmapLoading = true;

      /* 기존 스크립트 제거 */
      var old = document.querySelector('script[data-roughmap-loader]');
      if (old) old.remove();

      var script = document.createElement('script');
      script.setAttribute('data-roughmap-loader', '');
      script.charset = 'UTF-8';
      script.src = ROUGHMAP_CDN;
      document.head.appendChild(script);

      var tries = 0;
      var timer = setInterval(function () {
        if (window.daum && window.daum.roughmap && window.daum.roughmap.Lander) {
          clearInterval(timer);
          roughmapLoading = false;
          roughmapWaiters.forEach(function (w) { w.resolve(); });
          roughmapWaiters = [];
        } else if (++tries > 150) {   /* 15초 타임아웃 */
          clearInterval(timer);
          roughmapLoading = false;
          var e = new Error('roughmap timeout');
          roughmapWaiters.forEach(function (w) { w.reject(e); });
          roughmapWaiters = [];
        }
      }, 100);
    });
  }

  /* 실제 roughmap 렌더링 — SDK 로드 완료 후 호출 */
  function doRenderRoughmap(ts, key, w, h) {
    var container = document.getElementById('mapWidget');
    if (!container) return;

    container.style.width  = w + 'px';
    container.style.height = h + 'px';
    container.innerHTML    = '';   /* 이전 렌더링 완전 제거 */

    var mapDiv = document.createElement('div');
    mapDiv.id = 'daumRoughmapContainer' + ts;
    mapDiv.className = 'root_daum_roughmap root_daum_roughmap_landing';
    container.appendChild(mapDiv);

    try {
      new daum.roughmap.Lander({
        'timestamp': ts,
        'key':       key,
        'mapWidth':  String(w),
        'mapHeight': String(h)
      }).render();
    } catch (e) {
      showPlaceholder(container, 'kakao-error');
    }
  }

  function renderKakaoMap() {
    var el = document.getElementById('mapWidget');
    if (!el) return;
    el.style.width  = state.width  + 'px';
    el.style.height = state.height + 'px';

    if (!state.kakaoTs || !state.kakaoKey) {
      showPlaceholder(el, 'kakao-code');
      return;
    }

    var ts = state.kakaoTs, key = state.kakaoKey, w = state.width, h = state.height;

    /* SDK 이미 로드된 경우 바로 렌더링 */
    if (window.daum && window.daum.roughmap && window.daum.roughmap.Lander) {
      doRenderRoughmap(ts, key, w, h);
      return;
    }

    /* SDK 로드 필요 */
    showPlaceholder(el, 'loading');

    ensureRoughmapLander()
      .then(function () { doRenderRoughmap(ts, key, w, h); })
      .catch(function () {
        var c = document.getElementById('mapWidget');
        if (c) showPlaceholder(c, 'kakao-error');
      });
  }

  /* ══════════════════════════════════════
     Placeholder
  ══════════════════════════════════════ */
  var PH = {
    'address': {
      icon: mapPinSVG(),
      msg: '주소를 검색하세요'
    },
    'kakao-code': {
      icon: pasteSVG(),
      msg: 'map.kakao.com → 장소 검색\n→ 공유 → HTML 태그 복사 → 소스 생성하기\n코드를 붙여넣고 적용하세요'
    },
    'loading': {
      icon: spinnerSVG(),
      msg: '지도를 불러오는 중…'
    },
    'not-found': {
      icon: mapPinSVG(),
      msg: '주소를 찾을 수 없습니다'
    },
    'kakao-error': {
      icon: warnSVG(),
      msg: 'timestamp / key가 올바르지 않습니다'
    },
    'kakao-parse-error': {
      icon: warnSVG(),
      msg: '코드에서 timestamp / key를 찾을 수 없습니다\n카카오맵 "HTML 태그 복사" 전체를 붙여넣으세요'
    }
  };

  function showPlaceholder(el, type) {
    var p = PH[type] || PH['loading'];
    el.innerHTML =
      '<div class="map-placeholder">' +
        p.icon +
        '<p class="map-placeholder__msg">' + esc(p.msg) + '</p>' +
      '</div>';
  }

  function mapPinSVG() {
    return '<svg class="map-placeholder__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>';
  }
  function pasteSVG() {
    return '<svg class="map-placeholder__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-3"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>';
  }
  function spinnerSVG() {
    return '<svg class="map-placeholder__icon map-placeholder__icon--spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2a10 10 0 0 1 10 10"/></svg>';
  }
  function warnSVG() {
    return '<svg class="map-placeholder__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
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

  /* ── Main render ── */
  function renderWidget() {
    if (state.provider === 'google') renderGoogleMap();
    else                             renderKakaoMap();
  }

  /* ── Provider UI / 섹션 가시성 ── */
  function updateProviderUI() {
    var gBtn = document.getElementById('mapProviderGoogle');
    var kBtn = document.getElementById('mapProviderKakao');
    if (!gBtn || !kBtn) return;

    var isGoogle = state.provider === 'google';
    gBtn.classList.toggle('active', isGoogle);
    kBtn.classList.toggle('active', !isGoogle);

    var addrSec = document.getElementById('mapAddressSection');
    var kakaoSec = document.getElementById('mapKakaoSection');

    if (addrSec)  addrSec.style.display  = isGoogle ? '' : 'none';
    if (kakaoSec) kakaoSec.style.display = isGoogle ? 'none' : '';
  }

  /* ── Inspector 섹션 토글 ── */
  function initSectionToggles() {
    document.querySelectorAll('#mapInspector .inspector__sec-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.closest('.inspector__section').classList.toggle('collapsed');
      });
    });
  }

  /* ── Init ── */
  function init() {
    if (!document.getElementById('mapWidget')) return;

    initSectionToggles();

    document.getElementById('mapInspectorClose').addEventListener('click', function () {
      document.getElementById('mapInspector').style.display = 'none';
    });

    /* Provider 토글 */
    document.getElementById('mapProviderGoogle').addEventListener('click', function () {
      state.provider = 'google';
      updateProviderUI();
      renderWidget();
    });
    document.getElementById('mapProviderKakao').addEventListener('click', function () {
      state.provider = 'kakao';
      updateProviderUI();
      renderWidget();
    });


    /* 구글맵 주소 검색 */
    function doSearch() {
      var addr = (document.getElementById('mapAddressInput').value || '').trim();
      if (!addr) return;
      state.address = addr;
      renderWidget();
    }
    document.getElementById('mapSearchBtn').addEventListener('click', doSearch);
    document.getElementById('mapAddressInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') doSearch();
    });

    /* 카카오맵 코드 붙여넣기 적용 */
    document.getElementById('mapKakaoCodeApply').addEventListener('click', function () {
      var code   = (document.getElementById('mapKakaoCode').value || '').trim();
      var status = document.getElementById('mapKakaoStatus');

      if (!code) {
        if (status) status.textContent = '코드를 붙여넣어 주세요.';
        return;
      }

      var parsed = parseKakaoCode(code);
      if (!parsed) {
        if (status) status.textContent = 'timestamp / key를 찾을 수 없습니다.';
        var el = document.getElementById('mapWidget');
        if (el) showPlaceholder(el, 'kakao-parse-error');
        return;
      }

      state.kakaoTs  = parsed.timestamp;
      state.kakaoKey = parsed.key;
      if (status) status.textContent = '';
      renderWidget();
    });

    /* 가로 크기 */
    document.getElementById('mapWidth').addEventListener('input', function () {
      var v = parseInt(this.value, 10);
      if (isNaN(v)) return;
      state.width = Math.max(200, Math.min(1400, v));

      if (state.provider === 'kakao' && state.kakaoTs) {
        /* 카카오 roughmap: 300ms 디바운스 후 재렌더링 */
        clearTimeout(sizeTimer);
        sizeTimer = setTimeout(renderWidget, 300);
      } else {
        var el = document.getElementById('mapWidget');
        if (el) el.style.width = state.width + 'px';
      }
    });

    /* 세로 크기 */
    document.getElementById('mapHeight').addEventListener('input', function () {
      var v = parseInt(this.value, 10);
      if (isNaN(v)) return;
      state.height = Math.max(150, Math.min(1000, v));

      if (state.provider === 'kakao' && state.kakaoTs) {
        clearTimeout(sizeTimer);
        sizeTimer = setTimeout(renderWidget, 300);
      } else {
        var el = document.getElementById('mapWidget');
        if (el) el.style.height = state.height + 'px';
      }
    });

    /* 확대 레벨 (구글맵) */
    document.getElementById('mapZoomLevel').addEventListener('change', function () {
      var v = parseInt(this.value, 10);
      if (isNaN(v)) return;
      state.zoomLevel = Math.max(1, Math.min(5, v));
      if (state.provider === 'google' && state.address) renderWidget();
    });

    /* 위젯 초기화 */
    document.getElementById('mapReset').addEventListener('click', function () {
      state = {
        provider:  'google',
        address:   '서울특별시청',
        width:     600,
        height:    450,
        zoomLevel: 3,
        kakaoTs:   '',
        kakaoKey:  ''
      };
      style = {
        borderRadius: 10,
        shadow:        true,
        shadowBlur:    16,
        shadowY:        2,
        shadowOpacity: 12
      };

      /* 인스펙터 inputs 동기화 */
      updateProviderUI();
      document.getElementById('mapAddressInput').value  = '서울특별시청';
      document.getElementById('mapKakaoCode').value     = '';
      var kakaoStatus = document.getElementById('mapKakaoStatus');
      if (kakaoStatus) kakaoStatus.textContent = '';
      document.getElementById('mapWidth').value         = 600;
      document.getElementById('mapHeight').value        = 450;
      document.getElementById('mapZoomLevel').value     = 3;
      document.getElementById('mapBorderRadius').value  = 10;
      document.getElementById('mapShadowBlur').value    = 16;
      document.getElementById('mapShadowY').value       = 2;
      document.getElementById('mapShadowOpacity').value = 12;
      var shadowToggle  = document.getElementById('mapShadowToggle');
      var shadowOptions = document.getElementById('mapShadowOptions');
      shadowToggle.classList.add('active');
      shadowOptions.style.display = '';

      var el = document.getElementById('mapWidget');
      if (el) el.innerHTML = '';
      renderWidget();
    });

    /* 모서리 둥글기 */
    document.getElementById('mapBorderRadius').addEventListener('input', function () {
      var v = parseInt(this.value, 10);
      if (isNaN(v)) return;
      style.borderRadius = Math.max(0, Math.min(60, v));
      applyStyle();
    });

    /* 그림자 토글 */
    var shadowToggle = document.getElementById('mapShadowToggle');
    var shadowOptions = document.getElementById('mapShadowOptions');
    shadowToggle.addEventListener('click', function () {
      style.shadow = !style.shadow;
      shadowToggle.classList.toggle('active', style.shadow);
      shadowOptions.style.display = style.shadow ? '' : 'none';
      applyStyle();
    });

    /* 그림자 번짐 */
    document.getElementById('mapShadowBlur').addEventListener('input', function () {
      var v = parseInt(this.value, 10);
      if (isNaN(v)) return;
      style.shadowBlur = Math.max(0, Math.min(60, v));
      applyStyle();
    });

    /* 그림자 Y 거리 */
    document.getElementById('mapShadowY').addEventListener('input', function () {
      var v = parseInt(this.value, 10);
      if (isNaN(v)) return;
      style.shadowY = Math.max(0, Math.min(40, v));
      applyStyle();
    });

    /* 그림자 불투명도 */
    document.getElementById('mapShadowOpacity').addEventListener('input', function () {
      var v = parseInt(this.value, 10);
      if (isNaN(v)) return;
      style.shadowOpacity = Math.max(0, Math.min(100, v));
      applyStyle();
    });

    updateProviderUI();
    renderWidget();
    applyStyle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 0);
  }

})();
