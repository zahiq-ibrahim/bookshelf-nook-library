import { useEffect, useState } from "react";
import { Api, parseApiError } from "@/lib/api";
import { authorsText, normalizeColor, yearText, type SavedBook, type ShelfBook } from "@/lib/books";
import { toast } from "@/lib/toast";
import { Modal, Spinner } from "./ui-basic";

function Cover({ url, color, title }: { url?: string | null; color: string; title: string }) {
  const [failed, setFailed] = useState(false);
  if (url && !failed) return <img className="cover" src={url} alt={`Cover of ${title}`} onError={() => setFailed(true)} />;
  return <div className="cover cover--block" style={{ background: color }} aria-label="No cover image" role="img" />;
}

function Swatch({ color }: { color: string }) {
  return (
    <span className="swatch"><span className="swatch__chip" style={{ background: color }} />{color}</span>
  );
}

/** Owner popup: loads full saved book, supports edit + remove. */
export function BookModal({
  shelf, onClose, onReadChanged, onRemoved,
}: {
  shelf: ShelfBook;
  onClose: () => void;
  onReadChanged: (from: boolean, to: boolean) => void;
  onRemoved: (id: string, wasRead: boolean) => void;
}) {
  const [book, setBook] = useState<SavedBook | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [read, setRead] = useState(false);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState<"" | "save" | "remove">("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let alive = true;
    Api.getBook(shelf.id)
      .then((b) => {
        if (!alive) return;
        if (!b) return setError("Could not load this book.");
        setBook(b);
      })
      .catch((e) => alive && setError(parseApiError(e, "Could not load this book.").message));
    return () => { alive = false; };
  }, [shelf.id]);

  const color = normalizeColor(book?.coverColor ?? shelf.color);
  const title = book?.title || shelf.title;

  const startEdit = () => { setRead(!!book?.read); setCaption(book?.caption ?? ""); setEditing(true); };

  const save = async () => {
    if (!book) return;
    setBusy("save");
    try {
      await Api.editBook({ bookId: shelf.id, caption, read });
      onReadChanged(!!book.read, read);
      setBook({ ...book, read, caption });
      setEditing(false);
      toast("Book updated.", "success");
    } catch (e) {
      toast(parseApiError(e, "Could not save changes.").message, "error");
    } finally { setBusy(""); }
  };

  const remove = async () => {
    setBusy("remove");
    try {
      await Api.removeBook(shelf.id);
      onRemoved(shelf.id, !!book?.read);
      toast(`Removed “${title}” from your shelf.`, "success");
      onClose();
    } catch (e) {
      toast(parseApiError(e, "Could not remove the book.").message, "error");
      setBusy("");
    }
  };

  return (
    <Modal label={title} onClose={onClose}>
      <div className="book-detail">
        <Cover url={book?.coverUrl} color={color} title={title} />
        <div className="book-detail__info">
          <h2 className="book-detail__title">{title}</h2>
          <p className="muted">{authorsText(book?.authors ?? shelf.authors)}</p>
          {!book && !error && <p className="loading-row"><Spinner /> Loading details…</p>}
          {error && <p className="error-text" role="alert">{error}</p>}
          {book && (
            <>
              <dl className="facts">
                <dt>Published</dt><dd>{yearText(book.publishYear)}</dd>
                <dt>Pages</dt><dd>{book.numberOfPages ?? "—"}</dd>
                <dt>Status</dt><dd>{book.read ? <span className="badge badge--read">Read</span> : <span className="badge">Not read yet</span>}</dd>
                <dt>Colour</dt><dd><Swatch color={color} /></dd>
              </dl>
              {editing ? (
                <div className="edit-box">
                  <label className="check"><input type="checkbox" checked={read} onChange={(e) => setRead(e.target.checked)} /> Read</label>
                  <label htmlFor="book-caption" className="label">Personal caption</label>
                  <textarea id="book-caption" rows={3} value={caption} onChange={(e) => setCaption(e.target.value)} />
                </div>
              ) : (
                <blockquote className="book-caption">{book.caption || <em className="muted">No personal caption.</em>}</blockquote>
              )}
            </>
          )}
        </div>
      </div>
      <div className="modal__actions">
        {confirming ? (
          <>
            <span className="confirm-text">Remove this book from your shelf?</span>
            <button className="btn btn--danger" onClick={remove} disabled={!!busy}>{busy === "remove" ? <Spinner /> : "Yes, remove"}</button>
            <button className="btn btn--ghost" onClick={() => setConfirming(false)} disabled={!!busy}>Keep it</button>
          </>
        ) : editing ? (
          <>
            <button className="btn btn--primary" onClick={save} disabled={!!busy}>{busy === "save" ? <Spinner /> : "Save"}</button>
            <button className="btn btn--ghost" onClick={() => setEditing(false)} disabled={!!busy}>Cancel</button>
          </>
        ) : (
          <>
            {book && <button className="btn" onClick={startEdit}>Edit</button>}
            {book && <button className="btn btn--danger-ghost" onClick={() => setConfirming(true)}>Remove</button>}
            <span className="spacer" />
            <button className="btn btn--ghost" onClick={onClose}>Close</button>
          </>
        )}
      </div>
    </Modal>
  );
}

/** Public popup: summary only (get-book is protected). */
export function SummaryModal({ shelf: base, onClose }: { shelf: ShelfBook; onClose: () => void }) {
  const [full, setFull] = useState<SavedBook | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    Api.getBook(base.id)
      .then((b) => { if (alive && b) setFull(b); })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [base.id]);
  const shelf: ShelfBook = full
    ? { ...base, coverUrl: full.coverUrl ?? base.coverUrl, caption: full.caption ?? base.caption, read: full.read ?? base.read, color: full.coverColor ?? base.color }
    : base;
  const color = normalizeColor(shelf.color);
  return (
    <Modal label={shelf.title} onClose={onClose}>
      <div className="book-detail">
        <Cover url={shelf.coverUrl} color={color} title={shelf.title} />
        <div className="book-detail__info">
          <h2 className="book-detail__title">{shelf.title}</h2>
          <p className="muted">{authorsText(shelf.authors)}</p>
          {loading && <p className="loading-row"><Spinner /> Loading details…</p>}
          <dl className="facts">
            <dt>Published</dt><dd>{yearText(shelf.publishYear)}</dd>
            <dt>Pages</dt><dd>{shelf.numberOfPages ?? "—"}</dd>
            <dt>Status</dt><dd>{shelf.read == null ? "—" : shelf.read ? <span className="badge badge--read">Read</span> : <span className="badge">Not read yet</span>}</dd>
            <dt>Colour</dt><dd><Swatch color={color} /></dd>
          </dl>
          <blockquote className="book-caption">{shelf.caption || <em className="muted">No personal caption.</em>}</blockquote>
        </div>
      </div>
      <div className="modal__actions"><span className="spacer" /><button className="btn btn--ghost" onClick={onClose}>Close</button></div>
    </Modal>
  );
}
