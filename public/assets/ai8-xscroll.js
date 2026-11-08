/* AI8 lab (fix set c): a table that sticks out past the screen scrolls inside its own box instead of the page.
   Only tables that actually reach past the screen are wrapped, so layouts where everything fits stay unchanged.
   A box (or a <pre>) is keyboard-focusable only while it really scrolls (WCAG: scrollable region focusable).
   Page text and content are not changed. Include with: <script src="/assets/ai8-xscroll.js" defer></script> */
(function () {
  'use strict';
  var sl = /^sl\b/i.test(document.documentElement.lang || '');
  var LABEL = sl ? 'Tabela, drsi vodoravno' : 'Table, scrolls sideways';
  var CODE_LABEL = sl ? 'Koda, drsi vodoravno' : 'Code, scrolls sideways';

  // Nearest ancestor that already clips or scrolls sideways (the page's own table scroller), or null.
  function scroller(el) {
    for (var a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      var o = getComputedStyle(a).overflowX;
      if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') return a;
    }
    return null;
  }
  function scrollable(el) { var o = getComputedStyle(el).overflowX; return o === 'auto' || o === 'scroll'; }
  function focusable(el, label) {
    if (el.scrollWidth > el.clientWidth + 1) {
      if (!el.hasAttribute('tabindex')) { el.setAttribute('tabindex', '0'); el.setAttribute('data-ai8-xscroll-tab', ''); }
      if (!el.hasAttribute('role') && el.tagName !== 'PRE') el.setAttribute('role', 'region');
      if (!el.hasAttribute('aria-label')) { el.setAttribute('aria-label', label); el.setAttribute('data-ai8-xscroll-label', ''); }
    } else if (el.hasAttribute('data-ai8-xscroll-tab')) {
      el.removeAttribute('tabindex'); el.removeAttribute('data-ai8-xscroll-tab');
      if (el.hasAttribute('data-ai8-xscroll-label')) { el.removeAttribute('aria-label'); el.removeAttribute('data-ai8-xscroll-label'); }
      if (el.getAttribute('role') === 'region' && el.className === 'ai8-xscroll') el.removeAttribute('role');
    }
  }
  // A grid or flex item has min-width:auto, so a wide table or <pre> inside it widens the whole
  // column past the screen. Let only those ancestors shrink (min-width:0), and only when needed.
  function release(el) {
    var vw = document.documentElement.clientWidth;
    if (el.getBoundingClientRect().right <= vw + 1) return;
    for (var a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      var pd = a.parentElement && getComputedStyle(a.parentElement).display;
      if (pd && /(grid|flex)$/.test(pd) && getComputedStyle(a).minWidth === 'auto') {
        a.style.minWidth = '0';
        a.setAttribute('data-ai8-xscroll-min', '');
      }
    }
  }
  function fit() {
    var tables = document.querySelectorAll('table');
    for (var i = 0; i < tables.length; i++) {
      var t = tables[i], p = t.parentElement;
      if (!p || p.closest('table')) continue; // nested tables follow their outer table
      if (p.className === 'ai8-xscroll') { focusable(p, LABEL); continue; }
      if (scroller(t)) continue; // the page already gives this table its own scroller
      if (t.getBoundingClientRect().right > document.documentElement.clientWidth + 1) {
        var box = document.createElement('div');
        box.className = 'ai8-xscroll';
        box.style.maxWidth = '100%';
        box.style.overflowX = 'auto';
        p.insertBefore(box, t);
        box.appendChild(t);
        focusable(box, LABEL);
      }
    }
    var pres = document.querySelectorAll('pre');
    for (var j = 0; j < pres.length; j++) {
      var o = getComputedStyle(pres[j]).overflowX;
      if (o === 'auto' || o === 'scroll') release(pres[j]);
    }
    var boxes = document.querySelectorAll('.ai8-xscroll'), own = [];
    for (var k = 0; k < boxes.length; k++) release(boxes[k]);
    for (var m = 0; m < tables.length; m++) {
      if (tables[m].parentElement.closest('table')) continue;
      var sc = scroller(tables[m]);
      if (sc && sc.className !== 'ai8-xscroll') { release(sc); if (scrollable(sc) && own.indexOf(sc) < 0) own.push(sc); }
    }
    for (k = 0; k < boxes.length; k++) focusable(boxes[k], LABEL);
    for (k = 0; k < own.length; k++) focusable(own[k], LABEL); // the page's own scrollers, once they really scroll
    for (j = 0; j < pres.length; j++) {
      o = getComputedStyle(pres[j]).overflowX;
      if (o === 'auto' || o === 'scroll') focusable(pres[j], CODE_LABEL);
    }
  }
  var queued = false;
  function later() { if (!queued) { queued = true; requestAnimationFrame(function () { queued = false; fit(); }); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fit); else fit();
  addEventListener('load', later);
  addEventListener('resize', later);
})();
