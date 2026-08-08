import { About } from "@/components/landing/About";
import { Faq } from "@/components/landing/Faq";
import { ForWho } from "@/components/landing/ForWho";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingNav } from "@/components/landing/LandingNav";
import { ReadyToMatch } from "@/components/landing/ReadyToMatch";
import { useReveal } from "@/components/landing/useReveal";

/** Halaman publik di "/" — dirender tanpa menunggu data ter-hydrate,
 *  jadi pengunjung anonim tidak pernah melihat layar "Memuat data…".
 *  Struktur & naskah mengikuti Compro: Beranda, Tentang Kami,
 *  Untuk Siapa, Cara Kerja, Ready to Match, FAQ. */
export default function Landing() {
  useReveal();

  return (
    <div className="lp">
      <LandingNav />
      <main>
        <LandingHero />
        <About />
        <ForWho />
        <HowItWorks />
        <ReadyToMatch />
        <Faq />
      </main>
      <LandingFooter />
    </div>
  );
}
