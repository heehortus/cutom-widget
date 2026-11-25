/* =====================================
   Timeline Widget — Controller
   ===================================== */

(function () {
  'use strict';

  /* ── State ── */
  var nextGroupId = 6;
  var nextItemId  = 20;

  var groups = [
    {
      id: 1,
      era: '2000 - 현재',
      heading: '일상을 작은 변화로\n한 걸음씩, 더 단단하게',
      expanded: false,
      items: [
        { id: 1, year: '2025', text: '지역 거점 통합 운영센터 개관 및 신규 복합문화공간 3개소 위탁 운영 시작' },
        { id: 2, year: '2024', text: '스마트 돌봄 플랫폼 정식 출범 및 전국 단위 협력 네트워크 구축' },
        { id: 3, year: '2023', text: '제2 연구개발센터 준공' },
        { id: 4, year: '2022', text: '누적 이용자 100만 명 돌파 및 우수 운영기관 인증 획득' }
      ]
    },
    {
      id: 2,
      era: '1990년대',
      heading: '작은 시작,\n큰 가능성을 향해',
      expanded: false,
      items: [
        { id: 5, year: '1998', text: '창립 기념 통합 브랜드 리뉴얼' },
        { id: 6, year: '1995', text: '복지서비스 전국 네트워크 출범' }
      ]
    },
    {
      id: 3,
      era: '1980년대',
      heading: '뿌리를 내리다,\n첫 걸음의 시작',
      expanded: false,
      items: [
        { id: 7, year: '1988', text: '지역사회 복지 프로그램 첫 운영 개시' },
        { id: 8, year: '1985', text: '비영리 법인 설립 및 초대 이사회 구성' },
        { id: 9, year: '1982', text: '창립' }
      ]
    },
    {
      id: 4,
      era: '1970년대',
      heading: '씨앗을 심다,\n공동체의 꿈',
      expanded: false,
      items: [
        { id: 10, year: '1978', text: '지역 주민 자치 모임 공식 결성' },
        { id: 11, year: '1975', text: '공동체 활동 거점 공간 마련' },
        { id: 12, year: '1971', text: '자원봉사 그룹 첫 활동 시작' }
      ]
    },
    {
      id: 5,
      era: '1960년대',
      heading: '처음 마음,\n변화를 꿈꾸다',
      expanded: false,
      items: [
        { id: 13, year: '1969', text: '창립 준비위원회 발족' },
        { id: 14, year: '1965', text: '지역 복지 필요성 연구 및 기초 조사' },
        { id: 15, year: '1961', text: '설립 발기인 모임 첫 개최' }
      ]
    }
  ];

  var style = {
    trackInactive:  '#e0e0e0',
    trackActive:    '#555555',
    bulletSize:     10,
    eraSize:        14,
    eraHex:         '#555555',
    eraOpacity:     100,
    headingSize:    32,
    headingHex:     '#1a1a1a',
    headingOpacity: 100,
    yearSize:       18,
    yearHex:        '#1a1a1a',
    yearOpacity:    100,
    textSize:       16,
    textHex:        '#6b7280',
    textOpacity:    100,
    groupGap:       60
  };

  var LINE_DURATION  = 1000;

  var dragSrcGroupId = null;
  var dragSrcItemId  = null;

  /* ── Detail panel ── */
  var currentDetailGroup = null;
  var currentDetailItem  = null;
  var itemDetailEl       = null;

  /* ── DOM refs ── */
  var widget    = document.getElementById('timelineWidget');
  var groupList = document.getElementById('timelineGroupList');
  var canvas    = null;
  var observer  = null;

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

  /* ── Apply style vars ── */
  function applyStyle() {
    var eraColor     = hexToRgba(style.eraHex,     style.eraOpacity)     || style.eraHex;
    var headingColor = hexToRgba(style.headingHex, style.headingOpacity) || style.headingHex;
    var yearColor    = hexToRgba(style.yearHex,    style.yearOpacity)    || style.yearHex;
    var textColor    = hexToRgba(style.textHex,    style.textOpacity)    || style.textHex;

    widget.style.setProperty('--tl-group-gap',       style.groupGap     + 'px');
    widget.style.setProperty('--tl-track-inactive', style.trackInactive);
    widget.style.setProperty('--tl-track-active',   style.trackActive);
    widget.style.setProperty('--tl-bullet-size',    style.bulletSize   + 'px');
    widget.style.setProperty('--tl-era-size',       style.eraSize      + 'px');
    widget.style.setProperty('--tl-era-color',      eraColor);
    widget.style.setProperty('--tl-heading-size',   style.headingSize  + 'px');
    widget.style.setProperty('--tl-heading-color',  headingColor);
    widget.style.setProperty('--tl-year-size',      style.yearSize     + 'px');
    widget.style.setProperty('--tl-year-color',     yearColor);
    widget.style.setProperty('--tl-text-size',      style.textSize     + 'px');
    widget.style.setProperty('--tl-text-color',     textColor);

    document.getElementById('tlEraSwatchWrap').style.background     = eraColor;
    document.getElementById('tlHeadingSwatchWrap').style.background = headingColor;
    document.getElementById('tlYearSwatchWrap').style.background    = yearColor;
    document.getElementById('tlTextSwatchWrap').style.background    = textColor;
  }

  /* ── Render widget ── */
  function renderWidget() {
    if (observer) { observer.disconnect(); observer = null; }
    widget.innerHTML = '';

    groups.forEach(function (group) {
      var groupEl = document.createElement('div');
      groupEl.className = 'timeline-group';
      groupEl.dataset.id = group.id;

      var html =
        '<div class="timeline-group__left">' +
          '<span class="timeline-group__era">' + esc(group.era) + '</span>' +
          '<h2 class="timeline-group__heading">' + esc(group.heading).replace(/\n/g, '<br>') + '</h2>' +
        '</div>' +
        '<div class="timeline-group__right">' +
          '<div class="timeline-track">';

      group.items.forEach(function (item) {
        html +=
          '<div class="timeline-item" data-id="' + item.id + '">' +
            '<div class="timeline-item__year">' + esc(item.year) + '</div>' +
            '<div class="timeline-item__node"><div class="timeline-item__bullet"></div></div>' +
            '<div class="timeline-item__content">' + esc(item.text) + '</div>' +
          '</div>';
      });

      html += '</div></div>';
      groupEl.innerHTML = html;
      widget.appendChild(groupEl);
    });

    applyStyle();
    setTimeout(setupObserver, 50);
  }

  /* ── 아이템 활성화 + 다음 아이템 체인 ── */
  function activateItem(itemEl) {
    if (itemEl.classList.contains('timeline-item--active')) return;
    itemEl.classList.add('timeline-item--active');

    var bullet = itemEl.querySelector('.timeline-item__bullet');
    bullet.classList.add('timeline-item__bullet--pop');
    setTimeout(function () { bullet.classList.remove('timeline-item__bullet--pop'); }, 600);

    var next = itemEl.nextElementSibling;
    if (next && next.classList.contains('timeline-item')) {
      setTimeout(function () { activateItem(next); }, LINE_DURATION);
    }
  }

  function hasPrecedingActive(itemEl) {
    var prev = itemEl.previousElementSibling;
    while (prev && prev.classList.contains('timeline-item')) {
      if (prev.classList.contains('timeline-item--active')) return true;
      prev = prev.previousElementSibling;
    }
    return false;
  }

  /* ── IntersectionObserver for scroll animation ── */
  function setupObserver() {
    if (!canvas) canvas = document.querySelector('.editor__canvas--timeline');
    if (!canvas) return;

    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var itemEl = entry.target;
        if (itemEl.classList.contains('timeline-item--active')) return;
        if (hasPrecedingActive(itemEl)) return;
        activateItem(itemEl);
      });
    }, { root: canvas, threshold: 0.1 });

    widget.querySelectorAll('.timeline-item').forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ── Shared SVG strings ── */
  var DRAG_SVG =
    '<svg viewBox="0 0 8 14" fill="currentColor" width="8" height="14" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="2" cy="2" r="1.2"/><circle cx="6" cy="2" r="1.2"/>' +
      '<circle cx="2" cy="7" r="1.2"/><circle cx="6" cy="7" r="1.2"/>' +
      '<circle cx="2" cy="12" r="1.2"/><circle cx="6" cy="12" r="1.2"/>' +
    '</svg>';

  var DELETE_SVG =
    '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"' +
      ' stroke-linecap="round" stroke-linejoin="round">' +
      '<polyline points="1,3 13,3"/>' +
      '<path d="M4,3V2.5A.5.5,0,0,1,4.5,2h5A.5.5,0,0,1,10,2.5V3"/>' +
      '<rect x="2" y="3" width="10" height="9" rx="1"/>' +
      '<line x1="5" y1="6" x2="5" y2="10"/>' +
      '<line x1="9" y1="6" x2="9" y2="10"/>' +
    '</svg>';

  var CHEVRON_SVG =
    '<svg class="inspector__faq-chevron" viewBox="0 0 16 16" fill="none"' +
      ' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' +
      ' width="14" height="14"><polyline points="4,6 8,10 12,6"/></svg>';

  var ARROW_SVG =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"' +
    ' stroke-linecap="round" stroke-linejoin="round" width="12" height="12">' +
    '<polyline points="6,3 10,8 6,13"/></svg>';

  /* ── Item detail panel ── */
  function createItemDetailPanel() {
    var inspectorEl = document.getElementById('timelineInspector');
    var panel = document.createElement('div');
    panel.className = 'inspector__detail';
    panel.innerHTML =
      '<div class="inspector__detail-head">' +
        '<button class="inspector__detail-back" type="button">' +
          '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"' +
          ' stroke-linecap="round" stroke-linejoin="round" width="11" height="11">' +
          '<polyline points="10,3 4,8 10,13"/></svg>' +
          '타임라인 아이템' +
        '</button>' +
        '<button class="inspector__detail-close" type="button">&#x2715;</button>' +
      '</div>' +
      '<div class="inspector__detail-body" id="tlItemDetailBody"></div>';
    inspectorEl.appendChild(panel);

    panel.querySelector('.inspector__detail-back').addEventListener('click', function () {
      panel.classList.remove('open');
      currentDetailGroup = null;
      currentDetailItem = null;
    });
    panel.querySelector('.inspector__detail-close').addEventListener('click', function () {
      panel.classList.remove('open');
      currentDetailGroup = null;
      currentDetailItem = null;
      var closeBtn = inspectorEl.querySelector('.inspector__close');
      if (closeBtn) closeBtn.click();
    });

    return panel;
  }

  function renderItemDetailBody(bodyEl, group, item) {
    bodyEl.innerHTML = '';

    /* 년도 */
    var yearField = document.createElement('div');
    yearField.className = 'inspector__field';
    yearField.innerHTML =
      '<label class="inspector__field-label">년도</label>' +
      '<input class="inspector__card-name-input" type="text"' +
      ' value="' + escAttr(item.year) + '" placeholder="년도" style="width:100%">';
    yearField.querySelector('input').addEventListener('input', function (e) {
      item.year = e.target.value;
      var el = widget.querySelector('.timeline-item[data-id="' + item.id + '"] .timeline-item__year');
      if (el) el.textContent = item.year;
      var rowEl = groupList.querySelector('.inspector__item-row[data-id="' + item.id + '"] .inspector__item-name');
      if (rowEl) rowEl.textContent = item.year || '새 항목';
    });
    bodyEl.appendChild(yearField);

    /* 내용 */
    var textField = document.createElement('div');
    textField.className = 'inspector__field';
    textField.innerHTML =
      '<label class="inspector__field-label">내용</label>' +
      '<textarea class="inspector__card-role-input" placeholder="내용" rows="3"' +
      ' style="width:100%;resize:vertical">' + esc(item.text) + '</textarea>';
    textField.querySelector('textarea').addEventListener('input', function (e) {
      item.text = e.target.value;
      var el = widget.querySelector('.timeline-item[data-id="' + item.id + '"] .timeline-item__content');
      if (el) el.textContent = item.text;
    });
    bodyEl.appendChild(textField);

    /* 삭제 */
    var deleteWrap = document.createElement('div');
    deleteWrap.style.marginTop = '8px';
    deleteWrap.innerHTML =
      '<button class="inspector__delete-btn" type="button">' + DELETE_SVG + '아이템 삭제</button>';
    deleteWrap.querySelector('button').addEventListener('click', function () {
      if (group.items.length <= 1) return;
      itemDetailEl.classList.remove('open');
      currentDetailGroup = null;
      currentDetailItem = null;
      group.items = group.items.filter(function (it) { return it.id !== item.id; });
      renderWidget();
      renderInspectorGroups();
    });
    bodyEl.appendChild(deleteWrap);
  }

  function openItemDetail(group, item) {
    currentDetailGroup = group;
    currentDetailItem = item;
    var bodyEl = itemDetailEl.querySelector('#tlItemDetailBody');
    renderItemDetailBody(bodyEl, group, item);
    itemDetailEl.classList.add('open');
  }

  /* ── Render inspector groups ── */
  function renderInspectorGroups() {
    groupList.innerHTML = '';

    groups.forEach(function (group) {
      var groupEl = document.createElement('div');
      groupEl.className = 'tl-inspector-group' + (group.expanded ? ' tl-inspector-group--open' : '');
      groupEl.dataset.id = group.id;

      groupEl.innerHTML =
        '<div class="tl-inspector-group__head">' +
          '<button class="inspector__faq-toggle tl-group-toggle" type="button">' + CHEVRON_SVG + '</button>' +
          '<span class="tl-inspector-group__label">' + esc(group.era) + '</span>' +
          '<button class="tl-inspector-group__del" type="button" aria-label="그룹 삭제">' + DELETE_SVG + '</button>' +
        '</div>' +
        '<div class="tl-inspector-group__body">' +
          '<div class="tl-inspector-group__body-inner">' +
            '<div class="inspector__field">' +
              '<label class="inspector__field-label">Era 라벨</label>' +
              '<input class="inspector__text-input tl-era-input" type="text" value="' + escAttr(group.era) + '">' +
            '</div>' +
            '<div class="inspector__field">' +
              '<label class="inspector__field-label">제목</label>' +
              '<textarea class="inspector__text-input tl-heading-input" rows="2">' + esc(group.heading) + '</textarea>' +
            '</div>' +
            '<div class="tl-inspector-items">' +
              '<div class="tl-inspector-items__head">' +
                '<span class="inspector__field-label" style="font-weight:600;color:#495057">아이템</span>' +
                '<button class="inspector__sec-add tl-add-item" type="button">+ 추가</button>' +
              '</div>' +
              '<div class="tl-item-list" id="tl-items-' + group.id + '"></div>' +
            '</div>' +
          '</div>' +
        '</div>';

      /* Toggle group expand */
      groupEl.querySelector('.tl-group-toggle').addEventListener('click', function () {
        group.expanded = !group.expanded;
        groupEl.classList.toggle('tl-inspector-group--open', group.expanded);
      });

      /* Era label */
      groupEl.querySelector('.tl-era-input').addEventListener('input', function (e) {
        group.era = e.target.value;
        var el = widget.querySelector('.timeline-group[data-id="' + group.id + '"] .timeline-group__era');
        if (el) el.textContent = group.era;
        groupEl.querySelector('.tl-inspector-group__label').textContent = group.era;
      });

      /* Heading */
      groupEl.querySelector('.tl-heading-input').addEventListener('input', function (e) {
        group.heading = e.target.value;
        var el = widget.querySelector('.timeline-group[data-id="' + group.id + '"] .timeline-group__heading');
        if (el) el.innerHTML = esc(group.heading).replace(/\n/g, '<br>');
      });

      /* Delete group */
      groupEl.querySelector('.tl-inspector-group__del').addEventListener('click', function () {
        if (groups.length <= 1) return;
        groups = groups.filter(function (g) { return g.id !== group.id; });
        renderWidget();
        renderInspectorGroups();
      });

      /* Add item */
      groupEl.querySelector('.tl-add-item').addEventListener('click', function () {
        var id = nextItemId++;
        var newItem = { id: id, year: String(new Date().getFullYear()), text: '새 항목을 입력하세요.' };
        group.items.push(newItem);
        renderWidget();
        renderInspectorGroups();
        openItemDetail(group, newItem);
      });

      /* Render items */
      var itemListEl = groupEl.querySelector('#tl-items-' + group.id);
      renderInspectorItems(group, itemListEl);

      groupList.appendChild(groupEl);
    });
  }

  /* ── Render inspector items for a group ── */
  function renderInspectorItems(group, container) {
    group.items.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'inspector__item-row';
      row.dataset.id = item.id;
      row.innerHTML =
        '<span class="inspector__drag">' + DRAG_SVG + '</span>' +
        '<span class="inspector__item-name">' + esc(item.year || '새 항목') + '</span>' +
        '<span class="inspector__item-arrow">' + ARROW_SVG + '</span>';

      row.addEventListener('click', function (e) {
        if (e.target.closest('.inspector__drag')) return;
        openItemDetail(group, item);
      });

      setupItemDragDrop(row, item, group);
      container.appendChild(row);
    });
  }

  /* ── Item drag & drop (within group) ── */
  function setupItemDragDrop(row, item, group) {
    var handle = row.querySelector('.inspector__drag');

    handle.addEventListener('mousedown', function () {
      row.setAttribute('draggable', 'true');
    });

    row.addEventListener('dragstart', function (e) {
      dragSrcGroupId = group.id;
      dragSrcItemId  = item.id;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(function () { row.classList.add('dragging'); }, 0);
    });

    row.addEventListener('dragend', function () {
      row.setAttribute('draggable', 'false');
      row.classList.remove('dragging');
      clearDragIndicators();
      dragSrcGroupId = null;
      dragSrcItemId  = null;
    });

    row.addEventListener('dragover', function (e) {
      e.preventDefault();
      if (dragSrcItemId === item.id) return;
      clearDragIndicators();
      var mid = row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2;
      row.classList.add(e.clientY < mid ? 'drag-over-top' : 'drag-over-bottom');
    });

    row.addEventListener('drop', function (e) {
      e.preventDefault();
      if (dragSrcItemId === null || dragSrcItemId === item.id) return;
      if (dragSrcGroupId !== group.id) return;

      var mid    = row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2;
      var before = e.clientY < mid;
      var srcIdx = group.items.findIndex(function (it) { return it.id === dragSrcItemId; });
      var moved  = group.items.splice(srcIdx, 1)[0];
      var dstIdx = group.items.findIndex(function (it) { return it.id === item.id; });
      group.items.splice(before ? dstIdx : dstIdx + 1, 0, moved);

      renderWidget();
      renderInspectorGroups();
    });
  }

  function clearDragIndicators() {
    groupList.querySelectorAll('.inspector__item-row').forEach(function (r) {
      r.classList.remove('drag-over-top', 'drag-over-bottom');
    });
  }

  /* ── Add Group ── */
  document.getElementById('addTimelineGroup').addEventListener('click', function () {
    var id = nextGroupId++;
    groups.push({
      id: id,
      era: '새 시대',
      heading: '제목을 입력하세요',
      expanded: false,
      items: [{ id: nextItemId++, year: String(new Date().getFullYear()), text: '새 항목을 입력하세요.' }]
    });
    renderWidget();
    renderInspectorGroups();
  });

  /* ── Style controls: color ── */
  function bindColorControl(pickerId, hexId, opId, hexKey, opKey) {
    var picker = document.getElementById(pickerId);
    var hexEl  = document.getElementById(hexId);
    var opEl   = opId ? document.getElementById(opId) : null;

    picker.addEventListener('input', function () {
      style[hexKey] = picker.value.toUpperCase();
      hexEl.value   = style[hexKey];
      applyStyle();
    });

    hexEl.addEventListener('input', function () {
      var v = hexEl.value;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        style[hexKey] = v.toUpperCase();
        picker.value  = v;
        applyStyle();
      }
    });

    if (opEl) {
      opEl.addEventListener('input', function () {
        style[opKey] = clamp(opEl.value, 0, 100);
        applyStyle();
      });
    }
  }

  function bindTrackColor(pickerId, hexId, cssVar, stateKey, swatchId) {
    var picker = document.getElementById(pickerId);
    var hexEl  = document.getElementById(hexId);

    picker.addEventListener('input', function () {
      style[stateKey] = picker.value.toUpperCase();
      hexEl.value = style[stateKey];
      document.getElementById(swatchId).style.background = style[stateKey];
      widget.style.setProperty(cssVar, style[stateKey]);
    });

    hexEl.addEventListener('input', function () {
      var v = hexEl.value;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        style[stateKey] = v.toUpperCase();
        picker.value    = v;
        document.getElementById(swatchId).style.background = style[stateKey];
        widget.style.setProperty(cssVar, style[stateKey]);
      }
    });
  }

  function bindSizeControl(inputId, stateKey, min, max, cssVar) {
    document.getElementById(inputId).addEventListener('input', function (e) {
      style[stateKey] = clamp(e.target.value, min, max);
      widget.style.setProperty(cssVar, style[stateKey] + 'px');
    });
  }

  bindColorControl('tlEraPicker',     'tlEraHex',     'tlEraOpacity',     'eraHex',     'eraOpacity');
  bindColorControl('tlHeadingPicker', 'tlHeadingHex', 'tlHeadingOpacity', 'headingHex', 'headingOpacity');
  bindColorControl('tlYearPicker',    'tlYearHex',    'tlYearOpacity',    'yearHex',    'yearOpacity');
  bindColorControl('tlTextPicker',    'tlTextHex',    'tlTextOpacity',    'textHex',    'textOpacity');

  bindTrackColor('tlTrackInactivePicker', 'tlTrackInactiveHex', '--tl-track-inactive', 'trackInactive', 'tlTrackInactiveSwatchWrap');
  bindTrackColor('tlTrackActivePicker',   'tlTrackActiveHex',   '--tl-track-active',   'trackActive',   'tlTrackActiveSwatchWrap');

  bindSizeControl('tlEraSize',     'eraSize',     8,  40, '--tl-era-size');
  bindSizeControl('tlHeadingSize', 'headingSize', 16, 80, '--tl-heading-size');
  bindSizeControl('tlYearSize',    'yearSize',    10, 48, '--tl-year-size');
  bindSizeControl('tlTextSize',    'textSize',    10, 40, '--tl-text-size');

  document.getElementById('tlBulletSize').addEventListener('input', function (e) {
    style.bulletSize = clamp(e.target.value, 4, 24);
    widget.style.setProperty('--tl-bullet-size', style.bulletSize + 'px');
  });

  document.getElementById('tlGroupGap').addEventListener('input', function (e) {
    style.groupGap = clamp(e.target.value, 0, 200);
    widget.style.setProperty('--tl-group-gap', style.groupGap + 'px');
  });

  /* ── Section collapse ── */
  document.getElementById('timelineInspector').querySelectorAll('.inspector__sec-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.closest('.inspector__section').classList.toggle('collapsed');
    });
  });

  /* ── Inspector close ── */
  document.getElementById('timelineInspectorClose').addEventListener('click', function () {
    document.getElementById('timelineInspector').style.display = 'none';
  });

  /* ── Reset ── */

  function resetAll() {
    if (itemDetailEl) itemDetailEl.classList.remove('open');

    nextGroupId = 6;
    nextItemId  = 20;
    groups = [
      {
        id: 1,
        era: '2000 - 현재',
        heading: '일상을 작은 변화로\n한 걸음씩, 더 단단하게',
        expanded: false,
        items: [
          { id: 1, year: '2025', text: '지역 거점 통합 운영센터 개관 및 신규 복합문화공간 3개소 위탁 운영 시작' },
          { id: 2, year: '2024', text: '스마트 돌봄 플랫폼 정식 출범 및 전국 단위 협력 네트워크 구축' },
          { id: 3, year: '2023', text: '제2 연구개발센터 준공' },
          { id: 4, year: '2022', text: '누적 이용자 100만 명 돌파 및 우수 운영기관 인증 획득' }
        ]
      },
      {
        id: 2,
        era: '1990년대',
        heading: '작은 시작,\n큰 가능성을 향해',
        expanded: false,
        items: [
          { id: 5, year: '1998', text: '창립 기념 통합 브랜드 리뉴얼' },
          { id: 6, year: '1995', text: '복지서비스 전국 네트워크 출범' }
        ]
      },
      {
        id: 3,
        era: '1980년대',
        heading: '뿌리를 내리다,\n첫 걸음의 시작',
        expanded: false,
        items: [
          { id: 7, year: '1988', text: '지역사회 복지 프로그램 첫 운영 개시' },
          { id: 8, year: '1985', text: '비영리 법인 설립 및 초대 이사회 구성' },
          { id: 9, year: '1982', text: '창립' }
        ]
      },
      {
        id: 4,
        era: '1970년대',
        heading: '씨앗을 심다,\n공동체의 꿈',
        expanded: false,
        items: [
          { id: 10, year: '1978', text: '지역 주민 자치 모임 공식 결성' },
          { id: 11, year: '1975', text: '공동체 활동 거점 공간 마련' },
          { id: 12, year: '1971', text: '자원봉사 그룹 첫 활동 시작' }
        ]
      },
      {
        id: 5,
        era: '1960년대',
        heading: '처음 마음,\n변화를 꿈꾸다',
        expanded: false,
        items: [
          { id: 13, year: '1969', text: '창립 준비위원회 발족' },
          { id: 14, year: '1965', text: '지역 복지 필요성 연구 및 기초 조사' },
          { id: 15, year: '1961', text: '설립 발기인 모임 첫 개최' }
        ]
      }
    ];
    style = {
      trackInactive:  '#e0e0e0',
      trackActive:    '#555555',
      bulletSize:     10,
      eraSize:        14,
      eraHex:         '#555555',
      eraOpacity:     100,
      headingSize:    32,
      headingHex:     '#1a1a1a',
      headingOpacity: 100,
      yearSize:       18,
      yearHex:        '#1a1a1a',
      yearOpacity:    100,
      textSize:       16,
      textHex:        '#6b7280',
      textOpacity:    100,
      groupGap:       60
    };

    /* 인스펙터 inputs 동기화 */
    document.getElementById('tlEraSize').value             = 14;
    document.getElementById('tlEraPicker').value           = '#555555';
    document.getElementById('tlEraHex').value              = '#555555';
    document.getElementById('tlEraOpacity').value          = 100;
    document.getElementById('tlHeadingSize').value         = 32;
    document.getElementById('tlHeadingPicker').value       = '#1a1a1a';
    document.getElementById('tlHeadingHex').value          = '#1A1A1A';
    document.getElementById('tlHeadingOpacity').value      = 100;
    document.getElementById('tlYearSize').value            = 18;
    document.getElementById('tlYearPicker').value          = '#1a1a1a';
    document.getElementById('tlYearHex').value             = '#1A1A1A';
    document.getElementById('tlYearOpacity').value         = 100;
    document.getElementById('tlTextSize').value            = 16;
    document.getElementById('tlTextPicker').value          = '#6b7280';
    document.getElementById('tlTextHex').value             = '#6B7280';
    document.getElementById('tlTextOpacity').value         = 100;
    document.getElementById('tlTrackInactivePicker').value = '#e0e0e0';
    document.getElementById('tlTrackInactiveHex').value    = '#E0E0E0';
    document.getElementById('tlTrackActivePicker').value   = '#555555';
    document.getElementById('tlTrackActiveHex').value      = '#555555';
    document.getElementById('tlBulletSize').value          = 10;
    document.getElementById('tlGroupGap').value            = 60;

    renderWidget();
    renderInspectorGroups();
  }

  document.getElementById('timelineReset').addEventListener('click', resetAll);

  /* ── Init ── */
  itemDetailEl = createItemDetailPanel();
  renderWidget();
  renderInspectorGroups();

})();
