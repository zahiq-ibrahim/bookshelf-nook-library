import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { OtpInput } from "@/components/OtpInput";
import { Field, Spinner } from "@/components/ui-basic";
import { useCooldown } from "@/hooks/useCooldown";
import { Api, getPendingEmail, parseApiError, setPendingEmail } from "@/lib/api";
import { toast } from "@/lib/toast";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Reset password — The Book Cabinet" },
    { name: "description", content: "Choose a new password for your book cabinet." },
    { property: "og:title", content: "Reset password — The Book Cabinet" },
    { property: "og:description", content: "Choose a new password for your book cabinet." },
  ] }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(getPendingEmail());
  const [otp, setOtp] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const cd = useCooldown();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const l: Record<string, string> = {};
    if (!email) l.email = "Enter your email.";
    if (otp.length !== 6) l.otp = "Enter the six-digit code.";
    if (pw.length < 8 || pw.length > 72) l.newPassword = "Password must be 8 to 72 characters.";
    if (pw !== pw2) l.confirm = "Passwords do not match.";
    setErrs(l); setMsg("");
    if (Object.keys(l).length) return;
    setBusy(true);
    try {
      await Api.resetPassword({ email, otp, newPassword: pw });
      toast("Password reset. Log in with your new password.", "success");
      navigate({ to: "/login", replace: true });
    } catch (x) {
      const p = parseApiError(x);
      if (p.status === 404) setMsg("No account uses that email.");
      else if (Object.keys(p.fieldErrors).length) setErrs(p.fieldErrors);
      else setMsg(p.status === 400 ? "That code is invalid or expired." : p.message);
      setBusy(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await Api.resetPasswordRequest(email);
      toast("A new reset code has been sent.");
      cd.start(45);
    } catch (x) {
      const p = parseApiError(x);
      toast(p.status === 429 ? "Too many code requests. Please try again later." : p.status === 404 ? "No account uses that email." : p.message, "error");
    } finally { setResending(false); }
  };

  return (
    <AuthShell title="Set a new password" subtitle={email ? <>Code sent to <strong>{email}</strong>.</> : undefined}
      footer={<Link to="/login">Back to log in</Link>}>
      <form onSubmit={submit} noValidate>
        {!getPendingEmail() && (
          <Field id="email" label="Email" error={errs.email}>
            <input id="email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setPendingEmail(e.target.value); }} />
          </Field>
        )}
        <div className="field">
          <span className="label">Reset code</span>
          <OtpInput value={otp} onChange={setOtp} disabled={busy} invalid={!!errs.otp} />
          {errs.otp && <p className="field__error">{errs.otp}</p>}
        </div>
        <Field id="pw" label="New password" error={errs.newPassword}>
          <input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        <Field id="pw2" label="Confirm new password" error={errs.confirm}>
          <input id="pw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </Field>
        {msg && <p className="error-text" role="alert">{msg}</p>}
        <button className="btn btn--primary btn--block" disabled={busy}>{busy ? <Spinner /> : "Reset password"}</button>
      </form>
      <button className="btn btn--ghost btn--block" onClick={resend} disabled={resending || cd.left > 0 || !email}>
        {resending ? <Spinner /> : cd.left > 0 ? `Resend code in ${cd.left}s` : "Resend code"}
      </button>
    </AuthShell>
  );
}
