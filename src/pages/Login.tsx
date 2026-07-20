import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";
import { rolePath, useActions, useStore } from "@/lib/store";

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
      if (result.needsVerification) {
        navigate(`/verify?email=${encodeURIComponent(result.email ?? "")}`);
        return;
      }
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
        <p className="sh-login__sub">Masuk ke akun Anda, atau daftar akun baru.</p>

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
            placeholder="Username"
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

        <Link
          to="/register"
          className="sh-btn sh-btn--secondary"
          style={{ width: "100%", justifyContent: "center" }}
        >
          Registrasi akun baru
        </Link>

        <div className="sh-login__demo" style={{ textAlign: "center" }}>
          Belum punya akun?{" "}
          <Link to="/register" style={{ fontWeight: 700 }}>
            Daftar sebagai organisasi / pendana
          </Link>
        </div>
      </form>
    </main>
  );
}
