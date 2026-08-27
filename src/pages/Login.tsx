import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Lock, User } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { PasswordInput } from "@/components/PasswordInput";
import { rolePath, useActions, useStore } from "@/lib/store";

export default function Login() {
  const { currentUser } = useStore();
  const { login } = useActions();
  const navigate = useNavigate();

  // Semua hook dipanggil sebelum percabangan apa pun. Sebelumnya `busy`
  // dideklarasikan di bawah early return `currentUser`, sehingga jumlah hook
  // berubah begitu login berhasil dan React melempar "Rendered fewer hooks
  // than expected" pada setiap login.
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (currentUser) return <Navigate to={rolePath[currentUser.role]} replace />;

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
      setError(result.error ?? "Sign-in failed.");
      return;
    }
    setError("");
    navigate("/");
  };

  return (
    <main className="sh-auth">
      <div className="sh-auth__main">
        <form className="sh-auth__form" onSubmit={onSubmit}>
          <Link
            to="/"
            className="sh-auth__brand"
            title="Back to home"
            aria-label="Back to home"
          >
            <BrandMark size={30} />
          </Link>

          <h1 className="sh-auth__title">Sign in</h1>
          <p className="sh-auth__sub">
            Welcome back. Sign in to continue.
          </p>

          <label className="sh-auth__field" htmlFor="username">
            <User size={17} aria-hidden="true" />
            <input
              id="username"
              autoFocus
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
          </label>

          <label className="sh-auth__field" htmlFor="password">
            <Lock size={17} aria-hidden="true" />
            <PasswordInput
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              placeholder="Password"
            />
          </label>

          <div className="sh-auth__row">
            <Link to="/forgot">Forgot password?</Link>
          </div>

          {error && <div className="sh-notice sh-notice--failed">{error}</div>}

          <button className="sh-auth__submit" type="submit" disabled={busy}>
            {busy ? "Processing…" : "Sign in"}
          </button>

          <p className="sh-auth__foot">
            Don't have an account? <Link to="/register">Sign up now</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
