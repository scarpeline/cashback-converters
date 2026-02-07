import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import IntegrationBlocks from "@/components/landing/IntegrationBlocks";
import Features from "@/components/landing/Features";
import SimulatorSection from "@/components/landing/SimulatorSection";
import Pricing from "@/components/landing/Pricing";
import Affiliates from "@/components/landing/Affiliates";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <IntegrationBlocks />
        <Features />
        <SimulatorSection />
        <Pricing />
        <Affiliates />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
