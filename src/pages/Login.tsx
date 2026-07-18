import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";
import { rolePath, useActions, useStore } from "@/lib/store";
import { Navigate } from "react-router-dom";

export default function Login() {
  const { currentUser } = useStore();
  const { login } = useActions();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (currentUser) return <Navigate to={rolePath[currentUser.role]} replace />;

  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const result = await login(username.trim(), password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Login gagal.");
      return;
    }
    setError("");
    navigate("/");
  };

  return (
    <main className="sh-login">
      <form className="sh-login__card" onSubmit={onSubmit}>
        <div className="sh-login__brand">
          <BrandMark />
        </div>
        <h1 className="sh-login__title">Login Sponsorship</h1>
        <p className="sh-login__sub">
          Masuk dengan salah satu akun demo di bawah.
        </p>

        <div className="sh-field">
          <label className="sh-field__label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            autoFocus
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Admin / organisasi / pendana"
          />
        </div>

        <div className="sh-field">
          <label className="sh-field__label" htmlFor="password">
            Kata sandi
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan kata sandi"
          />
        </div>

        {error && <div className="sh-notice sh-notice--failed">{error}</div>}

        <button
          className="sh-btn sh-btn--primary"
          type="submit"
          style={{ width: "100%" }}
          disabled={busy}
        >
          {busy ? "Memproses…" : "Masuk"}
        </button>

        <div className="sh-login__demo">
          <div style={{ marginBottom: 6 }}>
            <strong>Akun demo</strong> — kata sandi: <code>Akundemo12345</code>
          </div>
          <div>
            Admin: <code>Admin</code> · Organisasi: <code>organisasi</code>
          </div>
          <div style={{ marginTop: 4 }}>
            Pendana: <code>pendana</code> · <code>pendana2</code> · <code>pendana3</code>{" "}
            (tiap akun hanya mengakses 1 pendana)
          </div>
        </div>
      </form>
    </main>
  );
}
