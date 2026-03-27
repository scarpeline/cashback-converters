import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="py-12 px-4" style={{ background: "hsl(222 47% 6%)", borderTop: "1px solid hsl(222 20% 18%)" }}>
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img src={logo} alt="SalãoCashBack" className="w-10 h-10" />
              <span className="font-display font-bold text-xl text-gradient-gold">SalãoCashBack</span>
            </Link>
            <p className="text-sm max-w-md" style={{ color: "hsl(220 9% 55%)" }}>
              A plataforma completa para barbearias e salões que querem crescer no automático.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-4" style={{ color: "hsl(0 0% 90%)" }}>Produto</h4>
            <ul className="space-y-2">
              {[
                { label: "Funcionalidades", href: "#features" },
                { label: "Preços", href: "#pricing" },
                { label: "Programa de Afiliados", href: "#affiliates" },
              ].map(l => (
                <li key={l.label}><a href={l.href} className="text-sm transition-colors" style={{ color: "hsl(220 9% 50%)" }}>{l.label}</a></li>
              ))}
              <li><Link to="/afiliado-saas/login" className="text-sm" style={{ color: "hsl(220 9% 50%)" }}>Quero ser afiliado</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-4" style={{ color: "hsl(0 0% 90%)" }}>Legal</h4>
            <ul className="space-y-2">
              {["Termos de Uso", "Privacidade", "Cookies"].map(l => (
                <li key={l}><a href="#" className="text-sm" style={{ color: "hsl(220 9% 50%)" }}>{l}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: "1px solid hsl(222 20% 18%)" }}>
          <p className="text-sm" style={{ color: "hsl(220 9% 45%)" }}>© {new Date().getFullYear()} SalãoCashBack. Todos os direitos reservados.</p>
          <span className="text-xs" style={{ color: "hsl(220 9% 40%)" }}>Pagamentos processados por ASAAS</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
