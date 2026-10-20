import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { clearToken } from "@/lib/api";

export function UserMenu({ email }: { email: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);
  const logout = () => { clearToken(); navigate({ to: "/login", replace: true }); };
  return (
    <div className="usermenu" ref={ref}>
      <button className="usermenu__btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="usermenu__avatar" aria-hidden>{(email || "?")[0].toUpperCase()}</span>
        <span className="usermenu__email">{email ?? "Account"}</span>
      </button>
      {open && (
        <div className="usermenu__pop" role="menu">
          <p className="usermenu__who">Signed in as<br /><strong>{email ?? "…"}</strong></p>
          <button role="menuitem" className="usermenu__item" onClick={logout}>Log out</button>
        </div>
      )}
    </div>
  );
}
