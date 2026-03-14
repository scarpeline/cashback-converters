import Header from "@/components/landing/Header";
import HeroNew from "@/components/landing/HeroNew";
import FeaturesShowcase from "@/components/landing/FeaturesShowcase";
import SocialProof from "@/components/landing/SocialProof";
import PricingNew from "@/components/landing/PricingNew";
import AppDownload from "@/components/landing/AppDownload";
import CTANew from "@/components/landing/CTANew";
import Footer from "@/components/landing/Footer";
import { SocialProofPopup } from "@/components/social-proof/SocialProofPopup";
import { Suspense } from "react";
import { PageLoader } from "@/components/ui/LoadingScreen";

const Index = () => {
  return (
    <div className="min-h-screen bg-slate-900">
      <Suspense fallback={<PageLoader />}>
        <Header />
        <main>
          <HeroNew />
          <FeaturesShowcase />
          <SocialProof />
          <PricingNew />
          <AppDownload />
          <CTANew />
        </main>
        <Footer />
        <SocialProofPopup currentPage="landing" />
      </Suspense>
    </div>
  );
};

export default Index;
