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
      setError("Masukkan 6 digit kode dari email.");
      return;
    }
    setBusy(true);
    const result = await verifyEmail(email, code.trim());
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Verifikasi gagal.");
      return;
    }
    toast.success("Email terverifikasi. Selamat datang!");
    navigate("/");
  };

  const onResend = async () => {
    setResending(true);
    const r = await resendCode(email);
    setResending(false);
    if (!r.ok) {
      toast.failed(r.error ?? "Gagal kirim ulang.");
      return;
    }
    toast.success(
      r.emailSent ? "Kode baru dikirim ke email Anda." : "Kode dibuat, tapi email gagal terkirim.",
    );
  };

  return (
    <main className="sh-login">
      <form className="sh-login__card" onSubmit={onSubmit}>
        <div className="sh-login__brand">
          <BrandMark />
        </div>
        <h1 className="sh-login__title">Verifikasi email</h1>
        <p className="sh-login__sub">
          Kami mengirim kode 6 digit ke <strong>{email}</strong>. Masukkan kode di bawah untuk
          mengaktifkan akun.
        </p>

        <div className="sh-field">
          <label className="sh-field__label">Kode verifikasi</label>
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
          {busy ? "Memverifikasi…" : "Verifikasi & masuk"}
        </button>

        <button
          type="button"
          className="sh-btn sh-btn--secondary"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={onResend}
          disabled={resending}
        >
          {resending ? "Mengirim…" : "Kirim ulang kode"}
        </button>

        <div className="sh-login__demo" style={{ textAlign: "center" }}>
          Salah email?{" "}
          <Link to="/register" style={{ fontWeight: 700 }}>
            Daftar ulang
          </Link>{" "}
          ·{" "}
          <Link to="/login" style={{ fontWeight: 700 }}>
            Masuk
          </Link>
        </div>
      </form>
    </main>
  );
}
