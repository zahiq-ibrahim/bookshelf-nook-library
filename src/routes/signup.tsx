import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Field, Spinner } from "@/components/ui-basic";
import { Api, getToken, parseApiError, setPendingEmail } from "@/lib/api";

export const Route = createFileRoute("/signup")({
  ssr: false,
  beforeLoad: () => { if (getToken()) throw redirect({ to: "/" }); },
  head: () => ({ meta: [
    { title: "Sign up — The Book Cabinet" },
    { name: "description", content: "Create your personal wooden book cabinet." },
    { property: "og:title", content: "Sign up — The Book Cabinet" },
    { property: "og:description", content: "Create your personal wooden book cabinet." },
  ] }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const [f, setF] = useState({ userName: "", email: "", password: "" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ text: string; login?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const local: Record<string, string> = {};
    if (!f.userName.trim()) local.userName = "Please enter a display name.";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) local.email = "Enter a valid email address.";
    if (f.password.length < 8 || f.password.length > 72) local.password = "Password must be 8 to 72 characters.";
    setErrs(local); setMsg(null);
    if (Object.keys(local).length) return;
    setBusy(true);
    const email = f.email.trim();
    try {
      await Api.signup({ ...f, email, userName: f.userName.trim() });
      setPendingEmail(email);
      navigate({ to: "/verify-email" });
    } catch (err) {
      const p = parseApiError(err, "Could not sign up.");
      if (p.status === 409) {
        if (/pending|verif/i.test(p.message) && !/already verified/i.test(p.message)) {
          setPendingEmail(email);
          navigate({ to: "/verify-email" });
          return;
        }
        setPendingEmail(email);
        setMsg({ text: "An account with this email already exists.", login: true });
      } else {
        setErrs(p.fieldErrors);
        if (!Object.keys(p.fieldErrors).length) setMsg({ text: p.message });
      }
      setBusy(false);
    }
  };

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <AuthShell title="Start your cabinet" subtitle="A shelf for every book you love."
      footer={<>Already have an account? <Link to="/login">Log in</Link></>}>
      <form onSubmit={submit} noValidate>
        <Field id="userName" label="Display name" error={errs.userName}>
          <input id="userName" value={f.userName} onChange={set("userName")} autoComplete="nickname" aria-invalid={!!errs.userName} />
        </Field>
        <Field id="email" label="Email" error={errs.email}>
          <input id="email" type="email" value={f.email} onChange={set("email")} autoComplete="email" aria-invalid={!!errs.email} />
        </Field>
        <Field id="password" label="Password (8–72 characters)" error={errs.password}>
          <input id="password" type="password" value={f.password} onChange={set("password")} autoComplete="new-password" aria-invalid={!!errs.password} />
        </Field>
        {msg && <p className="error-text" role="alert">{msg.text} {msg.login && <Link to="/login">Log in instead</Link>}</p>}
        <button className="btn btn--primary btn--block" disabled={busy}>{busy ? <Spinner /> : "Create account"}</button>
      </form>
    </AuthShell>
  );
}
