import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SummaryModal } from "@/components/BookModal";
import { Cabinet } from "@/components/Cabinet";
import { Spinner } from "@/components/ui-basic";
import { usePublicLibrary } from "@/hooks/useLibrary";
import type { ShelfBook } from "@/lib/books";

export const Route = createFileRoute("/library/$userId")({
  ssr: false,
  head: () => ({ meta: [
    { title: "A shared library — The Book Cabinet" },
    { name: "description", content: "Browse someone's book cabinet, shared with you." },
    { property: "og:title", content: "A shared library — The Book Cabinet" },
    { property: "og:description", content: "Browse someone's book cabinet, shared with you." },
  ] }),
  component: PublicLibrary,
});

function PublicLibrary() {
  const { userId } = Route.useParams();
  const { library, status } = usePublicLibrary(userId);
  const [open, setOpen] = useState<ShelfBook | null>(null);
  return (
    <div className="page">
      <header className="topbar">
        <Link to="/" className="brand">The Book Cabinet</Link>
        <span className="muted-light small">Read-only shared library</span>
      </header>
      <main className="page__main">
        {status === "loading" && <div className="state"><Spinner /> Opening the cabinet…</div>}
        {status === "error" && (
          <div className="state notfound">
            <h1>Library not found</h1>
            <p>This link may be wrong, or the library no longer exists.</p>
            <Link to="/" className="btn btn--brass">Go to your library</Link>
          </div>
        )}
        {status === "ready" && library && (
          <Cabinet library={library} onOpen={setOpen} emptySlot={<p>This cabinet is empty for now.</p>} />
        )}
      </main>
      {open && <SummaryModal shelf={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
