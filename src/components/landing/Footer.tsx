import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="py-12 px-4 bg-muted/30 border-t border-border/50">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4 group">
              <img src={logo} alt="SalãoCashBack" className="w-10 h-10 transition-transform group-hover:scale-110" />
              <span className="font-display font-bold text-xl text-gradient-orange">SalãoCashBack</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-md">
              A plataforma completa para negócios que querem crescer no automático com agendamento inteligente, pagamentos e marketing.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-4 text-foreground">Produto</h4>
            <ul className="space-y-2">
              {[
                { label: "Funcionalidades", href: "#features" },
                { label: "Preços", href: "#pricing" },
              ].map(l => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <Link to="/afiliado-saas/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Quero ser afiliado
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-4 text-foreground">Legal</h4>
            <ul className="space-y-2">
              {["Termos de Uso", "Privacidade", "Cookies"].map(l => (
                <li key={l}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SalãoCashBack. Todos os direitos reservados.
          </p>
          <span className="text-xs text-muted-foreground/60">
            Pagamentos processados por ASAAS
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
