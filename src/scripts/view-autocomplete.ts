/** Google 搜索联想 + 本页最近搜索记录 */

const STORAGE_RECENT = 'view:search-recent';
const MAX_RECENT = 8;
const DEBOUNCE_MS = 160;

interface InitOptions {
  input: HTMLInputElement;
  list: HTMLUListElement;
  isGoogle: () => boolean;
  onSubmit: (query: string) => void;
  /** 点击这些区域时收起联想（如搜索引擎按钮区） */
  dismissRoots?: HTMLElement[];
}

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_RECENT);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function saveRecentQuery(query: string) {
  const q = query.trim();
  if (!q) return;
  const next = [q, ...loadRecent().filter((item) => item !== q)].slice(0, MAX_RECENT);
  localStorage.setItem(STORAGE_RECENT, JSON.stringify(next));
}

function matchRecent(query: string): string[] {
  const q = query.trim().toLowerCase();
  const recent = loadRecent();
  if (!q) return recent;
  return recent.filter((item) => item.toLowerCase().includes(q));
}

function fetchGoogleSuggestions(query: string): Promise<string[]> {
  const q = query.trim();
  if (!q) return Promise.resolve([]);

  return new Promise((resolve) => {
    const cb = `_gsc_${Date.now().toString(36)}`;
    let script: HTMLScriptElement | null = null;

    const finish = (items: string[]) => {
      clearTimeout(timer);
      delete (window as unknown as Record<string, unknown>)[cb];
      script?.remove();
      resolve(items);
    };

    const timer = setTimeout(() => finish([]), 5000);

    (window as unknown as Record<string, unknown>)[cb] = (data: unknown) => {
      if (!Array.isArray(data) || !Array.isArray(data[1])) {
        finish([]);
        return;
      }
      const items = (data[1] as unknown[])
        .map((item) => (Array.isArray(item) ? String(item[0] ?? '') : String(item)))
        .filter(Boolean);
      finish(items);
    };

    script = document.createElement('script');
    script.src = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(q)}&callback=${cb}`;
    script.onerror = () => finish([]);
    document.head.appendChild(script);
  });
}

type SuggestItem = { text: string; kind: 'recent' | 'google' };

function mergeSuggestions(recent: string[], google: string[]): SuggestItem[] {
  const seen = new Set<string>();
  const out: SuggestItem[] = [];
  for (const text of recent) {
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ text, kind: 'recent' });
    if (out.length >= 10) return out;
  }
  for (const text of google) {
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ text, kind: 'google' });
    if (out.length >= 10) break;
  }
  return out;
}

export function initSearchAutocomplete({ input, list, isGoogle, onSubmit, dismissRoots = [] }: InitOptions) {
  let activeIndex = -1;
  let items: SuggestItem[] = [];
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let requestId = 0;
  /** 切换搜索引擎等操作后的 focus 不应立刻弹出「最近」列表 */
  let skipSuggestOnNextFocus = false;

  const hide = () => {
    list.hidden = true;
    list.innerHTML = '';
    activeIndex = -1;
    items = [];
    input.setAttribute('aria-expanded', 'false');
  };

  const render = () => {
    if (items.length === 0) {
      hide();
      return;
    }

    list.innerHTML = items
      .map(
        (item, i) => `<li class="view-suggest__item" role="option" data-index="${i}" aria-selected="${i === activeIndex}">
          <span class="view-suggest__kind">${item.kind === 'recent' ? '最近' : '联想'}</span>
          <span class="view-suggest__text">${escapeHtml(item.text)}</span>
        </li>`,
      )
      .join('');

    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');

    list.querySelectorAll<HTMLLIElement>('.view-suggest__item').forEach((el) => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const idx = Number(el.dataset.index);
        pick(items[idx]);
      });
    });
  };

  const pick = (item: SuggestItem | undefined) => {
    if (!item) return;
    input.value = item.text;
    hide();
    onSubmit(item.text);
  };

  const highlight = () => {
    list.querySelectorAll<HTMLLIElement>('.view-suggest__item').forEach((el, i) => {
      el.setAttribute('aria-selected', String(i === activeIndex));
      el.classList.toggle('is-active', i === activeIndex);
    });
    const active = list.querySelector<HTMLLIElement>(`.view-suggest__item[data-index="${activeIndex}"]`);
    active?.scrollIntoView({ block: 'nearest' });
  };

  const update = async () => {
    const query = input.value;
    const id = ++requestId;

    const recent = matchRecent(query);
    const google = isGoogle() && query.trim() ? await fetchGoogleSuggestions(query) : [];

    if (id !== requestId) return;

    items = mergeSuggestions(recent, google);
    // 不默认选中第一项，避免聚焦后误按 Enter 提交「最近」
    activeIndex = -1;
    render();
    highlight();
  };

  input.addEventListener('input', () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      void update();
    }, DEBOUNCE_MS);
  });

  input.addEventListener('focus', () => {
    if (skipSuggestOnNextFocus) {
      skipSuggestOnNextFocus = false;
      return;
    }
    void update();
  });

  input.addEventListener('keydown', (e) => {
    if (list.hidden || items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = activeIndex < 0 ? 0 : Math.min(activeIndex + 1, items.length - 1);
      highlight();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = activeIndex < 0 ? items.length - 1 : Math.max(activeIndex - 1, 0);
      highlight();
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      pick(items[activeIndex]);
    } else if (e.key === 'Escape') {
      hide();
    }
  });

  const isInsideDismissRoot = (node: Node) =>
    dismissRoots.some((root) => root.contains(node));

  document.addEventListener('mousedown', (e) => {
    const target = e.target as Node;
    if (list.hidden) return;
    if (input.contains(target) || list.contains(target) || isInsideDismissRoot(target)) {
      return;
    }
    hide();
  });

  return {
    hide,
    /** 下次 input 获得焦点时不展开联想（用于切换搜索引擎） */
    skipNextFocusSuggest: () => {
      skipSuggestOnNextFocus = true;
      hide();
    },
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
