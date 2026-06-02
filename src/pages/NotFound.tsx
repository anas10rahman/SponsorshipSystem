import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { rolePath, useStore } from "@/lib/store";

export default function NotFound() {
  const { currentUser } = useStore();
  const navigate = useNavigate();
  const home = currentUser ? rolePath[currentUser.role] : "/login";

  return (
    <main
      className="sh-login"
      style={{ flexDirection: "column", textAlign: "center" }}
    >
      <div className="sh-login__card" style={{ alignItems: "center" }}>
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "var(--brand-500)",
            letterSpacing: "-0.04em",
          }}
        >
          404
        </div>
        <h1 className="sh-login__title">Halaman tidak ditemukan</h1>
        <p className="sh-login__sub">
          URL yang Anda buka tidak tersedia atau bukan untuk peran Anda.
        </p>
        <div className="sh-row" style={{ gap: 8, marginTop: 8 }}>
          <button
            className="sh-btn sh-btn--secondary"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} />
            Kembali
          </button>
          <Link to={home} className="sh-btn sh-btn--primary">
            Ke beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
