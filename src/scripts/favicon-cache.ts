/** 书签 favicon 本地缓存 — 按域名记住可用的图标 URL，避免 CORS 与错误 fallback */

const STORAGE_KEY = 'view:favicon-cache-v2';
const LEGACY_KEY = 'view:favicon-cache-v1';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 240;

interface CacheEntry {
  src: string;
  at: number;
}

type CacheStore = Record<string, CacheEntry>;

const memory = new Map<string, string>();

function hostFromUrl(pageUrl: string): string | null {
  try {
    return new URL(pageUrl).hostname;
  } catch {
    return null;
  }
}

function faviconProviders(host: string): string[] {
  return [
    `https://icons.duckduckgo.com/ip3/${host}.ico`,
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`,
    `https://favicon.yandex.net/favicon/v2/${encodeURIComponent(host)}?size=32`,
  ];
}

function loadStore(): CacheStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as CacheStore;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveStore(store: CacheStore) {
  const now = Date.now();
  const entries = Object.entries(store).filter(([, e]) => now - e.at < MAX_AGE_MS && e.src && !e.src.includes('favicon.svg'));
  entries.sort((a, b) => b[1].at - a[1].at);
  const pruned = Object.fromEntries(entries.slice(0, MAX_ENTRIES));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
  } catch {
    const half = Object.fromEntries(entries.slice(0, Math.floor(MAX_ENTRIES / 2)));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(half));
    } catch {
      /* ignore quota */
    }
  }
}

function persist(host: string, src: string) {
  if (!src || src.includes('favicon.svg')) return;
  memory.set(host, src);
  const store = loadStore();
  store[host] = { src, at: Date.now() };
  saveStore(store);
}

function purgeLegacyCache() {
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}

purgeLegacyCache();

/** 同步读取缓存 */
export function getCachedFavicon(pageUrl: string): string | null {
  const host = hostFromUrl(pageUrl);
  if (!host) return null;

  if (memory.has(host)) return memory.get(host)!;

  const entry = loadStore()[host];
  if (!entry || Date.now() - entry.at >= MAX_AGE_MS) return null;

  memory.set(host, entry.src);
  return entry.src;
}

export function faviconSrcForRender(pageUrl: string): string {
  const host = hostFromUrl(pageUrl);
  if (!host) return faviconProviders('localhost')[0];

  return getCachedFavicon(pageUrl) ?? faviconProviders(host)[0];
}

function applySrc(img: HTMLImageElement, src: string) {
  if (img.src !== src) img.src = src;
}

/** 渲染后：无缓存则依次尝试多个图标源，成功即写入缓存；失败也不换成站点 favicon */
export function hydrateFaviconImages(container: HTMLElement) {
  container.querySelectorAll<HTMLAnchorElement>('a.view-bookmark-card').forEach((card) => {
    const img = card.querySelector<HTMLImageElement>('img[data-favicon]');
    if (!img) return;

    const pageUrl = card.href;
    const host = hostFromUrl(pageUrl);
    if (!host) return;

    const cached = getCachedFavicon(pageUrl);
    if (cached) {
      applySrc(img, cached);
      return;
    }

    const candidates = faviconProviders(host);
    let index = 0;

    const tryNext = () => {
      if (index >= candidates.length) return;

      const src = candidates[index];
      index += 1;

      img.onload = () => {
        img.onload = null;
        img.onerror = null;
        persist(host, src);
      };

      img.onerror = () => {
        img.onload = null;
        img.onerror = null;
        tryNext();
      };

      applySrc(img, src);
    };

    tryNext();
  });
}
