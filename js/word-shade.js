/* =====================================
   Word Shade Widget
   ===================================== */
(function () {
  'use strict';

  /* ── Settings ── */
  var settings = {
    text:       'WORD SHADE',
    fontSize:   120,
    textColor:  '#ffffff',
    textOpacity: 100,
    fontWeight: '700',
    align:      'center',
    bgColor:    '#000000',
    bgOpacity:  100,
    hoverDim:   true,
    dimColor:   '#222222',
    dimOpacity: 100,
    dimSpeed:   0.3
  };

  /* ── Helpers ── */
  function hexToRgb(hex) {
    var r = parseInt(hex.slice(1,3),16);
    var g = parseInt(hex.slice(3,5),16);
    var b = parseInt(hex.slice(5,7),16);
    return { r: r, g: g, b: b };
  }

  function colorWithOpacity(hex, opacity) {
    var rgb = hexToRgb(hex);
    var a = (opacity / 100).toFixed(2);
    return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + a + ')';
  }

  function clamp(v, mn, mx) { return Math.min(Math.max(v, mn), mx); }

  /* ── Build widget HTML ── */
  function buildWidgetHTML() {
    var wrap = document.getElementById('wordShadeWrap');
    if (!wrap) return;

    var words = settings.text.split(' ');
    var wordSpans = words.map(function (word) {
      if (!word) return '';
      var chars = word.split('').map(function (ch) {
        return '<span class="ws-char">' + (ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch === '&' ? '&amp;' : ch) + '</span>';
      }).join('');
      return '<span class="ws-word">' + chars + '</span>';
    });

    var inner = wordSpans.join(' ');

    wrap.innerHTML =
      '<div class="ws-root" id="wsRoot">' +
        '<div class="ws-text" id="wsTextEl">' + inner + '</div>' +
      '</div>';

    applyVars();
  }

  /* ── Apply CSS variables ── */
  function applyVars() {
    var root = document.getElementById('wsRoot');
    if (!root) return;

    root.style.setProperty('--ws-font-size',   settings.fontSize + 'px');
    root.style.setProperty('--ws-text-color',  colorWithOpacity(settings.textColor, settings.textOpacity));
    root.style.setProperty('--ws-text-weight', settings.fontWeight);
    root.style.setProperty('--ws-bg',          colorWithOpacity(settings.bgColor, settings.bgOpacity));
    root.style.setProperty('--ws-dim-color',   colorWithOpacity(settings.dimColor, settings.dimOpacity));
    root.style.setProperty('--ws-dim-speed',   settings.dimSpeed + 's');

    root.setAttribute('data-align',     settings.align);
    root.setAttribute('data-hover-dim', settings.hoverDim ? 'on' : 'off');
  }

  /* ── Sync inspector UI from settings ── */
  function syncInspector() {
    // Text
    var wsText = document.getElementById('wsText');
    if (wsText) wsText.value = settings.text;

    var wsFontSize = document.getElementById('wsFontSize');
    if (wsFontSize) wsFontSize.value = settings.fontSize;

    setColor('wsTextSwatch', 'wsTextPicker', 'wsTextHex', 'wsTextOpacity', settings.textColor, settings.textOpacity);
    setColor('wsBgSwatch',   'wsBgPicker',   'wsBgHex',   'wsBgOpacity',   settings.bgColor,   settings.bgOpacity);
    setColor('wsDimSwatch',  'wsDimPicker',  'wsDimHex',  'wsDimOpacity',  settings.dimColor,  settings.dimOpacity);

    setSegment('wsWeightSegment', settings.fontWeight);
    setSegment('wsAlignSegment',  settings.align);

    var wsHoverDim = document.getElementById('wsHoverDim');
    if (wsHoverDim) wsHoverDim.classList.toggle('active', settings.hoverDim);

    var wsDimSpeed = document.getElementById('wsDimSpeed');
    if (wsDimSpeed) wsDimSpeed.value = settings.dimSpeed;
  }

  function setColor(swatchId, pickerId, hexId, opacityId, hex, opacity) {
    var swatch  = document.getElementById(swatchId);
    var picker  = document.getElementById(pickerId);
    var hexEl   = document.getElementById(hexId);
    var opacEl  = document.getElementById(opacityId);
    if (swatch)  swatch.style.background = hex;
    if (picker)  picker.value = hex;
    if (hexEl)   hexEl.value = hex.toUpperCase();
    if (opacEl)  opacEl.value = opacity;
  }

  function setSegment(id, value) {
    var seg = document.getElementById(id);
    if (!seg) return;
    seg.querySelectorAll('.inspector__layout-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.value === value);
    });
  }

  /* ── Inspector bindings ── */
  function bindInspector() {

    // Section toggles
    var inspector = document.getElementById('wordShadeInspector');
    if (inspector) {
      inspector.querySelectorAll('.inspector__sec-toggle').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var sec = btn.closest('.inspector__section');
          if (sec) sec.classList.toggle('collapsed');
        });
      });
    }

    // Text content
    var wsText = document.getElementById('wsText');
    if (wsText) {
      wsText.addEventListener('input', function () {
        settings.text = wsText.value;
        buildWidgetHTML();
      });
    }

    // Font size
    var wsFontSize = document.getElementById('wsFontSize');
    if (wsFontSize) {
      wsFontSize.addEventListener('input', function () {
        var v = parseInt(wsFontSize.value);
        if (!isNaN(v)) { settings.fontSize = clamp(v, 20, 400); applyVars(); }
      });
    }

    // Text color
    bindColorGroup('wsTextPicker', 'wsTextHex', 'wsTextOpacity', 'wsTextSwatch', function (hex, op) {
      settings.textColor = hex; settings.textOpacity = op; applyVars();
    });

    // Font weight
    bindSegment('wsWeightSegment', function (val) {
      settings.fontWeight = val; applyVars();
    });

    // Align
    bindSegment('wsAlignSegment', function (val) {
      settings.align = val; applyVars();
    });

    // Background color
    bindColorGroup('wsBgPicker', 'wsBgHex', 'wsBgOpacity', 'wsBgSwatch', function (hex, op) {
      settings.bgColor = hex; settings.bgOpacity = op; applyVars();
    });

    // Hover dim toggle
    var wsHoverDim = document.getElementById('wsHoverDim');
    if (wsHoverDim) {
      wsHoverDim.addEventListener('click', function () {
        settings.hoverDim = !settings.hoverDim;
        wsHoverDim.classList.toggle('active', settings.hoverDim);
        applyVars();
      });
    }

    // Dim color
    bindColorGroup('wsDimPicker', 'wsDimHex', 'wsDimOpacity', 'wsDimSwatch', function (hex, op) {
      settings.dimColor = hex; settings.dimOpacity = op; applyVars();
    });

    // Dim speed
    var wsDimSpeed = document.getElementById('wsDimSpeed');
    if (wsDimSpeed) {
      wsDimSpeed.addEventListener('input', function () {
        var v = parseFloat(wsDimSpeed.value);
        if (!isNaN(v)) { settings.dimSpeed = clamp(v, 0, 2); applyVars(); }
      });
    }

    // Reset
    var wsReset = document.getElementById('wsReset');
    if (wsReset) {
      wsReset.addEventListener('click', resetAll);
    }
  }

  function bindColorGroup(pickerId, hexId, opacityId, swatchId, onChange) {
    var picker  = document.getElementById(pickerId);
    var hexEl   = document.getElementById(hexId);
    var opacEl  = document.getElementById(opacityId);
    var swatch  = document.getElementById(swatchId);

    function update(hex, op) {
      if (swatch) swatch.style.background = hex;
      onChange(hex, op);
    }

    if (picker) {
      picker.addEventListener('input', function () {
        var hex = picker.value;
        if (hexEl) hexEl.value = hex.toUpperCase();
        var op = opacEl ? parseInt(opacEl.value) : 100;
        update(hex, op);
      });
    }

    if (hexEl) {
      hexEl.addEventListener('input', function () {
        var v = hexEl.value.trim();
        if (!/^#[0-9a-fA-F]{6}$/.test(v)) return;
        if (picker) picker.value = v;
        if (swatch) swatch.style.background = v;
        var op = opacEl ? parseInt(opacEl.value) : 100;
        onChange(v, op);
      });
    }

    if (opacEl) {
      opacEl.addEventListener('input', function () {
        var op = clamp(parseInt(opacEl.value) || 0, 0, 100);
        var hex = picker ? picker.value : '#000000';
        update(hex, op);
      });
    }
  }

  function bindSegment(id, onChange) {
    var seg = document.getElementById(id);
    if (!seg) return;
    seg.querySelectorAll('.inspector__layout-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        seg.querySelectorAll('.inspector__layout-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        onChange(btn.dataset.value);
      });
    });
  }

  /* ── Reset ── */
  function resetAll() {
    settings = {
      text:       'WORD SHADE',
      fontSize:   120,
      textColor:  '#ffffff',
      textOpacity: 100,
      fontWeight: '700',
      align:      'center',
      bgColor:    '#000000',
      bgOpacity:  100,
      hoverDim:   true,
      dimColor:   '#222222',
      dimOpacity: 100,
      dimSpeed:   0.3
    };
    buildWidgetHTML();
    syncInspector();
  }

  /* ── Init ── */
  buildWidgetHTML();
  syncInspector();
  bindInspector();

})();
