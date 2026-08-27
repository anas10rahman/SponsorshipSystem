import { Link } from "react-router-dom";
import { useStore } from "@/lib/store";

/** Email tujuan bantuan: diambil dari akun admin yang ada di sistem, supaya
 *  tidak ada alamat karangan. Bila belum ada admin, tautan Bantuan disembunyikan. */
export function useSupportEmail(): string | null {
  const { state } = useStore();
  return state.users.find((u) => u.role === "admin")?.email || null;
}

export function AppFooter() {
  const support = useSupportEmail();
  const year = new Date().getFullYear();
  return (
    <footer className="dm-footer">
      <span>© {year} DealMatch. All rights reserved.</span>
      <nav className="dm-footer__links">
        <Link to="/funder/kebijakan-privasi">Privacy Policy</Link>
        <span className="dm-footer__dot">•</span>
        <Link to="/funder/syarat-ketentuan">Terms &amp; Conditions</Link>
        {support && (
          <>
            <span className="dm-footer__dot">•</span>
            <a href={`mailto:${support}`}>Bantuan</a>
          </>
        )}
      </nav>
    </footer>
  );
}
