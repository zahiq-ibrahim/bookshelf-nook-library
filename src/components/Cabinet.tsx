import { useEffect, useRef, useState, type ReactNode } from "react";
import { packRows, spineWidth, type ShelfBook, type ShelfLibrary } from "@/lib/books";
import { Spine } from "./Spine";

const GAP = 3;

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export function Cabinet({
  library, onOpen, captionSlot, actions, emptySlot, newIds,
}: {
  library: ShelfLibrary;
  onOpen: (b: ShelfBook) => void;
  captionSlot?: ReactNode;
  actions?: ReactNode;
  emptySlot?: ReactNode;
  newIds?: Set<string>;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const rows = width > 0 ? packRows(library.books, (b) => spineWidth(b.numberOfPages), width, GAP) : [];
  const minRows = Math.max(rows.length, 2);

  return (
    <section className="cabinet" aria-label={library.libraryName}>
      <header className="cabinet__crown">
        <div className="plate"><h1 className="plate__name">{library.libraryName}</h1></div>
        <div className="cabinet__caption">
          {captionSlot ?? <p className="caption-text">{library.caption || <em>No caption yet.</em>}</p>}
        </div>
        <div className="cabinet__stats">
          <span><strong>{library.totalBooks}</strong> {library.totalBooks === 1 ? "book" : "books"}</span>
          <span aria-hidden>·</span>
          <span><strong>{library.booksRead}</strong> read</span>
          {actions}
        </div>
      </header>
      <div className="cabinet__body">
        <div ref={ref} className="cabinet__measure" />
        {Array.from({ length: minRows }).map((_, i) => (
          <div className="shelf" key={i}>
            <div className="shelf__books">
              {(rows[i] ?? []).map((b) => (
                <Spine key={b.id} book={b} onOpen={onOpen} isNew={newIds?.has(b.id)} />
              ))}
            </div>
            <div className="shelf__plank" aria-hidden />
          </div>
        ))}
        {library.books.length === 0 && <div className="cabinet__empty">{emptySlot}</div>}
      </div>
    </section>
  );
}
