import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import PortfolioCarousel from "@/components/landing/PortfolioCarousel";
import SocialProof from "@/components/landing/SocialProof";
import Pricing from "@/components/landing/Pricing";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import { SocialProofPopup } from "@/components/social-proof/SocialProofPopup";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-16">
        <Hero />
        <HowItWorks />
        <Features />
        <PortfolioCarousel />
        <SocialProof />
        <Pricing />
        <CTA />
      </main>
      <Footer />
      <SocialProofPopup currentPage="landing" />
    </div>
  );
};

export default Index;
