import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { OtpInput } from "@/components/OtpInput";
import { Field, Spinner } from "@/components/ui-basic";
import { useCooldown } from "@/hooks/useCooldown";
import { Api, getPendingEmail, parseApiError, setPendingEmail, setToken } from "@/lib/api";
import { toast } from "@/lib/toast";

export const Route = createFileRoute("/verify-email")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Verify your email — The Book Cabinet" },
    { name: "description", content: "Enter the six-digit code we emailed you." },
    { property: "og:title", content: "Verify your email — The Book Cabinet" },
    { property: "og:description", content: "Enter the six-digit code we emailed you." },
  ] }),
  component: Verify,
});

function Verify() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(getPendingEmail());
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const cd = useCooldown();

  useEffect(() => { cd.start(45); /* code was just sent */ }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const verify = async (code = otp) => {
    if (busy || code.length !== 6) return;
    if (!email) { setError("Enter your email first."); return; }
    setBusy(true); setError("");
    try {
      const data = await Api.verifyOtp({ email, otp: code });
      setToken(data.token);
      toast("Email verified. Welcome to your cabinet!", "success");
      navigate({ to: "/", replace: true });
    } catch (e) {
      const p = parseApiError(e);
      setError(p.status === 400 ? p.fieldErrors.otp || "That code is invalid, expired or already used." : p.message);
      setOtp("");
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await Api.resendOtp(email);
      toast("If your account is awaiting verification, a new code is on its way.");
      cd.start(45);
    } catch (e) {
      const p = parseApiError(e);
      toast(p.status === 429 ? "Too many code requests. Please try again later." : p.message, "error");
      if (p.status === 429) cd.start(60);
    } finally { setResending(false); }
  };

  return (
    <AuthShell title="Check your inbox" subtitle={email ? <>We sent a six-digit code to <strong>{email}</strong>.</> : "Enter the email you signed up with."}
      footer={<Link to="/login">Back to log in</Link>}>
      {!getPendingEmail() && (
        <Field id="email" label="Email">
          <input id="email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setPendingEmail(e.target.value); }} />
        </Field>
      )}
      <form onSubmit={(e) => { e.preventDefault(); verify(); }}>
        <OtpInput value={otp} onChange={setOtp} onComplete={verify} disabled={busy} invalid={!!error} />
        {error && <p className="error-text center" role="alert">{error}</p>}
        <button className="btn btn--primary btn--block" disabled={busy || otp.length !== 6}>{busy ? <Spinner /> : "Verify"}</button>
      </form>
      <button className="btn btn--ghost btn--block" onClick={resend} disabled={resending || cd.left > 0 || !email}>
        {resending ? <Spinner /> : cd.left > 0 ? `Resend code in ${cd.left}s` : "Resend code"}
      </button>
    </AuthShell>
  );
}
