import { About } from "@/components/landing/About";
import { ForWho } from "@/components/landing/ForWho";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingHero } from "@/components/landing/LandingHero";
import { PublicLayout } from "@/components/landing/PublicLayout";
import { ReadyToMatch } from "@/components/landing/ReadyToMatch";

/** Halaman "About Us" — sekaligus isi "/" untuk pengunjung anonim.
 *  Dirender tanpa menunggu data ter-hydrate, jadi pengunjung tidak pernah
 *  melihat layar "Loading data…". FAQ kini halaman tersendiri di /faq. */
export default function Landing() {
  return (
    <PublicLayout>
      <LandingHero />
      <About />
      <ForWho />
      <HowItWorks />
      <ReadyToMatch />
    </PublicLayout>
  );
}
