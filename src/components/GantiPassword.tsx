import { useState } from "react";
import { KeyRound, Check, X } from "lucide-react";
import { useActions } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { PasswordInput } from "@/components/PasswordInput";
import { passwordRules, validatePassword } from "@/lib/password";

/* Kartu "Ganti kata sandi" untuk halaman Pengaturan (org/pendana/admin).
   Berbeda dari alur lupa password: user sudah masuk, jadi kata sandi lama
   wajib diisi sebagai verifikasi kepemilikan akun. */
export function GantiPassword() {
  const { changePassword } = useActions();
  const toast = useToast();

  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!current) {
      setError("Masukkan kata sandi saat ini.");
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
    const r = await changePassword(current, password);
    setBusy(false);
    if (!r.ok) {
      setError(r.error ?? "Gagal mengganti kata sandi.");
      return;
    }
    setCurrent("");
    setPassword("");
    setConfirm("");
    toast.success("Kata sandi berhasil diganti.");
  };

  return (
    <section className="sh-card">
      <form className="sh-card__body" onSubmit={onSubmit}>
        <div className="sh-row" style={{ gap: 14, marginBottom: 12 }}>
          <span className="sh-stat__icon">
            <KeyRound size={20} />
          </span>
          <div>
            <h3 style={{ marginBottom: 4 }}>Ganti kata sandi</h3>
            <p className="sh-muted">
              Demi keamanan, masukkan kata sandi saat ini sebelum menyetel yang baru.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
          <div className="sh-field">
            <label className="sh-field__label" htmlFor="current-password">
              Kata sandi saat ini
            </label>
            <PasswordInput
              id="current-password"
              autoComplete="current-password"
              value={current}
              onChange={setCurrent}
              placeholder="Kata sandi saat ini"
            />
          </div>

          <div className="sh-field">
            <label className="sh-field__label" htmlFor="change-new-password">
              Kata sandi baru
            </label>
            <PasswordInput
              id="change-new-password"
              value={password}
              onChange={setPassword}
              placeholder="Kata sandi baru"
            />
            {password.length > 0 && (
              <ul
                style={{
                  listStyle: "none",
                  margin: "6px 0 0",
                  padding: 0,
                  display: "grid",
                  gap: 4,
                  fontSize: 13,
                }}
              >
                {passwordRules(password).map((rule) => (
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
          </div>

          <div className="sh-field">
            <label className="sh-field__label" htmlFor="change-confirm-password">
              Konfirmasi kata sandi baru
            </label>
            <PasswordInput
              id="change-confirm-password"
              value={confirm}
              onChange={setConfirm}
              placeholder="Ulangi kata sandi baru"
            />
          </div>

          {error && <div className="sh-notice sh-notice--failed">{error}</div>}

          <button className="sh-btn sh-btn--primary" type="submit" disabled={busy}>
            {busy ? "Menyimpan…" : "Ganti kata sandi"}
          </button>
        </div>
      </form>
    </section>
  );
}
