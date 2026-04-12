import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useNiche } from "@/hooks/useNiche";
import { useNavigate } from "react-router-dom";

const Pricing = () => {
  const { t } = useTranslation();
  const { nicheLabel } = useNiche();
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-24 px-4 bg-white">
      <div className="container mx-auto">
        {/* Partnership CTA */}
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl p-8 lg:p-12 text-center" style={{ background: "linear-gradient(135deg, hsl(262 83% 45%), hsl(192 91% 42%))", border: "2px solid hsl(262 83% 58% / 0.3)" }}>
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="font-display text-2xl lg:text-3xl font-black mb-4 text-white">
              {t("pricing.partnership_title", { niche: nicheLabel })}
            </h3>
            <p className="text-lg mb-6 max-w-2xl mx-auto text-white/80">
              {t("pricing.partnership_desc", { niche: nicheLabel })}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 border-white/30 text-white hover:bg-white/10 font-bold" onClick={() => navigate("/seja-um-franqueado")}>
                {t("pricing.be_franchisee")}
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 border-white/10 text-white/80 hover:bg-white/5" onClick={() => navigate("/seja-um-franqueado")}>
                {t("pricing.view_partnership_models")}
              </Button>
            </div>
            <div className="mt-6 text-sm text-white/60">
              {t("partnership_benefits")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
