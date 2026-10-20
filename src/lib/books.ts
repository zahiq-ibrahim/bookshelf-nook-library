/** 1. Search result from Open Library. Not saved anywhere. Identified by openLibraryId. */
export interface SearchResult {
  openLibraryId: string | null;
  title: string | null;
  authors: string[] | null;
  publishYear: number | null;
  numberOfPages: number | null;
  coverUrl: string | null;
}

/** 2. Saved book (UserBook). Identified by _id. From add-book and get-book. */
export interface SavedBook {
  _id: string;
  title?: string | null;
  authors?: string[] | null;
  publishYear?: number | null;
  numberOfPages?: number | null;
  coverUrl?: string | null;
  openLibraryId?: string | null;
  coverColor?: string | null;
  read?: boolean;
  caption?: string | null;
}

/** 3. Shelf summary. Identified by id. From get-library and the public library. */
export interface ShelfBook {
  id: string;
  title: string;
  authors: string[];
  color: string | null;
  numberOfPages: number | null;
  publishYear: number | null;
}

export interface ShelfLibrary {
  libraryName: string;
  caption: string;
  totalBooks: number;
  booksRead: number;
  libraryId?: string;
  books: ShelfBook[];
}

export const FALLBACK_COLOR = "#6b4226";

export const savedToShelf = (b: SavedBook): ShelfBook => ({
  id: b._id,
  title: b.title || "Untitled",
  authors: b.authors ?? [],
  color: b.coverColor ?? null,
  numberOfPages: b.numberOfPages ?? null,
  publishYear: b.publishYear ?? null,
});

export const normalizeLibrary = (l: Partial<ShelfLibrary> | null | undefined): ShelfLibrary => {
  const books = (l?.books ?? []).map((b) => ({
    id: String(b.id),
    title: b.title || "Untitled",
    authors: Array.isArray(b.authors) ? b.authors : [],
    color: b.color ?? null,
    numberOfPages: b.numberOfPages ?? null,
    publishYear: b.publishYear ?? null,
  }));
  return {
    libraryName: l?.libraryName || "My library",
    caption: l?.caption ?? "",
    totalBooks: l?.totalBooks ?? books.length,
    booksRead: l?.booksRead ?? 0,
    libraryId: l?.libraryId,
    books,
  };
};

export const authorsText = (a: string[] | null | undefined) =>
  a && a.length ? a.join(", ") : "Unknown author";
export const yearText = (y: number | null | undefined) => (y == null ? "n.d." : String(y));

// ---------- spine geometry ----------
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Stable height (px) derived from the id. */
export const spineHeight = (id: string) => 168 + (hashString(id) % 40);

/** Width (px) from page count, clamped. */
export function spineWidth(pages: number | null | undefined): number {
  if (!pages || pages <= 0) return 34;
  return Math.round(Math.min(56, Math.max(26, 22 + pages / 18)));
}

export function normalizeColor(c: string | null | undefined): string {
  if (!c) return FALLBACK_COLOR;
  const s = c.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return s;
  if (/^rgb/i.test(s)) return s;
  return FALLBACK_COLOR;
}

/** Relative luminance 0..1 of a hex/rgb colour. */
export function luminance(color: string): number {
  let r = 0, g = 0, b = 0;
  const hex = color.replace("#", "");
  if (/^rgb/i.test(color)) {
    const m = color.match(/\d+(\.\d+)?/g) || [];
    [r, g, b] = m.slice(0, 3).map(Number);
  } else if (hex.length === 3) {
    [r, g, b] = hex.split("").map((x) => parseInt(x + x, 16));
  } else {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  }
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export const isLightColor = (c: string) => luminance(c) > 0.35;

/** Greedy pack of items into rows that fit `width`. */
export function packRows<T>(items: T[], widthOf: (t: T) => number, width: number, gap = 2): T[][] {
  const rows: T[][] = [];
  let row: T[] = [];
  let used = 0;
  for (const it of items) {
    const w = widthOf(it);
    if (row.length && used + gap + w > width) {
      rows.push(row);
      row = [];
      used = 0;
    }
    used += (row.length ? gap : 0) + w;
    row.push(it);
  }
  if (row.length) rows.push(row);
  return rows;
}
