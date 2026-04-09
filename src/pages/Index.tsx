import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import PaymentMethodsSection from "@/components/landing/PaymentMethodsSection";
import IntegrationBlocks from "@/components/landing/IntegrationBlocks";
import Features from "@/components/landing/Features";
import AllFeatures from "@/components/landing/AllFeatures";
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
        <PaymentMethodsSection />
        <IntegrationBlocks />
        <Features />
        <AllFeatures />
        <Pricing />
        <CTA />
      </main>
      <Footer />
      <SocialProofPopup currentPage="landing" />
    </div>
  );
};

export default Index;
