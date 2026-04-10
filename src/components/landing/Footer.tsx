import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 px-4 bg-slate-950 border-t border-white/5">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">AgendaPRO</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6">
            <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Funcionalidades</a>
            <a href="#pricing" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Preços</a>
            <Link to="/seja-um-franqueado" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Parceiros</Link>
            <a href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Termos</a>
            <a href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Privacidade</a>
          </nav>
        </div>

        <div className="h-px bg-white/5 mb-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-sm text-slate-500">
          <p>2025 AgendaPRO. Todos os direitos reservados.</p>
          <p>Feito no Brasil 🇧🇷</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
