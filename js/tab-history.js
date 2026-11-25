/* =====================================
   Tab History Widget
   ===================================== */
(function () {
  'use strict';

  /* ── Defaults ── */
  var DEFAULT_TABS = [
    { id: 1, label: "2020's", years: [
      { id: 1, year: '2024', items: [
        { id: 1, text: '글로벌 파트너십 10개국 확장' },
        { id: 2, text: '누적 고객 100만 명 돌파' }
      ]},
      { id: 2, year: '2023', items: [
        { id: 3, text: '신규 플랫폼 베타 출시' },
        { id: 4, text: '시리즈 B 투자 유치 완료' }
      ]},
      { id: 3, year: '2022', items: [
        { id: 5, text: '기업부설연구소 설립' },
        { id: 6, text: '우수 스타트업 대상 수상' }
      ]},
      { id: 4, year: '2021', items: [
        { id: 7, text: '서비스 정식 론칭' },
        { id: 8, text: '직원 수 50명 돌파' }
      ]}
    ]},
    { id: 2, label: "2010's", years: [
      { id: 5, year: '2019', items: [
        { id: 9,  text: '해외 첫 진출 — 일본 법인 설립' },
        { id: 10, text: '연간 매출 100억 달성' }
      ]},
      { id: 6, year: '2017', items: [
        { id: 11, text: '시리즈 A 투자 유치' },
        { id: 12, text: '특허 등록 3건' }
      ]},
      { id: 7, year: '2015', items: [
        { id: 13, text: '모바일 앱 출시 및 100만 다운로드 달성' }
      ]},
      { id: 8, year: '2013', items: [
        { id: 14, text: '창업 초기 멤버 합류 및 MVP 완성' }
      ]}
    ]},
    { id: 3, label: "2000's", years: [
      { id: 9, year: '2009', items: [
        { id: 15, text: '초기 서비스 웹 베타 오픈' },
        { id: 16, text: '엔젤 투자 유치' }
      ]},
      { id: 10, year: '2007', items: [
        { id: 17, text: '법인 설립' },
        { id: 18, text: '창업팀 결성' }
      ]}
    ]}
  ];

  var state = {
    eyebrow:       'HISTORY',
    heading:       '우리의 발자취',
    accentHex:     '#1a1a1a',
    accentOpacity: 100,
    strongHex:     '#212529',
    strongOpacity: 100,
    tabs:          JSON.parse(JSON.stringify(DEFAULT_TABS)),
    activeTab:     0,
    nextTabId:     4,
    nextYearId:    11,
    nextItemId:    19
  };

  var detailEl     = null;
  var detailTabIdx = null;
  var dragSrcId    = null;

  /* ── Helpers ── */
  function clamp(v, mn, mx) { return Math.min(Math.max(Number(v) || mn, mn), mx); }
  function escAttr(str) { return String(str).replace(/"/g, '&quot;'); }
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
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

  /* ── Build widget HTML ── */
  function buildWidgetHTML() {
    var wrap = document.getElementById('tabHistoryWrap');
    if (!wrap) return;

    var tabsHTML = state.tabs.map(function (tab, i) {
      var cls = 'th-tab' + (i === state.activeTab ? ' active' : '');
      return '<button class="' + cls + '" type="button" data-tab="' + i + '">' +
        esc(tab.label || ('탭 ' + (i + 1))) +
        '</button>';
    }).join('');

    var panelsHTML = state.tabs.map(function (tab, i) {
      var cls = 'th-panel' + (i === state.activeTab ? ' active' : '');
      var inner = '';

      if (tab.years.length === 0) {
        inner = '<p class="th-panel-empty">인스펙터에서 연혁을 추가해 주세요</p>';
      } else {
        inner = '<p class="th-decade">' + esc(tab.label || '') + '</p>';
        inner += tab.years.map(function (yg) {
          var itemsHtml = '';
          if (yg.items.length === 0) {
            itemsHtml = '<div class="th-item"><span class="th-bullet"></span>' +
              '<span style="color:var(--clr-500);font-style:italic">항목을 추가하세요</span></div>';
          } else {
            itemsHtml = yg.items.map(function (item) {
              return '<div class="th-item"><span class="th-bullet"></span>' +
                '<span>' + esc(item.text || '') + '</span></div>';
            }).join('');
          }
          return '<div class="th-year-group">' +
            '<span class="th-year">' + esc(yg.year || '') + '</span>' +
            '<div class="th-items-list">' + itemsHtml + '</div>' +
            '</div>';
        }).join('');
      }

      return '<div class="' + cls + '">' + inner + '</div>';
    }).join('');

    wrap.innerHTML =
      '<div class="th-root" id="thRoot">' +
        '<div class="th-title">' +
          '<span class="th-eyebrow">' + esc(state.eyebrow || 'HISTORY') + '</span>' +
          '<h2 class="th-heading">' + esc(state.heading || '') + '</h2>' +
        '</div>' +
        '<div class="th-body">' +
          '<div class="th-tabs" id="thTabsEl">' + tabsHTML + '</div>' +
          '<div class="th-panels" id="thPanelsEl">' + panelsHTML + '</div>' +
        '</div>' +
      '</div>';

    applyVars();
    bindTabInteraction();
  }

  /* ── Apply CSS vars ── */
  function applyVars() {
    var root = document.getElementById('thRoot');
    if (!root) return;
    var accent = hexToRgba(state.accentHex, state.accentOpacity) || state.accentHex;
    var strong = hexToRgba(state.strongHex, state.strongOpacity) || state.strongHex;
    root.style.setProperty('--th-accent', accent);
    root.style.setProperty('--th-strong', strong);
    var accentSwatch = document.getElementById('thAccentSwatch');
    var strongSwatch = document.getElementById('thStrongSwatch');
    if (accentSwatch) accentSwatch.style.background = accent;
    if (strongSwatch) strongSwatch.style.background = strong;
  }

  /* ── Tab interaction (widget side) ── */
  function bindTabInteraction() {
    var tabsEl = document.getElementById('thTabsEl');
    if (!tabsEl) return;
    tabsEl.querySelectorAll('.th-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.activeTab = parseInt(btn.dataset.tab, 10);
        buildWidgetHTML();
      });
    });
  }

  /* ── Render inspector tab list ── */
  function renderTabList() {
    var list = document.getElementById('thTabList');
    if (!list) return;
    list.innerHTML = '';
    state.tabs.forEach(function (tab, i) {
      var row = document.createElement('div');
      row.className = 'inspector__item-row';
      row.dataset.tabId = tab.id;
      row.innerHTML =
        '<span class="inspector__drag">' + DRAG_SVG + '</span>' +
        '<span class="inspector__item-name">' + esc(tab.label || ('탭 ' + (i + 1))) + '</span>' +
        '<span class="inspector__item-arrow">' + ARROW_SVG + '</span>';
      row.addEventListener('click', function (e) {
        if (e.target.closest('.inspector__drag')) return;
        openTabDetail(i);
      });
      setupDragDrop(row, tab.id);
      list.appendChild(row);
    });
  }

  /* ── Detail panel: open ── */
  function openTabDetail(tabIdx) {
    if (!detailEl) return;
    detailTabIdx = tabIdx;
    var bodyEl = detailEl.querySelector('#thDetailBody');
    renderDetailBody(bodyEl, tabIdx);
    detailEl.classList.add('open');
  }

  /* ── Detail panel: render body ── */
  function renderDetailBody(bodyEl, tabIdx) {
    bodyEl.innerHTML = '';
    var tab = state.tabs[tabIdx];
    if (!tab) return;

    /* Tab label */
    var labelField = document.createElement('div');
    labelField.className = 'inspector__field';
    var labelLbl = document.createElement('label');
    labelLbl.className = 'inspector__field-label';
    labelLbl.textContent = '탭 레이블';
    var labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.className = 'inspector__card-name-input';
    labelInput.value = tab.label;
    labelInput.placeholder = '탭 이름';
    labelInput.addEventListener('input', function () {
      tab.label = labelInput.value;
      buildWidgetHTML();
      var row = document.querySelector('.inspector__item-row[data-tab-id="' + tab.id + '"]');
      if (row) {
        var nameEl = row.querySelector('.inspector__item-name');
        if (nameEl) nameEl.textContent = tab.label || ('탭 ' + (tabIdx + 1));
      }
    });
    labelField.appendChild(labelLbl);
    labelField.appendChild(labelInput);
    bodyEl.appendChild(labelField);

    /* Divider */
    var divider = document.createElement('div');
    divider.style.cssText = 'border-top:1px solid var(--clr-200);margin:8px -16px;';
    bodyEl.appendChild(divider);

    /* Year groups header */
    var yearLabel = document.createElement('label');
    yearLabel.className = 'inspector__field-label';
    yearLabel.textContent = '연혁 목록';
    bodyEl.appendChild(yearLabel);

    var addYearBtn = document.createElement('button');
    addYearBtn.className = 'inspector__sec-add';
    addYearBtn.type = 'button';
    addYearBtn.textContent = '+ 연도 추가';
    addYearBtn.addEventListener('click', function () {
      tab.years.push({ id: state.nextYearId++, year: '', items: [] });
      renderDetailBody(bodyEl, tabIdx);
      buildWidgetHTML();
    });
    bodyEl.appendChild(addYearBtn);

    /* Empty state */
    if (tab.years.length === 0) {
      var emptyMsg = document.createElement('p');
      emptyMsg.style.cssText = 'font-size:12px;color:var(--clr-500);text-align:center;padding:16px 0;';
      emptyMsg.textContent = '+ 연도 버튼으로 연혁을 추가하세요';
      bodyEl.appendChild(emptyMsg);
    }

    /* Year groups */
    tab.years.forEach(function (yg, yi) {
      var block = document.createElement('div');
      block.className = 'th-year-block';

      /* Head: year input + delete */
      var blockHead = document.createElement('div');
      blockHead.className = 'th-year-block-head';

      var yearNumInput = document.createElement('input');
      yearNumInput.type = 'text';
      yearNumInput.className = 'th-year-num-input';
      yearNumInput.value = yg.year;
      yearNumInput.placeholder = '연도 (예: 2025)';
      yearNumInput.addEventListener('input', function () {
        yg.year = yearNumInput.value;
        buildWidgetHTML();
      });

      var delYearBtn = document.createElement('button');
      delYearBtn.className = 'th-delete-btn';
      delYearBtn.type = 'button';
      delYearBtn.innerHTML = '&#x2715;';
      delYearBtn.title = '연도 삭제';
      delYearBtn.addEventListener('click', function () {
        tab.years.splice(yi, 1);
        renderDetailBody(bodyEl, tabIdx);
        buildWidgetHTML();
      });

      blockHead.appendChild(yearNumInput);
      blockHead.appendChild(delYearBtn);
      block.appendChild(blockHead);

      /* Item rows */
      yg.items.forEach(function (item, ii) {
        var itemRow = document.createElement('div');
        itemRow.className = 'th-item-row';

        var itemInput = document.createElement('input');
        itemInput.type = 'text';
        itemInput.className = 'th-item-input';
        itemInput.value = item.text;
        itemInput.placeholder = '항목 텍스트';
        itemInput.addEventListener('input', function () {
          item.text = itemInput.value;
          buildWidgetHTML();
        });

        var delItemBtn = document.createElement('button');
        delItemBtn.className = 'th-delete-btn';
        delItemBtn.type = 'button';
        delItemBtn.innerHTML = '&#x2715;';
        delItemBtn.addEventListener('click', function () {
          yg.items.splice(ii, 1);
          renderDetailBody(bodyEl, tabIdx);
          buildWidgetHTML();
        });

        itemRow.appendChild(itemInput);
        itemRow.appendChild(delItemBtn);
        block.appendChild(itemRow);
      });

      /* Add item */
      var addItemBtn = document.createElement('button');
      addItemBtn.className = 'th-add-item-btn';
      addItemBtn.type = 'button';
      addItemBtn.textContent = '+ 항목 추가';
      addItemBtn.addEventListener('click', function () {
        yg.items.push({ id: state.nextItemId++, text: '' });
        renderDetailBody(bodyEl, tabIdx);
        buildWidgetHTML();
      });
      block.appendChild(addItemBtn);

      bodyEl.appendChild(block);
    });
  }

  /* ── Create detail panel ── */
  function createDetailPanel() {
    var inspector = document.getElementById('tabHistoryInspector');
    var panel = document.createElement('div');
    panel.className = 'inspector__detail';
    panel.innerHTML =
      '<div class="inspector__detail-head">' +
        '<button class="inspector__detail-back" type="button">' +
          '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"' +
          ' stroke-linecap="round" stroke-linejoin="round" width="11" height="11">' +
          '<polyline points="10,3 4,8 10,13"/></svg>' +
          '탭 목록' +
        '</button>' +
        '<button class="inspector__detail-close" type="button">&#x2715;</button>' +
      '</div>' +
      '<div class="inspector__detail-body" id="thDetailBody"></div>';
    inspector.appendChild(panel);

    panel.querySelector('.inspector__detail-back').addEventListener('click', function () {
      panel.classList.remove('open');
      detailTabIdx = null;
    });
    panel.querySelector('.inspector__detail-close').addEventListener('click', function () {
      panel.classList.remove('open');
      detailTabIdx = null;
      var closeBtn = inspector.querySelector('.inspector__close');
      if (closeBtn) closeBtn.click();
    });

    return panel;
  }

  /* ── Drag & drop reorder tabs ── */
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
      row.classList.add(e.clientY < rect.top + rect.height / 2 ? 'drag-over-top' : 'drag-over-bottom');
    });
    row.addEventListener('drop', function (e) {
      e.preventDefault();
      if (dragSrcId === null || dragSrcId === id) return;
      var before = e.clientY < row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2;
      var srcIdx = state.tabs.findIndex(function (t) { return t.id === dragSrcId; });
      var moved  = state.tabs.splice(srcIdx, 1)[0];
      var dstIdx = state.tabs.findIndex(function (t) { return t.id === id; });
      state.tabs.splice(before ? dstIdx : dstIdx + 1, 0, moved);
      state.activeTab = Math.min(state.activeTab, state.tabs.length - 1);
      buildWidgetHTML();
      renderTabList();
    });
  }

  function clearDragIndicators() {
    var list = document.getElementById('thTabList');
    if (!list) return;
    list.querySelectorAll('.inspector__item-row').forEach(function (r) {
      r.classList.remove('drag-over-top', 'drag-over-bottom');
    });
  }

  /* ── Color bind helper ── */
  function bindColor(pickerId, hexId, opacityId, hexKey) {
    var picker = document.getElementById(pickerId);
    var hexEl  = document.getElementById(hexId);
    var opEl   = opacityId ? document.getElementById(opacityId) : null;
    if (!picker || !hexEl) return;

    function apply() { applyVars(); }

    picker.addEventListener('input', function () {
      var val = picker.value.toUpperCase();
      state[hexKey] = val;
      hexEl.value = val;
      apply();
    });
    hexEl.addEventListener('input', function () {
      var v = hexEl.value;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        state[hexKey] = v.toUpperCase();
        picker.value = v;
        apply();
      }
    });
    if (opEl) {
      var opKey = hexKey.replace('Hex', 'Opacity');
      opEl.addEventListener('input', function () {
        state[opKey] = clamp(opEl.value, 0, 100);
        apply();
      });
    }
  }

  /* ── Inspector bindings ── */
  function bindInspector() {
    var inspector = document.getElementById('tabHistoryInspector');

    /* Section toggles */
    if (inspector) {
      inspector.querySelectorAll('.inspector__sec-toggle').forEach(function (btn) {
        btn.addEventListener('click', function () {
          btn.closest('.inspector__section').classList.toggle('collapsed');
        });
      });
    }

    /* Eyebrow */
    var eyebrowEl = document.getElementById('thEyebrow');
    if (eyebrowEl) {
      eyebrowEl.value = state.eyebrow;
      eyebrowEl.addEventListener('input', function () {
        state.eyebrow = eyebrowEl.value;
        buildWidgetHTML();
      });
    }

    /* Heading */
    var headingEl = document.getElementById('thHeading');
    if (headingEl) {
      headingEl.value = state.heading;
      headingEl.addEventListener('input', function () {
        state.heading = headingEl.value;
        buildWidgetHTML();
      });
    }

    /* Add tab */
    var addTabBtn = document.getElementById('thAddTab');
    if (addTabBtn) {
      addTabBtn.addEventListener('click', function () {
        var newId = state.nextTabId++;
        state.tabs.push({ id: newId, label: "New Tab", years: [] });
        buildWidgetHTML();
        renderTabList();
      });
    }

    /* Color pickers */
    bindColor('thAccentPicker', 'thAccentHex', 'thAccentOpacity', 'accentHex');
    bindColor('thStrongPicker', 'thStrongHex', 'thStrongOpacity', 'strongHex');

    /* Reset */
    var resetBtn = document.getElementById('thReset');
    if (resetBtn) resetBtn.addEventListener('click', resetAll);
  }

  /* ── Reset ── */
  function resetAll() {
    state.eyebrow       = 'HISTORY';
    state.heading       = '우리의 발자취';
    state.accentHex     = '#1a1a1a';
    state.accentOpacity = 100;
    state.strongHex     = '#212529';
    state.strongOpacity = 100;
    state.tabs          = JSON.parse(JSON.stringify(DEFAULT_TABS));
    state.activeTab     = 0;
    state.nextTabId     = 4;
    state.nextYearId    = 11;
    state.nextItemId    = 19;

    if (detailEl) detailEl.classList.remove('open');
    detailTabIdx = null;

    var el;
    el = document.getElementById('thEyebrow');       if (el) el.value = state.eyebrow;
    el = document.getElementById('thHeading');       if (el) el.value = state.heading;
    el = document.getElementById('thAccentPicker');  if (el) el.value = '#1a1a1a';
    el = document.getElementById('thAccentHex');     if (el) el.value = '#1a1a1a';
    el = document.getElementById('thAccentOpacity'); if (el) el.value = state.accentOpacity;
    el = document.getElementById('thStrongPicker');  if (el) el.value = '#212529';
    el = document.getElementById('thStrongHex');     if (el) el.value = '#212529';
    el = document.getElementById('thStrongOpacity'); if (el) el.value = state.strongOpacity;

    buildWidgetHTML();
    renderTabList();
  }

  /* ── Init ── */
  buildWidgetHTML();
  renderTabList();
  bindInspector();
  detailEl = createDetailPanel();

})();
