import type { CSSProperties } from "react";
import { authorsText, isLightColor, normalizeColor, spineHeight, spineWidth, yearText, type ShelfBook } from "@/lib/books";

export function Spine({ book, onOpen, isNew }: { book: ShelfBook; onOpen: (b: ShelfBook) => void; isNew?: boolean }) {
  const bg = normalizeColor(book.color);
  const light = isLightColor(bg);
  const style = {
    "--spine-bg": bg,
    "--spine-ink": light ? "oklch(0.2 0.02 60)" : "oklch(0.96 0.02 85)",
    height: spineHeight(book.id),
    width: spineWidth(book.numberOfPages),
  } as CSSProperties;
  const author = authorsText(book.authors);
  return (
    <button
      type="button"
      className={`spine${isNew ? " spine--new" : ""}`}
      style={style}
      onClick={() => onOpen(book)}
      aria-label={`${book.title} by ${author}`}
      title={`${book.title} — ${author}`}
    >
      <span className="spine__year" aria-hidden>{yearText(book.publishYear)}</span>
      <span className="spine__rule spine__rule--double" aria-hidden />
      <span className="spine__title" aria-hidden>{book.title}</span>
      <span className="spine__rule" aria-hidden />
      <span className="spine__meta" aria-hidden>{author}</span>
    </button>
  );
}
