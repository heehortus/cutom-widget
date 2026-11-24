/* =====================================
   Gallery — Widget List Landing Page
   ===================================== */
(function () {
  'use strict';

  const WIDGETS = [
    { id: 'card',                file: 'list-card',         name: '그라디언트 카드',      category: 'card',    catLabel: '카드',    desc: '마우스 호버 이벤트 그라디언트 카드' },
    { id: 'banner',              file: 'banner-card',       name: '배너 + 카드',          category: 'banner',  catLabel: '배너',    desc: '좌측 이미지 배너 카드' },
    { id: 'faq',                                            name: 'FAQ',                  category: 'faq',     catLabel: 'FAQ',     desc: '아코디언 FAQ' },
    { id: 'dynamic-card',                                   name: '다이나믹 카드',         category: 'card',    catLabel: '카드',    desc: '역동적인 애니메이션의 카드' },
    { id: 'timeline',                                       name: '연혁 타임라인',          category: 'history', catLabel: '히스토리', desc: '스크롤 애니메이션 연혁 타임라인' },
    { id: 'horizon-scroll-card',                            name: '가로 스크롤 카드',      category: 'card',    catLabel: '카드',    desc: '가로 스크롤 카드' },
    { id: 'focus-card',                                     name: '포커스 카드',           category: 'card',    catLabel: '카드',    desc: '이미지 포커스 카드' },
    { id: 'focus-card-2',                                   name: '포커스 카드 2',         category: 'card',    catLabel: '카드',    desc: '확장형 포커스 카드' },
    { id: 'image-faq',                                      name: '이미지 FAQ',            category: 'faq',     catLabel: 'FAQ',     desc: '이미지 + 아코디언 FAQ' },
    { id: 'map',                                            name: '지도',                  category: 'utility', catLabel: '편의성',  desc: '구글맵 / 카카오맵 임베드 위젯' },
    { id: 'value-card',                                     name: 'Value 카드',            category: 'card',    catLabel: '카드',    desc: '이미지 카드 그리드 섹션' },
    { id: 'hero-main-slide',                                name: '히어로 슬라이드',        category: 'hero',    catLabel: '히어로',  desc: '전체 화면 히어로 메인 슬라이드' },
    { id: 'slide-card',                                     name: '슬라이드 카드',         category: 'card',    catLabel: '카드',    desc: '이미지 슬라이드 카드' },
    { id: 'logo-marquee',                                   name: '로고 마퀴',             category: 'history', catLabel: '히스토리', desc: '인피니티 로고 마퀴' },
    { id: 'word-shade',                                     name: '워드 쉐이드',            category: 'effect',  catLabel: '이펙트',  desc: '글자별 호버 딤 텍스트 효과' },
  ];

  const THUMB_HTML = {
    'map': `
      <div class="gthumb gthumb--map">
        <div class="gthumb__map-pin"></div>
      </div>`,
  };

  /* ── Render ── */
  function renderGallery() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    grid.innerHTML = WIDGETS.map(w => {
      const isMap = w.id === 'map';
      const fileName = w.file || w.id;
      const thumbAttr = isMap ? '' : ` data-iframe-src="widgets/${fileName}.html"`;
      const thumbInner = isMap ? THUMB_HTML['map'] : '';
      return `
        <div class="wg-card" data-widget="${w.id}" data-category="${w.category}">
          <div class="wg-card__thumb"${thumbAttr}>${thumbInner}</div>
          <div class="wg-card__meta">
            <span class="wg-card__badge">${w.catLabel}</span>
            <div class="wg-card__name">${w.name}</div>
            <div class="wg-card__desc">${w.desc}</div>
            <button class="wg-card__edit-btn" data-widget="${w.id}" type="button">위젯 사용해보기</button>
          </div>
        </div>
      `;
    }).join('');

    grid.addEventListener('click', e => {
      const btn = e.target.closest('.wg-card__edit-btn');
      if (!btn) return;
      openEditor(btn.dataset.widget);
    });
  }

  /* ── Iframe previews ── */
  const IFRAME_REF_W = 1200;
  const PREVIEW_CSS =
    'aside{display:none!important}' +
    '.app>main{flex:1!important;height:100vh!important;display:flex!important;align-items:center!important;background-image:none!important;overflow:hidden!important}' +
    '*,*::before,*::after{animation:none!important;transition:none!important}';

  function initIframeThumbs() {
    document.querySelectorAll('.wg-card__thumb[data-iframe-src]').forEach(thumb => {
      const iframe = document.createElement('iframe');
      iframe.src = thumb.dataset.iframeSrc;
      iframe.tabIndex = -1;
      iframe.setAttribute('aria-hidden', 'true');
      iframe.style.cssText =
        `position:absolute;top:0;left:0;width:${IFRAME_REF_W}px;border:none;pointer-events:none;`;

      thumb.appendChild(iframe);

      function rescale() {
        const s = thumb.clientWidth / IFRAME_REF_W;
        iframe.style.transform = `scale(${s})`;
        iframe.style.transformOrigin = 'top left';
        iframe.style.height = Math.ceil(192 / s) + 'px';
      }

      iframe.addEventListener('load', () => {
        try {
          const style = iframe.contentDocument.createElement('style');
          style.textContent = PREVIEW_CSS;
          iframe.contentDocument.head.appendChild(style);
        } catch (e) {}
        rescale();
        thumb.classList.add('loaded');
      });

      rescale();

      if (window.ResizeObserver) {
        new ResizeObserver(rescale).observe(thumb);
      }
    });
  }

  /* ── Open editor ── */
  function openEditor(widgetId) {
    document.getElementById('page-gallery').style.display = 'none';
    document.getElementById('page-editor').style.display = '';

    document.querySelectorAll('.widget-nav__item').forEach(item => {
      item.classList.toggle('active', item.dataset.widget === widgetId);
    });
    document.querySelectorAll('.widget-view').forEach(view => {
      view.classList.toggle('active', view.id === `view-${widgetId}`);
    });
  }

  /* ── Tab filtering ── */
  function initTabs() {
    document.querySelectorAll('.gallery-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.gallery-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        filterGallery(tab.dataset.filter);
      });
    });
  }

  function filterGallery(filter) {
    document.querySelectorAll('.wg-card').forEach(card => {
      card.classList.toggle('hidden', filter !== 'all' && card.dataset.category !== filter);
    });
  }

  /* ── Back button (editor → gallery) ── */
  function initBackButton() {
    const btn = document.getElementById('galleryBackBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      document.getElementById('page-editor').style.display = 'none';
      document.getElementById('page-gallery').style.display = '';
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderGallery();
    initTabs();
    initBackButton();
    initIframeThumbs();
  });
})();
