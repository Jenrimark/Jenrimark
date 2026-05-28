import type { ViewBookmarkNode } from '../data/view-bookmarks.sample';

export type BookmarkSortMode = 'relevance' | 'title-asc' | 'title-desc';

export const STORAGE_BM_SORT = 'view:suggest-bm-sort';

export interface FlatBookmark {
  id: string;
  title: string;
  url: string;
  folderPath: string;
}

function isFolderNode(node: ViewBookmarkNode): boolean {
  return Boolean(node.children?.length) && !node.url;
}

function folderSelected(folderId: string, filter: Set<string>): boolean {
  return filter.size === 0 || filter.has(folderId);
}

export function flattenBookmarkTree(nodes: ViewBookmarkNode[], filter: Set<string>): FlatBookmark[] {
  const out: FlatBookmark[] = [];

  const walk = (list: ViewBookmarkNode[], path: string[]) => {
    for (const node of list) {
      if (node.url) {
        out.push({
          id: node.id,
          title: node.title,
          url: node.url,
          folderPath: path.join(' / '),
        });
        continue;
      }
      if (!node.children?.length) continue;
      if (isFolderNode(node)) {
        const nextPath = [...path, node.title];
        if (folderSelected(node.id, filter)) {
          walk(node.children, nextPath);
        }
      } else {
        walk(node.children, path);
      }
    }
  };

  walk(nodes, []);
  return out;
}

/** 联想面板用：遍历全部文件夹，不受页面「文件夹筛选」影响 */
export function flattenAllBookmarks(nodes: ViewBookmarkNode[]): FlatBookmark[] {
  return flattenBookmarkTree(nodes, new Set());
}

function scoreBookmark(item: FlatBookmark, q: string): number {
  const title = item.title.toLowerCase();
  const url = item.url.toLowerCase();
  const folder = item.folderPath.toLowerCase();

  if (title === q) return 100;
  if (title.startsWith(q)) return 80;
  if (title.includes(q)) return 60;
  if (url.includes(q)) return 40;
  if (folder.includes(q)) return 20;
  return 0;
}

export function searchBookmarks(
  items: FlatBookmark[],
  query: string,
  sort: BookmarkSortMode,
  limit = 12,
): FlatBookmark[] {
  const q = query.trim().toLowerCase();

  let hits = q
    ? items
        .map((item) => ({ item, score: scoreBookmark(item, q) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.item)
    : [...items];

  if (sort === 'title-asc' || (!q && sort === 'relevance')) {
    hits.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
  } else if (sort === 'title-desc') {
    hits.sort((a, b) => b.title.localeCompare(a.title, 'zh-CN'));
  } else if (q && sort === 'relevance') {
    hits.sort((a, b) => scoreBookmark(b, q) - scoreBookmark(a, q));
  }

  return hits.slice(0, limit);
}

export function loadBookmarkSort(): BookmarkSortMode {
  const stored = localStorage.getItem(STORAGE_BM_SORT);
  if (stored === 'title-asc' || stored === 'title-desc' || stored === 'relevance') {
    return stored;
  }
  return 'relevance';
}

export function saveBookmarkSort(mode: BookmarkSortMode): void {
  localStorage.setItem(STORAGE_BM_SORT, mode);
}
