import { Faq } from "@/components/landing/Faq";
import { Features } from "@/components/landing/Features";
import { FinalCta } from "@/components/landing/FinalCta";
import { ForWho } from "@/components/landing/ForWho";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingNav } from "@/components/landing/LandingNav";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { useReveal } from "@/components/landing/useReveal";

/** Halaman publik di "/" — dirender tanpa menunggu data ter-hydrate,
 *  jadi pengunjung anonim tidak pernah melihat layar "Memuat data…". */
export default function Landing() {
  useReveal();

  return (
    <div className="lp">
      <LandingNav />
      <main>
        <LandingHero />
        <HowItWorks />
        <ForWho />
        <Features />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
