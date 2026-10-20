import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Field, Spinner } from "@/components/ui-basic";
import { Api, getPendingEmail, parseApiError, setPendingEmail } from "@/lib/api";
import { toast } from "@/lib/toast";

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Forgot password — The Book Cabinet" },
    { name: "description", content: "Get a code to reset your password." },
    { property: "og:title", content: "Forgot password — The Book Cabinet" },
    { property: "og:description", content: "Get a code to reset your password." },
  ] }),
  component: Forgot,
});

function Forgot() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(getPendingEmail());
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const em = email.trim();
    if (!em) { setErr("Enter your email."); return; }
    setBusy(true); setErr("");
    try {
      await Api.resetPasswordRequest(em);
      setPendingEmail(em);
      toast("A reset code has been sent to your email.", "success");
      navigate({ to: "/reset-password" });
    } catch (x) {
      const p = parseApiError(x);
      setErr(p.status === 404 ? "No account uses that email." : p.fieldErrors.email || p.message);
      setBusy(false);
    }
  };
  return (
    <AuthShell title="Forgot your password?" subtitle="We'll email you a six-digit reset code."
      footer={<Link to="/login">Back to log in</Link>}>
      <form onSubmit={submit} noValidate>
        <Field id="email" label="Email" error={err}>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <button className="btn btn--primary btn--block" disabled={busy}>{busy ? <Spinner /> : "Send reset code"}</button>
      </form>
    </AuthShell>
  );
}
