/* =====================================
   App — Widget Switcher
   ===================================== */

(function () {
  'use strict';

  document.querySelectorAll('.widget-nav__item').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = btn.dataset.widget;

      /* Update nav active state */
      document.querySelectorAll('.widget-nav__item').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });

      /* Show matching view, hide others */
      document.querySelectorAll('.widget-view').forEach(function (v) {
        v.classList.toggle('active', v.id === 'view-' + target);
      });
    });
  });

})();
