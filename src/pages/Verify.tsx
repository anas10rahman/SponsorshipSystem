import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";
import { rolePath, useActions, useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";

export default function Verify() {
  const { currentUser } = useStore();
  const { verifyEmail, resendCode } = useActions();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const email = params.get("email") ?? "";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  if (currentUser) return <Navigate to={rolePath[currentUser.role]} replace />;
  if (!email) return <Navigate to="/login" replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setBusy(true);
    const result = await verifyEmail(email, code.trim());
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Verification failed.");
      return;
    }
    toast.success("Email verified. Welcome!");
    navigate("/");
  };

  const onResend = async () => {
    setResending(true);
    const r = await resendCode(email);
    setResending(false);
    if (!r.ok) {
      toast.failed(r.error ?? "Resend failed.");
      return;
    }
    toast.success(
      r.emailSent ? "A new code has been sent to your email." : "Code created, but the email could not be sent.",
    );
  };

  return (
    <main className="sh-login">
      <form className="sh-login__card" onSubmit={onSubmit}>
        <div className="sh-login__brand">
          <BrandMark />
        </div>
        <h1 className="sh-login__title">Verify email</h1>
        <p className="sh-login__sub">
          We sent a 6-digit code to <strong>{email}</strong>. Masukkan kode di bawah untuk
          mengaktifkan akun.
        </p>

        <div className="sh-field">
          <label className="sh-field__label">Verification code</label>
          <input
            autoFocus
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6 digit"
            style={{ letterSpacing: 6, fontSize: 18, textAlign: "center" }}
          />
        </div>

        {error && <div className="sh-notice sh-notice--failed">{error}</div>}

        <button
          className="sh-btn sh-btn--primary"
          type="submit"
          style={{ width: "100%" }}
          disabled={busy}
        >
          {busy ? "Verifying…" : "Verify & sign in"}
        </button>

        <button
          type="button"
          className="sh-btn sh-btn--secondary"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={onResend}
          disabled={resending}
        >
          {resending ? "Sending…" : "Resend code"}
        </button>

        <div className="sh-login__demo" style={{ textAlign: "center" }}>
          Salah email?{" "}
          <Link to="/register" style={{ fontWeight: 700 }}>
            Sign up again
          </Link>{" "}
          ·{" "}
          <Link to="/login" style={{ fontWeight: 700 }}>
            Sign in
          </Link>
        </div>
      </form>
    </main>
  );
}
