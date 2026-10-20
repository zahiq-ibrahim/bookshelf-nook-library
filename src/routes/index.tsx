import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BookModal } from "@/components/BookModal";
import { Cabinet } from "@/components/Cabinet";
import { SearchPanel } from "@/components/SearchPanel";
import { Spinner } from "@/components/ui-basic";
import { UserMenu } from "@/components/UserMenu";
import { useLibrary } from "@/hooks/useLibrary";
import { Api, getToken, parseApiError } from "@/lib/api";
import type { ShelfBook } from "@/lib/books";
import { toast } from "@/lib/toast";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: () => { if (!getToken()) throw redirect({ to: "/login" }); },
  head: () => ({ meta: [
    { title: "My Library — The Book Cabinet" },
    { name: "description", content: "Your personal wooden book cabinet: search, shelve and share your books." },
    { property: "og:title", content: "My Library — The Book Cabinet" },
    { property: "og:description", content: "Your personal wooden book cabinet: search, shelve and share your books." },
  ] }),
  component: MyLibrary,
});

function CaptionEditor({ caption, onSaved }: { caption: string; onSaved: (c: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(caption);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await Api.editLibraryCaption(draft);
      onSaved(draft);
      setEditing(false);
      toast("Caption updated.", "success");
    } catch (e) {
      toast(parseApiError(e, "Could not update the caption.").message, "error");
    } finally { setBusy(false); }
  };
  if (!editing)
    return (
      <div className="caption-row">
        <p className="caption-text">{caption || <em>No caption yet.</em>}</p>
        <button className="btn btn--brass btn--sm" onClick={() => { setDraft(caption); setEditing(true); }}>Edit caption</button>
      </div>
    );
  return (
    <form className="caption-row" onSubmit={(e) => { e.preventDefault(); save(); }}>
      <label htmlFor="lib-caption" className="sr-only">Library caption</label>
      <input id="lib-caption" className="caption-input" value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus disabled={busy}
        onKeyDown={(e) => e.key === "Escape" && setEditing(false)} />
      <button className="btn btn--brass btn--sm" disabled={busy}>{busy ? <Spinner /> : "Save"}</button>
      <button type="button" className="btn btn--ghost-light btn--sm" onClick={() => setEditing(false)} disabled={busy}>Cancel</button>
    </form>
  );
}

function MyLibrary() {
  const lib = useLibrary();
  const [email, setEmail] = useState<string | null>(null);
  const [open, setOpen] = useState<ShelfBook | null>(null);
  const [sharing, setSharing] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { Api.me().then((u) => setEmail(u.email)).catch(() => {}); }, []);

  const share = async () => {
    setSharing(true);
    try {
      const url = await Api.getLibraryUrl();
      try { await navigator.clipboard.writeText(url); toast("Link copied. Anyone with this link can view your library.", "success"); }
      catch { window.prompt("Copy your library link (anyone with it can view your library):", url); }
    } catch (e) {
      toast(parseApiError(e, "Could not get your share link.").message, "error");
    } finally { setSharing(false); }
  };

  return (
    <div className="page">
      <header className="topbar">
        <span className="brand">The Book Cabinet</span>
        <UserMenu email={email} />
      </header>
      <main className="page__main">
        <SearchPanel ref={searchRef} onAdded={lib.addSaved} />
        {lib.status === "loading" && <div className="state"><Spinner /> Opening your cabinet…</div>}
        {lib.status === "error" && (
          <div className="state state--error" role="alert">
            Your library could not be loaded. <button className="btn btn--sm" onClick={lib.reload}>Try again</button>
          </div>
        )}
        {lib.status === "ready" && lib.library && (
          <Cabinet
            library={lib.library}
            newIds={lib.newIds}
            onOpen={setOpen}
            captionSlot={<CaptionEditor caption={lib.library.caption} onSaved={lib.setCaption} />}
            actions={<button className="btn btn--brass btn--sm stats__share" onClick={share} disabled={sharing}>{sharing ? <Spinner /> : "Share"}</button>}
            emptySlot={
              <>
                <p>Your cabinet is empty.</p>
                <button className="btn btn--brass" onClick={() => { searchRef.current?.focus(); searchRef.current?.scrollIntoView({ block: "center" }); }}>Find your first book</button>
              </>
            }
          />
        )}
      </main>
      {open && (
        <BookModal shelf={open} onClose={() => setOpen(null)} onReadChanged={lib.readChanged} onRemoved={lib.removeBook} />
      )}
    </div>
  );
}
