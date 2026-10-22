/* HOLLOW NIGHT CAMP — global loader (PRD §5.17).
   Classic <script> in <head> so the overlay paints with the very first frame.
   Transparent overlay: just the animated logo (assets/loader/loading.png, APNG) over the page being loaded.

   API (window.HNLoader):
     ready()                 shell is built (called by initPage)
     hold(label) -> release  keep the loader up while data loads
     track(promise, label)   hold() until the promise settles; returns the promise
     fail(message, retryFn)  show error + Retry / Continue (never traps the reader)
     leave()                 short fade-in while navigating away
     mini(text)              small inline loader element for tiny async states
*/
(function () {
  'use strict';
  if (window.HNLoader) return;

  var script = document.currentScript;
  var BASE = script && script.src ? new URL('../assets/loader/', script.src).href : 'assets/loader/';
  var LOGO = BASE + 'loading.png';
  var WATCHDOG_MS = 15000;
  var MIN_MS = 700;

  var doc = document.documentElement;
  var S = null;
  var holds = 0;
  var shellReady = false;
  var checkTimer = 0;

  function build() {
    var el = document.createElement('div');
    el.id = 'hnLoader';
    el.className = 'hnl';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-busy', 'true');
    el.innerHTML =
      '<div class="hnl-center">' +
        '<img class="hnl-logo" src="' + LOGO + '" alt="" decoding="async" draggable="false">' +
        '<div class="hnl-error" role="alert">' +
          '<p class="hnl-error-text"></p>' +
          '<div class="hnl-actions">' +
            '<button type="button" class="hnl-btn hnl-btn-primary" data-hnl="retry">Try again</button>' +
            '<button type="button" class="hnl-btn" data-hnl="dismiss">Continue anyway</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<span class="hnl-sr">Loading Hollow Night Camp</span>';
    doc.appendChild(el);
    doc.classList.add('hnl-lock');

    var inst = { el: el, started: Date.now(), timers: [], exiting: false, leaving: false, retry: null };
    el.querySelector('[data-hnl="retry"]').addEventListener('click', function () {
      if (inst.retry) { var fn = inst.retry; clearError(inst); fn(); } else { window.location.reload(); }
    });
    el.querySelector('[data-hnl="dismiss"]').addEventListener('click', function () { exit(inst); });
    return inst;
  }

  function later(inst, fn, ms) {
    var id = setTimeout(function () { if (S === inst) fn(); }, ms);
    inst.timers.push(id);
    return id;
  }

  function clearTimers(inst) {
    for (var i = 0; i < inst.timers.length; i++) clearTimeout(inst.timers[i]);
    inst.timers.length = 0;
  }

  function start() {
    if (S) return S;
    var inst = build();
    S = inst;
    inst.minAt = inst.started + MIN_MS;
    later(inst, function () {
      if (!inst.exiting) fail('The camp is taking longer than usual.', null);
    }, WATCHDOG_MS);
    return inst;
  }

  function destroy(inst) {
    if (!inst) return;
    clearTimers(inst);
    if (inst.el.parentNode) inst.el.parentNode.removeChild(inst.el);
    if (S === inst) S = null;
    doc.classList.remove('hnl-lock');
  }

  function exit(inst) {
    inst = inst || S;
    if (!inst || inst.exiting) return;
    inst.exiting = true;
    clearTimers(inst);
    inst.el.setAttribute('aria-busy', 'false');
    inst.el.classList.remove('is-error');
    inst.el.classList.add('is-gone');
    setTimeout(function () { destroy(inst); }, 320);
  }

  function check() {
    if (!S || S.exiting || S.leaving) return;
    if (!shellReady || holds > 0) return;
    var wait = S.minAt - Date.now();
    clearTimeout(checkTimer);
    if (wait > 0) { checkTimer = setTimeout(check, wait + 10); return; }
    exit(S);
  }

  function clearError(inst) {
    inst.el.classList.remove('is-error');
    inst.el.setAttribute('role', 'status');
  }

  function fail(message, retryFn) {
    if (!S || S.exiting) return;
    S.retry = retryFn || null;
    S.el.querySelector('.hnl-error-text').textContent = message || 'Something went wrong around the campfire.';
    S.el.classList.add('is-error');
    S.el.setAttribute('aria-busy', 'false');
    var btn = S.el.querySelector('[data-hnl="retry"]');
    if (btn) { try { btn.focus({ preventScroll: true }); } catch (e) {} }
  }

  /* ---------------- public API ---------------- */
  function hold() {
    holds++;
    var done = false;
    return function release() {
      if (done) return;
      done = true;
      holds = Math.max(0, holds - 1);
      if (holds === 0) { clearTimeout(checkTimer); checkTimer = setTimeout(check, 120); }
    };
  }

  function track(promise, label) {
    var release = hold(label);
    var p = Promise.resolve(promise);
    p.then(release, release);
    return p;
  }

  function ready() {
    shellReady = true;
    // small grace so page scripts can register their own holds right after initPage resolves
    clearTimeout(checkTimer);
    checkTimer = setTimeout(check, 260);
  }

  function leave() {
    if (S && !S.exiting) return;
    if (S) destroy(S);
    var inst = build();
    S = inst;
    inst.leaving = true;
    inst.el.classList.add('is-leaving');
    // safety: a cancelled navigation must never leave the page covered
    later(inst, function () { destroy(inst); }, 3200);
  }

  function mini(text) {
    var wrap = document.createElement('div');
    wrap.className = 'hnl-mini';
    wrap.setAttribute('role', 'status');
    var logo = document.createElement('span');
    logo.className = 'hnl-mini-logo';
    var img = document.createElement('img');
    img.src = LOGO;
    img.alt = '';
    img.decoding = 'async';
    logo.appendChild(img);
    var label = document.createElement('span');
    label.textContent = text || 'Loading…';
    wrap.appendChild(logo);
    wrap.appendChild(label);
    return wrap;
  }

  window.HNLoader = { ready: ready, hold: hold, track: track, fail: fail, leave: leave, mini: mini, exit: function () { exit(S); } };

  /* ---------------- boot ---------------- */
  start();

  // page restored from the back/forward cache: drop any leftover overlay
  window.addEventListener('pageshow', function (event) {
    if (event.persisted && S && S.leaving) destroy(S);
  });

  // same-origin link clicks: show the loader while the next page loads
  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (document.body && document.body.classList.contains('editor-mode')) return;
    var a = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!a || a.hasAttribute('download')) return;
    if (a.target && a.target !== '_self') return;
    var url;
    try { url = new URL(a.href, location.href); } catch (e) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return;
    leave();
  });
})();
