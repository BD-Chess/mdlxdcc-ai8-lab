/* Lab-only URL adaptation; generated copies carry an immutable source commit. */
(() => {
  if (globalThis.__AI8_LAB_PAGES__) return;
  globalThis.__AI8_LAB_PAGES__ = true;
  const BASE = __LAB_BASE__;
  const RAW = __LAB_RAW__;
  const ROOTS = new Set(__LAB_ROOTS__);
  const MEDIA = new Set(__LAB_MEDIA__);
  function adapt(value) {
    let url;
    try { url = new URL(String(value), globalThis.location.href); } catch { return value; }
    if (url.origin !== globalThis.location.origin) return value;
    let path = url.pathname;
    if (!path.startsWith(BASE)) {
      const root = path.split('/')[1];
      if (!ROOTS.has(root)) return value;
      path = BASE + path.replace(/^\//, '');
    }
    let relative;
    try { relative = decodeURIComponent(path.slice(BASE.length)); } catch { return value; }
    if (MEDIA.has(relative)) {
      return RAW + relative.split('/').map(encodeURIComponent).join('/') + url.search + url.hash;
    }
    return url.origin + path + url.search + url.hash;
  }
  if (globalThis.fetch) {
    const original = globalThis.fetch.bind(globalThis);
    globalThis.fetch = (input, init) => {
      if (input instanceof Request) {
        const url = adapt(input.url);
        return original(url === input.url ? input : new Request(url, input), init);
      }
      return original(adapt(input), init);
    };
  }
  if (globalThis.XMLHttpRequest) {
    const open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      return open.call(this, method, adapt(url), ...args);
    };
  }
  if (globalThis.Worker) {
    const OriginalWorker = globalThis.Worker;
    globalThis.Worker = class extends OriginalWorker {
      constructor(url, options) { super(adapt(url), options); }
    };
  }
  if (globalThis.document) {
    // Covers media URLs assembled dynamically by existing gallery/audio code.
    document.addEventListener('error', event => {
      const target = event.target;
      if (!target || !['IMG', 'AUDIO', 'VIDEO', 'SOURCE'].includes(target.tagName)) return;
      const current = target.currentSrc || target.src;
      if (!current || target.dataset.ai8Retried) return;
      const next = adapt(current);
      if (next !== current) {
        target.dataset.ai8Retried = '1';
        target.src = next;
      }
    }, true);
    document.addEventListener('click', event => {
      const anchor = event.target.closest?.('a[href]');
      if (!anchor || anchor.getAttribute('href').startsWith('#')) return;
      const next = adapt(anchor.href);
      if (next !== anchor.href) anchor.href = next;
    }, true);
  }
})();
