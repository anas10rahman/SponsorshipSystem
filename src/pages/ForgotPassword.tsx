import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";
import { rolePath, useActions, useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { passwordRules, validatePassword } from "@/lib/password";
import { Check, X } from "lucide-react";

/* Alur reset password (OTP):
   Fase 1 (email)  → minta kode. Respons SELALU netral (anti-enumeration).
   Fase 2 (reset)  → masukkan kode + kata sandi baru (dengan checklist kekuatan). */
export default function ForgotPassword() {
  const { currentUser } = useStore();
  const { forgotPassword, resetPassword } = useActions();
  const toast = useToast();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (currentUser) return <Navigate to={rolePath[currentUser.role]} replace />;

  const rules = passwordRules(password);

  const onRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError("Masukkan alamat email yang valid.");
      return;
    }
    setBusy(true);
    const r = await forgotPassword(email);
    setBusy(false);
    if (!r.ok) {
      setError(r.error ?? "Gagal mengirim kode reset.");
      return;
    }
    // Pesan netral: kita tidak pernah memberi tahu apakah email terdaftar.
    toast.success(r.message ?? "Jika email terdaftar, kode reset telah dikirim.");
    setPhase("reset");
  };

  const onReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Masukkan 6 digit kode dari email.");
      return;
    }
    const pwErr = validatePassword(password);
    if (pwErr) {
      setError(pwErr);
      return;
    }
    if (password !== confirm) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    setBusy(true);
    const r = await resetPassword(email, code, password);
    setBusy(false);
    if (!r.ok) {
      setError(r.error ?? "Gagal reset kata sandi.");
      return;
    }
    toast.success("Kata sandi berhasil diubah. Silakan masuk.");
    navigate("/login");
  };

  return (
    <main className="sh-login">
      {phase === "email" ? (
        <form className="sh-login__card" onSubmit={onRequest}>
          <div className="sh-login__brand">
            <BrandMark />
          </div>
          <h1 className="sh-login__title">Lupa kata sandi</h1>
          <p className="sh-login__sub">
            Masukkan email akun Anda. Kami akan mengirim kode 6 digit untuk mengatur ulang kata
            sandi.
          </p>

          <div className="sh-field">
            <label className="sh-field__label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              autoFocus
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
            />
          </div>

          {error && <div className="sh-notice sh-notice--failed">{error}</div>}

          <button
            className="sh-btn sh-btn--primary"
            type="submit"
            style={{ width: "100%" }}
            disabled={busy}
          >
            {busy ? "Mengirim…" : "Kirim kode"}
          </button>

          <div className="sh-login__demo" style={{ textAlign: "center" }}>
            Ingat kata sandi?{" "}
            <Link to="/login" style={{ fontWeight: 700 }}>
              Kembali ke login
            </Link>
          </div>
        </form>
      ) : (
        <form className="sh-login__card" onSubmit={onReset}>
          <div className="sh-login__brand">
            <BrandMark />
          </div>
          <h1 className="sh-login__title">Atur ulang kata sandi</h1>
          <p className="sh-login__sub">
            Masukkan kode yang dikirim ke <strong>{email}</strong> beserta kata sandi baru Anda.
          </p>

          <div className="sh-field">
            <label className="sh-field__label">Kode reset</label>
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

          <div className="sh-field">
            <label className="sh-field__label" htmlFor="new-password">
              Kata sandi baru
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Kata sandi baru"
            />
          </div>

          {password.length > 0 && (
            <ul
              style={{
                listStyle: "none",
                margin: "-4px 0 4px",
                padding: 0,
                display: "grid",
                gap: 4,
                fontSize: 13,
              }}
            >
              {rules.map((rule) => (
                <li
                  key={rule.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: rule.ok ? "#16a34a" : "#98989f",
                  }}
                >
                  {rule.ok ? <Check size={14} /> : <X size={14} />}
                  {rule.label}
                </li>
              ))}
            </ul>
          )}

          <div className="sh-field">
            <label className="sh-field__label" htmlFor="confirm-password">
              Konfirmasi kata sandi baru
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Ulangi kata sandi baru"
            />
          </div>

          {error && <div className="sh-notice sh-notice--failed">{error}</div>}

          <button
            className="sh-btn sh-btn--primary"
            type="submit"
            style={{ width: "100%" }}
            disabled={busy}
          >
            {busy ? "Menyimpan…" : "Reset kata sandi"}
          </button>

          <button
            type="button"
            className="sh-btn sh-btn--secondary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => {
              setPhase("email");
              setError("");
            }}
            disabled={busy}
          >
            Ganti email / kirim ulang kode
          </button>

          <div className="sh-login__demo" style={{ textAlign: "center" }}>
            <Link to="/login" style={{ fontWeight: 700 }}>
              Kembali ke login
            </Link>
          </div>
        </form>
      )}
    </main>
  );
}
