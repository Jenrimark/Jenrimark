/** 书签 favicon 本地缓存 — 按域名存储 data URL，减少每次进入 /view/ 重复加载 */

const STORAGE_KEY = 'view:favicon-cache-v1';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 240;

interface CacheEntry {
  dataUrl: string;
  at: number;
}

type CacheStore = Record<string, CacheEntry>;

const memory = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

function hostFromUrl(pageUrl: string): string | null {
  try {
    return new URL(pageUrl).hostname;
  } catch {
    return null;
  }
}

function remoteFaviconUrl(pageUrl: string): string {
  const host = hostFromUrl(pageUrl);
  if (!host) return '/favicon.svg';
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`;
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
  const entries = Object.entries(store).filter(([, e]) => now - e.at < MAX_AGE_MS);
  entries.sort((a, b) => b[1].at - a[1].at);
  const pruned = Object.fromEntries(entries.slice(0, MAX_ENTRIES));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
  } catch {
    /* quota — drop oldest half and retry once */
    const half = Object.fromEntries(entries.slice(0, Math.floor(MAX_ENTRIES / 2)));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(half));
    } catch {
      /* ignore */
    }
  }
}

function persist(host: string, dataUrl: string) {
  memory.set(host, dataUrl);
  const store = loadStore();
  store[host] = { dataUrl, at: Date.now() };
  saveStore(store);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** 同步读取缓存（有则立即显示，无则先用远程 URL） */
export function getCachedFavicon(pageUrl: string): string | null {
  const host = hostFromUrl(pageUrl);
  if (!host) return null;

  if (memory.has(host)) return memory.get(host)!;

  const entry = loadStore()[host];
  if (!entry || Date.now() - entry.at >= MAX_AGE_MS) return null;

  memory.set(host, entry.dataUrl);
  return entry.dataUrl;
}

export function faviconSrcForRender(pageUrl: string): string {
  return getCachedFavicon(pageUrl) ?? remoteFaviconUrl(pageUrl);
}

async function fetchAndCache(host: string, pageUrl: string): Promise<string> {
  const remote = remoteFaviconUrl(pageUrl);
  try {
    const res = await fetch(remote, { mode: 'cors', credentials: 'omit' });
    if (!res.ok) throw new Error(String(res.status));
    const dataUrl = await blobToDataUrl(await res.blob());
    persist(host, dataUrl);
    return dataUrl;
  } catch {
    return getCachedFavicon(pageUrl) ?? '/favicon.svg';
  }
}

export async function resolveFavicon(pageUrl: string): Promise<string> {
  const cached = getCachedFavicon(pageUrl);
  if (cached) return cached;

  const host = hostFromUrl(pageUrl);
  if (!host) return '/favicon.svg';

  const pending = inflight.get(host);
  if (pending) return pending;

  const task = fetchAndCache(host, pageUrl).finally(() => {
    inflight.delete(host);
  });
  inflight.set(host, task);
  return task;
}

/** 渲染后补齐未缓存图标，并替换远程 src 为 data URL */
export function hydrateFaviconImages(container: HTMLElement) {
  container.querySelectorAll<HTMLAnchorElement>('a.view-bookmark-card').forEach((card) => {
    const img = card.querySelector<HTMLImageElement>('img[data-favicon]');
    if (!img) return;

    const pageUrl = card.href;
    if (!pageUrl) return;

    const cached = getCachedFavicon(pageUrl);
    if (cached) {
      if (img.src !== cached) img.src = cached;
      return;
    }

    void resolveFavicon(pageUrl).then((src) => {
      if (img.isConnected && card.href === pageUrl) img.src = src;
    });
  });
}
