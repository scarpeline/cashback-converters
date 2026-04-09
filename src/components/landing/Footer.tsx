import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 px-4 bg-white border-t border-slate-100">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900">AgendaPRO</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Funcionalidades</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Preços</a>
            <Link to="/seja-um-franqueado" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Parceiros</Link>
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Termos</a>
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Privacidade</a>
          </nav>
        </div>

        <div className="h-px bg-slate-100 mb-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-sm text-slate-500">
          <p>2025 AgendaPRO. Todos os direitos reservados.</p>
          <p>Feito no Brasil</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
