import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { label: "Funcionalidades", href: "#features" },
    { label: "Planos", href: "#pricing" },
    { label: "Parceiros", href: "/seja-um-franqueado" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">AgendaPRO</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              link.href.startsWith('/') ? (
                <Link key={link.label} to={link.href} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                  {link.label}
                </Link>
              ) : (
                <a key={link.label} href={link.href} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                  {link.label}
                </a>
              )
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                Entrar
              </Button>
            </Link>
            <Link to="/onboarding">
              <Button size="sm" className="bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white px-5 rounded-xl font-semibold shadow-lg shadow-indigo-500/20">
                Criar Conta
              </Button>
            </Link>
          </div>

          <button 
            className="md:hidden p-2 rounded-lg hover:bg-white/5 text-slate-400" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/5">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                link.href.startsWith('/') ? (
                  <Link key={link.label} to={link.href} className="text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/5 text-slate-400" onClick={() => setIsMenuOpen(false)}>
                    {link.label}
                  </Link>
                ) : (
                  <a key={link.label} href={link.href} className="text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/5 text-slate-400" onClick={() => setIsMenuOpen(false)}>
                    {link.label}
                  </a>
                )
              ))}
              <div className="flex gap-2 px-4 pt-4 border-t border-white/5 mt-2">
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="flex-1">
                  <Button variant="outline" className="w-full text-sm border-white/10 text-slate-300">Entrar</Button>
                </Link>
                <Link to="/onboarding" onClick={() => setIsMenuOpen(false)} className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-sm">Criar Conta</Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
