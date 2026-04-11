import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Users, CheckCircle } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            Comece agora e <span className="text-orange-500">cresça seu negócio</span>
          </h2>
          <p className="text-slate-600 mb-8">
            7 dias grátis para testar todas as funcionalidades. Sem compromisso.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <Link to="/onboarding">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 h-auto text-base font-semibold rounded-xl shadow-lg shadow-orange-500/25">
                Começar Grátis 7 Dias
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/seja-um-franqueado">
              <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-3 h-auto text-base font-medium rounded-xl">
                Seja um Parceiro
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Multi-nicho
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-500" />
              IA integrada
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Sem risco
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
