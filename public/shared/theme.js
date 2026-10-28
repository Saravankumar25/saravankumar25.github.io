/* Shared by React and static documents. Load synchronously in <head> before paint. */
(function () {
  'use strict';
  if (window.siteTheme) return;
  var root = document.documentElement;
  var key = 'sk-theme';
  var media = window.matchMedia('(prefers-color-scheme: dark)');
  function saved() {
    try { var value = localStorage.getItem(key); return /^(light|dark)$/.test(value) ? value : null; }
    catch (_) { return null; }
  }
  function updateButtons() {
    document.querySelectorAll('[data-theme-toggle], #theme-toggle').forEach(function (button) {
      var dark = root.dataset.theme === 'dark';
      button.setAttribute('data-theme-toggle', '');
      button.setAttribute('aria-label', 'Dark theme');
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('title', 'Switch to ' + (dark ? 'light' : 'dark') + ' theme');
      button.textContent = dark ? '☼ Light' : '☾ Dark';
    });
  }
  function apply(value, persist) {
    root.dataset.theme = value;
    root.style.colorScheme = value;
    if (persist) { try { localStorage.setItem(key, value); } catch (_) {} }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = value === 'dark' ? '#0a0a0b' : '#fbfbfa';
    updateButtons();
    window.dispatchEvent(new CustomEvent('site-theme-change', { detail: value }));
  }
  function preferred() { return saved() || (media.matches ? 'dark' : 'light'); }
  window.siteTheme = { set: function (value) { if (/^(light|dark)$/.test(value)) apply(value, true); } };
  apply(preferred(), false);
  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-theme-toggle], #theme-toggle');
    if (button) apply(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
  });
  media.addEventListener('change', function () { if (!saved()) apply(preferred(), false); });
  window.addEventListener('storage', function (event) { if (event.key === key) apply(preferred(), false); });
  function ready() {
    // The publisher emits a static control. This fallback also supports older documents.
    if (!document.querySelector('[data-theme-toggle], #theme-toggle') && !document.getElementById('root')) {
      var button = document.createElement('button');
      button.type = 'button'; button.className = 'site-theme-fallback';
      button.setAttribute('data-theme-toggle', ''); document.body.appendChild(button);
    }
    updateButtons();
    // React mounts its header after this script; update only when controls are inserted.
    new MutationObserver(function (records) {
      if (records.some(function (record) { return Array.from(record.addedNodes).some(function (node) {
        return node.nodeType === 1 && (node.matches('[data-theme-toggle], #theme-toggle') || node.querySelector('[data-theme-toggle], #theme-toggle'));
      }); })) updateButtons();
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
