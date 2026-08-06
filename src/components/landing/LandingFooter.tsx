import { Link } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";

export function LandingFooter() {
  return (
    <div className="lp-wrap">
      <footer className="lp-foot">
        <BrandMark size={24} />
        <nav className="lp-foot__links">
          <Link to="/kebijakan-privasi">Kebijakan Privasi</Link>
          <Link to="/syarat-ketentuan">Syarat &amp; Ketentuan</Link>
        </nav>
        <span>© {new Date().getFullYear()} DealMatch</span>
      </footer>
    </div>
  );
}
