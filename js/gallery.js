/* =====================================
   Gallery — Widget List Landing Page
   ===================================== */
(function () {
  'use strict';

  const WIDGETS = [
    { id: 'card',                name: '그라디언트 카드',           category: 'card',    catLabel: '카드',    desc: '마우스 호버 이벤트 그라디언트 카드' },
    { id: 'banner',              name: '배너 + 카드',           category: 'banner',  catLabel: '배너',    desc: '좌측 이미지 배너 카드' },
    { id: 'faq',                 name: 'FAQ',            category: 'faq',     catLabel: 'FAQ',     desc: '아코디언 FAQ' },
    { id: 'dynamic-card',        name: '다이나믹 카드',   category: 'card',    catLabel: '카드',    desc: '역동적인 애니메이션의 카드' },
    { id: 'timeline',            name: '연혁 타임라인',       category: 'history', catLabel: '연혁',    desc: '스크롤 애니메이션 연혁 타임라인' },
    { id: 'horizon-scroll-card', name: '가로 스크롤 카드', category: 'banner',  catLabel: '배너',    desc: '가로 스크롤 카드' },
    { id: 'focus-card',          name: '포커스 카드',     category: 'card',    catLabel: '카드',    desc: '이미지 포커스 카드' },
    { id: 'focus-card-2',        name: '포커스 카드 2',   category: 'card',    catLabel: '카드',    desc: '확장형 포커스 카드' },
    { id: 'image-faq',           name: '이미지 FAQ',      category: 'faq',     catLabel: 'FAQ',     desc: '이미지 + 아코디언 FAQ' },
  ];

  const THUMB_HTML = {
    'card': `
      <div class="gthumb gthumb--card">
        <div class="gthumb__card"></div>
        <div class="gthumb__card"></div>
        <div class="gthumb__card"></div>
      </div>`,
    'banner': `
      <div class="gthumb gthumb--banner">
        <div class="gthumb__panel"></div>
        <div class="gthumb__side">
          <div class="gthumb__slide"></div>
          <div class="gthumb__slide"></div>
        </div>
      </div>`,
    'faq': `
      <div class="gthumb gthumb--faq">
        <div class="gthumb__row gthumb__row--open">
          <div class="gthumb__row-body"></div>
        </div>
        <div class="gthumb__row"></div>
        <div class="gthumb__row"></div>
        <div class="gthumb__row"></div>
      </div>`,
    'dynamic-card': `
      <div class="gthumb gthumb--dynamic-card">
        <div class="gthumb__card gthumb__card--back2"></div>
        <div class="gthumb__card gthumb__card--back1"></div>
        <div class="gthumb__card gthumb__card--front"></div>
      </div>`,
    'timeline': `
      <div class="gthumb gthumb--timeline">
        <div class="gthumb__line"></div>
        <div class="gthumb__entry"></div>
        <div class="gthumb__entry"></div>
        <div class="gthumb__entry"></div>
        <div class="gthumb__entry"></div>
      </div>`,
    'horizon-scroll-card': `
      <div class="gthumb gthumb--hscroll">
        <div class="gthumb__card gthumb__card--main"></div>
        <div class="gthumb__card gthumb__card--peek"></div>
      </div>`,
    'focus-card': `
      <div class="gthumb gthumb--focus-card">
        <div class="gthumb__card"></div>
        <div class="gthumb__card"></div>
        <div class="gthumb__card"></div>
      </div>`,
    'focus-card-2': `
      <div class="gthumb gthumb--focus-card-2">
        <div class="gthumb__card gthumb__card--wide"></div>
        <div class="gthumb__card"></div>
        <div class="gthumb__card"></div>
      </div>`,
    'image-faq': `
      <div class="gthumb gthumb--image-faq">
        <div class="gthumb__img"></div>
        <div class="gthumb__ac">
          <div class="gthumb__row gthumb__row--open">
            <div class="gthumb__row-body"></div>
          </div>
          <div class="gthumb__row"></div>
          <div class="gthumb__row"></div>
        </div>
      </div>`,
  };

  /* ── Render ── */
  function renderGallery() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    grid.innerHTML = WIDGETS.map(w => `
      <div class="wg-card" data-widget="${w.id}" data-category="${w.category}">
        <div class="wg-card__thumb">${THUMB_HTML[w.id] || ''}</div>
        <div class="wg-card__meta">
          <span class="wg-card__badge">${w.catLabel}</span>
          <div class="wg-card__name">${w.name}</div>
          <div class="wg-card__desc">${w.desc}</div>
          <button class="wg-card__edit-btn" data-widget="${w.id}" type="button">위젯 사용해보기</button>
        </div>
      </div>
    `).join('');

    grid.addEventListener('click', e => {
      const btn = e.target.closest('.wg-card__edit-btn');
      if (!btn) return;
      openEditor(btn.dataset.widget);
    });
  }

  /* ── Open editor ── */
  function openEditor(widgetId) {
    document.getElementById('page-gallery').style.display = 'none';
    document.getElementById('page-editor').style.display = '';

    // Activate the matching widget in the nav + views
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
  });
})();
