import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";
import { rolePath, useActions, useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { Building2, HandCoins, ArrowLeft, Check, X } from "lucide-react";
import { PasswordInput } from "@/components/PasswordInput";
import { passwordRules, validatePassword } from "@/lib/password";

type Role = "org" | "funder";
const FUNDER_TYPES = ["Korporasi", "Individu", "Filantropi", "Perbankan"] as const;

export default function Register() {
  const { currentUser } = useStore();
  const { register } = useActions();
  const toast = useToast();
  const navigate = useNavigate();

  const [role, setRole] = useState<Role | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    confirm: "",
    category: "",
    city: "",
    type: "Korporasi" as (typeof FUNDER_TYPES)[number],
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (currentUser) return <Navigate to={rolePath[currentUser.role]} replace />;

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.username.trim() || !form.password) {
      setError("Fill in all required fields.");
      return;
    }
    const pwErr = validatePassword(form.password);
    if (pwErr) {
      setError(pwErr);
      return;
    }
    if (form.password !== form.confirm) {
      setError("Password confirmation does not match.");
      return;
    }
    setBusy(true);
    const payload =
      role === "org"
        ? {
            role,
            name: form.name.trim(),
            email: form.email.trim(),
            username: form.username.trim(),
            password: form.password,
            category: form.category.trim(),
            city: form.city.trim(),
          }
        : {
            role,
            name: form.name.trim(),
            email: form.email.trim(),
            username: form.username.trim(),
            password: form.password,
            type: form.type,
          };
    const result = await register(payload);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Registration failed.");
      return;
    }
    if (result.needsVerification) {
      if (result.emailSent === false)
        toast.failed("The code email failed to send — try 'Resend code' on the next page.");
      navigate(`/verify?email=${encodeURIComponent(result.email ?? form.email.trim())}`);
      return;
    }
    navigate("/"); // fallback: provider email belum diset → langsung masuk
  };

  // --- Langkah 1: pilih peran ---
  if (!role) {
    return (
      <main className="sh-login">
        <div className="sh-login__card">
          <div className="sh-login__brand">
            <Link
              to="/"
              title="Back to home"
              aria-label="Back to home"
              style={{ display: "inline-flex", textDecoration: "none" }}
            >
              <BrandMark />
            </Link>
          </div>
          <h1 className="sh-login__title">Create account</h1>
          <p className="sh-login__sub">Which role do you want to join as?</p>

          <div style={{ display: "grid", gap: 12, marginTop: 4 }}>
            <RoleOption
              icon={<Building2 size={22} />}
              title="Organization"
              desc="Submit sponsorship proposals to sponsor partners."
              onClick={() => setRole("org")}
            />
            <RoleOption
              icon={<HandCoins size={22} />}
              title="Sponsor Partner"
              desc="Review and fund submissions from organizations."
              onClick={() => setRole("funder")}
            />
          </div>

          <div className="sh-login__demo" style={{ textAlign: "center" }}>
            Sudah punya akun?{" "}
            <Link to="/login" style={{ fontWeight: 700 }}>
              Sign in here
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // --- Langkah 2: form ---
  const roleLabel = role === "org" ? "Organization" : "Sponsor Partner";
  return (
    <main className="sh-login">
      <form className="sh-login__card" onSubmit={onSubmit}>
        <div className="sh-login__brand">
          <Link
            to="/"
            title="Back to home"
            aria-label="Back to home"
            style={{ display: "inline-flex", textDecoration: "none" }}
          >
            <BrandMark />
          </Link>
        </div>
        <h1 className="sh-login__title">Daftar sebagai {roleLabel}</h1>
        <button
          type="button"
          className="sh-btn sh-btn--ghost sh-btn--sm"
          onClick={() => {
            setRole(null);
            setError("");
          }}
          style={{ alignSelf: "flex-start", marginTop: -4, marginBottom: 4 }}
        >
          <ArrowLeft size={14} />
          Ganti peran
        </button>

        <div className="sh-field">
          <label className="sh-field__label">
            {role === "org" ? "Organization name" : "Sponsor partner name"}
          </label>
          <input
            autoFocus
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder={role === "org" ? "Misal: Yayasan Seni Budaya" : "Misal: Sinergi Nusantara"}
          />
        </div>

        {role === "org" ? (
          <div className="sh-form-grid">
            <div className="sh-field">
              <label className="sh-field__label">Category</label>
              <input
                value={form.category}
                onChange={(e) => set({ category: e.target.value })}
                placeholder="Misal: Seni & Budaya"
              />
            </div>
            <div className="sh-field">
              <label className="sh-field__label">City</label>
              <input
                value={form.city}
                onChange={(e) => set({ city: e.target.value })}
                placeholder="Misal: Jakarta"
              />
            </div>
          </div>
        ) : (
          <div className="sh-field">
            <label className="sh-field__label">Sponsor partner type</label>
            <select
              value={form.type}
              onChange={(e) => set({ type: e.target.value as (typeof FUNDER_TYPES)[number] })}
            >
              {FUNDER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="sh-field">
          <label className="sh-field__label">Email</label>
          <input
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => set({ email: e.target.value })}
            placeholder="nama@email.com"
          />
        </div>

        <div className="sh-field">
          <label className="sh-field__label">Username</label>
          <input
            autoComplete="username"
            value={form.username}
            onChange={(e) => set({ username: e.target.value })}
            placeholder="For sign-in (letters/numbers, no spaces)"
          />
        </div>

        <div className="sh-form-grid">
          <div className="sh-field">
            <label className="sh-field__label">Password</label>
            <PasswordInput
              value={form.password}
              onChange={(v) => set({ password: v })}
              placeholder="Min. 8 characters, strong mix"
            />
            {form.password.length > 0 && (
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
                {passwordRules(form.password).map((rule) => (
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
            <label className="sh-field__label">Confirm password</label>
            <PasswordInput
              value={form.confirm}
              onChange={(v) => set({ confirm: v })}
              placeholder="Repeat password"
            />
          </div>
        </div>

        {error && <div className="sh-notice sh-notice--failed">{error}</div>}

        <button
          className="sh-btn sh-btn--primary"
          type="submit"
          style={{ width: "100%" }}
          disabled={busy}
        >
          {busy ? "Processing…" : "Create account & sign in"}
        </button>

        <div className="sh-login__demo" style={{ textAlign: "center" }}>
          Sudah punya akun?{" "}
          <Link to="/login" style={{ fontWeight: 700 }}>
            Sign in here
          </Link>
        </div>
      </form>
    </main>
  );
}

function RoleOption({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="sh-row"
      style={{
        gap: 14,
        textAlign: "left",
        padding: "16px 18px",
        border: "1px solid var(--line-strong)",
        borderRadius: "var(--radius-md)",
        background: "var(--surface)",
        cursor: "pointer",
        width: "100%",
      }}
    >
      <span
        style={{
          width: 44,
          height: 44,
          borderRadius: "var(--radius-md)",
          background: "var(--canvas-tint)",
          color: "var(--brand-600)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
        }}
      >
        {icon}
      </span>
      <span>
        <strong style={{ display: "block", fontSize: 15 }}>{title}</strong>
        <span className="sh-muted" style={{ fontSize: 13 }}>
          {desc}
        </span>
      </span>
    </button>
  );
}
