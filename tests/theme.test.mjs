import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../public/shared/theme.js', import.meta.url), 'utf8');
function browser({ stored = null, dark = false, blocked = false } = {}) {
  const events = {}, mediaEvents = {}, documentEvents = {};
  const storage = new Map(stored ? [['sk-theme', stored]] : []);
  const button = { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } };
  const root = { dataset: {}, style: {} };
  const media = { matches: dark, addEventListener: (k, f) => mediaEvents[k] = f };
  const context = {
    window: { matchMedia: () => media, dispatchEvent() {}, addEventListener: (k, f) => events[k] = f },
    document: { documentElement: root, readyState: 'loading', querySelector: () => null,
      querySelectorAll: () => [button], addEventListener: (k, f) => documentEvents[k] = f },
    localStorage: { getItem(k) { if (blocked) throw Error('blocked'); return storage.get(k) ?? null; },
      setItem(k, v) { if (blocked) throw Error('blocked'); storage.set(k, v); } },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
  };
  vm.runInNewContext(source, context);
  return { context, root, button, storage, media, events, mediaEvents, documentEvents };
}
test('uses system preference without creating a manual preference', () => {
  const b = browser({ dark: true });
  assert.equal(b.root.dataset.theme, 'dark');
  assert.equal(b.storage.size, 0);
  b.media.matches = false; b.mediaEvents.change();
  assert.equal(b.root.dataset.theme, 'light');
});
test('manual toggle persists across documents and overrides system changes', () => {
  const b = browser();
  b.documentEvents.click({ target: { closest: () => b.button } });
  assert.equal(b.storage.get('sk-theme'), 'dark');
  assert.equal(b.button.attrs['aria-pressed'], 'true');
  b.mediaEvents.change();
  assert.equal(b.root.dataset.theme, 'dark');
  assert.equal(browser({ stored: b.storage.get('sk-theme') }).root.dataset.theme, 'dark');
});
test('blocked storage and invalid saved values do not break theme switching', () => {
  const b = browser({ blocked: true });
  b.context.window.siteTheme.set('dark');
  assert.equal(b.root.dataset.theme, 'dark');
  assert.equal(browser({ stored: 'invalid', dark: true }).root.dataset.theme, 'dark');
});
test('synchronizes changes from another browser tab', () => {
  const b = browser(); b.storage.set('sk-theme', 'dark');
  b.events.storage({ key: 'sk-theme' });
  assert.equal(b.root.dataset.theme, 'dark');
});
