import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Field, Spinner } from "@/components/ui-basic";
import { Api, getPendingEmail, getToken, parseApiError, setPendingEmail, setToken } from "@/lib/api";

export const Route = createFileRoute("/login")({
  ssr: false,
  beforeLoad: () => { if (getToken()) throw redirect({ to: "/" }); },
  head: () => ({ meta: [
    { title: "Log in — The Book Cabinet" },
    { name: "description", content: "Log in to your personal book cabinet." },
    { property: "og:title", content: "Log in — The Book Cabinet" },
    { property: "og:description", content: "Log in to your personal book cabinet." },
  ] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(getPendingEmail());
  const [password, setPassword] = useState("");
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setMsg("Enter your email and password."); return; }
    setBusy(true); setErrs({}); setMsg("");
    const em = email.trim();
    setPendingEmail(em);
    try {
      const d = await Api.login({ email: em, password });
      setToken(d.token);
      navigate({ to: "/", replace: true });
    } catch (err) {
      const p = parseApiError(err, "Could not log in.");
      if (p.status === 403) {
        Api.resendOtp(em).catch(() => {});
        navigate({ to: "/verify-email" });
        return;
      }
      if (p.status === 401) setMsg("Invalid email or password.");
      else { setErrs(p.fieldErrors); if (!Object.keys(p.fieldErrors).length) setMsg(p.message); }
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Your shelves are waiting."
      footer={<>New here? <Link to="/signup">Sign up</Link></>}>
      <form onSubmit={submit} noValidate>
        <Field id="email" label="Email" error={errs.email}>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field id="password" label="Password" error={errs.password}>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <p className="right small"><Link to="/forgot-password" onClick={() => email && setPendingEmail(email)}>Forgot password?</Link></p>
        {msg && <p className="error-text" role="alert">{msg}</p>}
        <button className="btn btn--primary btn--block" disabled={busy}>{busy ? <Spinner /> : "Log in"}</button>
      </form>
    </AuthShell>
  );
}
