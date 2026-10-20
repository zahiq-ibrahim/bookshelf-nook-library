import { useCallback, useEffect, useState } from "react";
import { Api } from "@/lib/api";
import { normalizeLibrary, savedToShelf, type SavedBook, type ShelfLibrary } from "@/lib/books";

type Status = "loading" | "ready" | "error";

/** Owner's library state with local mutations. */
export function useLibrary() {
  const [library, setLibrary] = useState<ShelfLibrary | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      setLibrary(normalizeLibrary(await Api.getLibrary()));
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setCaption = (caption: string) => setLibrary((l) => (l ? { ...l, caption } : l));

  const addSaved = (b: SavedBook) => {
    const shelf = savedToShelf(b);
    setLibrary((l) =>
      l && !l.books.some((x) => x.id === shelf.id)
        ? {
            ...l,
            books: [...l.books, shelf],
            totalBooks: l.totalBooks + 1,
            booksRead: l.booksRead + (b.read ? 1 : 0),
          }
        : l,
    );
    setNewIds((s) => new Set(s).add(shelf.id));
  };

  const removeBook = (id: string, wasRead: boolean) =>
    setLibrary((l) =>
      l
        ? {
            ...l,
            books: l.books.filter((b) => b.id !== id),
            totalBooks: Math.max(0, l.totalBooks - 1),
            booksRead: Math.max(0, l.booksRead - (wasRead ? 1 : 0)),
          }
        : l,
    );

  const readChanged = (from: boolean, to: boolean) => {
    if (from === to) return;
    setLibrary((l) => (l ? { ...l, booksRead: Math.max(0, l.booksRead + (to ? 1 : -1)) } : l));
  };

  return { library, status, reload: load, setCaption, addSaved, removeBook, readChanged, newIds };
}

/** Public, read-only library. */
export function usePublicLibrary(userId: string) {
  const [library, setLibrary] = useState<ShelfLibrary | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  useEffect(() => {
    let alive = true;
    setStatus("loading");
    Api.publicLibrary(userId)
      .then((l) => { if (alive) { setLibrary(normalizeLibrary(l)); setStatus("ready"); } })
      .catch(() => alive && setStatus("error"));
    return () => { alive = false; };
  }, [userId]);
  return { library, status };
}
