import { forwardRef, useState } from "react";
import { useBookSearch } from "@/hooks/useBookSearch";
import { Api, parseApiError } from "@/lib/api";
import { authorsText, yearText, type SavedBook, type SearchResult } from "@/lib/books";
import { toast } from "@/lib/toast";
import { Modal, Spinner } from "./ui-basic";

function Thumb({ url, title }: { url: string | null; title: string }) {
  const [failed, setFailed] = useState(false);
  return url && !failed ? (
    <img className="result__thumb" src={url} alt={`Cover of ${title}`} loading="lazy" onError={() => setFailed(true)} />
  ) : (
    <div className="result__thumb result__thumb--none" aria-hidden>?</div>
  );
}

function PreviewDialog({ result, onClose }: { result: SearchResult; onClose: () => void }) {
  const [state, setState] = useState<{ loading: boolean; data: SearchResult | null; error: string }>({ loading: true, data: null, error: "" });
  useState(() => {
    if (!result.openLibraryId) { setState({ loading: false, data: result, error: "" }); return; }
    Api.searchById(result.openLibraryId)
      .then((d) => setState({ loading: false, data: d ?? result, error: "" }))
      .catch((e) => setState({ loading: false, data: result, error: parseApiError(e).message }));
  });
  const d = state.data;
  const title = d?.title || result.title || "Untitled";
  return (
    <Modal label={`Preview: ${title}`} onClose={onClose} size="sm">
      {state.loading ? <p className="loading-row"><Spinner /> Loading preview…</p> : (
        <div className="preview">
          <Thumb url={d?.coverUrl ?? null} title={title} />
          <div>
            <h2 className="book-detail__title">{title}</h2>
            <p className="muted">{authorsText(d?.authors)}</p>
            <p>{yearText(d?.publishYear)} · {d?.numberOfPages ? `${d.numberOfPages} pages` : "Pages unknown"}</p>
            {state.error && <p className="error-text">{state.error}</p>}
          </div>
        </div>
      )}
      <div className="modal__actions"><span className="spacer" /><button className="btn btn--ghost" onClick={onClose}>Close</button></div>
    </Modal>
  );
}

function AddDialog({ result, onClose, onAdded }: { result: SearchResult; onClose: () => void; onAdded: (b: SavedBook) => void }) {
  const [haveRead, setHaveRead] = useState(false);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const title = result.title || "Untitled";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result.openLibraryId) return;
    setBusy(true);
    setError("");
    try {
      const saved = await Api.addBook({ bookId: result.openLibraryId, haveRead, caption });
      onAdded(saved);
      toast(`Added “${title}” to your shelf.`, "success");
      onClose();
    } catch (err) {
      const p = parseApiError(err, "Could not add this book.");
      setError(p.status === 409 ? "This book is already on your shelf." : p.message);
      setBusy(false);
    }
  };

  return (
    <Modal label={`Add ${title}`} onClose={() => !busy && onClose()} size="sm">
      <form onSubmit={submit}>
        <h2 className="book-detail__title">Add to shelf</h2>
        <p className="muted">{title} — {authorsText(result.authors)}</p>
        <label className="check"><input type="checkbox" checked={haveRead} onChange={(e) => setHaveRead(e.target.checked)} disabled={busy} /> I have read this</label>
        <label htmlFor="add-caption" className="label">Caption (optional)</label>
        <textarea id="add-caption" rows={3} value={caption} onChange={(e) => setCaption(e.target.value)} disabled={busy} />
        {error && <p className="error-text" role="alert">{error}</p>}
        {busy && <p className="loading-row"><Spinner /> Binding the spine — matching the cover colour…</p>}
        <div className="modal__actions">
          <button type="submit" className="btn btn--primary" disabled={busy}>{busy ? <Spinner /> : "Add book"}</button>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

export const SearchPanel = forwardRef<HTMLInputElement, { onAdded: (b: SavedBook) => void }>(function SearchPanel({ onAdded }, inputRef) {
  const s = useBookSearch();
  const [adding, setAdding] = useState<SearchResult | null>(null);
  const [preview, setPreview] = useState<SearchResult | null>(null);

  return (
    <section className="search" aria-label="Find books">
      <form className="search__bar" role="search" onSubmit={(e) => { e.preventDefault(); s.submit(); }}>
        <label htmlFor="book-search" className="sr-only">Search books by title</label>
        <input
          id="book-search"
          ref={inputRef}
          type="search"
          placeholder="Search for a book to add…"
          value={s.query}
          onChange={(e) => { s.setQuery(e.target.value); if (!e.target.value) s.clear(); }}
        />
        <button className="btn btn--primary" type="submit" disabled={s.loading || !s.query.trim()}>
          {s.loading ? <Spinner label="Searching" /> : "Search"}
        </button>
      </form>

      {(s.results || s.error || s.loading) && (
        <div className="results">
          {s.error && <p className="error-text" role="alert">{s.error}</p>}
          {s.loading && !s.results && <p className="loading-row"><Spinner /> Searching…</p>}
          {s.results && s.results.length === 0 && !s.loading && <p className="muted">No books found. Try another title.</p>}
          {s.results && s.results.length > 0 && (
            <>
              <div className="results__head">
                <span className="muted">{s.results.length} results</span>
                <button className="btn btn--ghost btn--sm" onClick={() => { s.setQuery(""); s.clear(); }}>Clear</button>
              </div>
              <ul className="results__list">
                {s.results.map((r, i) => {
                  const title = r.title || "Untitled";
                  return (
                    <li key={r.openLibraryId ?? `r${i}`} className="result">
                      <Thumb url={r.coverUrl} title={title} />
                      <div className="result__info">
                        <button className="link result__title" onClick={() => setPreview(r)}>{title}</button>
                        <span className="muted">{authorsText(r.authors)}</span>
                        <span className="muted small">{yearText(r.publishYear)} · {r.numberOfPages ? `${r.numberOfPages} pp` : "pages unknown"}</span>
                      </div>
                      <button className="btn btn--sm" disabled={!r.openLibraryId} onClick={() => setAdding(r)} aria-label={`Add ${title}`}>Add</button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}

      {adding && <AddDialog result={adding} onClose={() => setAdding(null)} onAdded={onAdded} />}
      {preview && <PreviewDialog result={preview} onClose={() => setPreview(null)} />}
    </section>
  );
});
