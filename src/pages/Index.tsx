import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import PaymentMethodsSection from "@/components/landing/PaymentMethodsSection";
import IntegrationBlocks from "@/components/landing/IntegrationBlocks";
import Features from "@/components/landing/Features";
import Pricing from "@/components/landing/Pricing";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import { SocialProofPopup } from "@/components/social-proof/SocialProofPopup";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <PaymentMethodsSection />
        <IntegrationBlocks />
        <Features />
        <Pricing />
        <CTA />
      </main>
      <Footer />
      <SocialProofPopup currentPage="landing" />
    </div>
  );
};

export default Index;
