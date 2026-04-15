import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Calendar, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import LanguageSelector from "@/components/layout/LanguageSelector";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { label: "Funcionalidades", href: "#features" },
    { label: "Explorar", href: "/explorar" },
    { label: "Planos", href: "#pricing" },
    { label: "Parceiros", href: "/seja-um-franqueado" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900">AgendaPRO</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              link.href.startsWith('/') ? (
                <Link key={link.label} to={link.href} className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                  {link.label}
                </Link>
              ) : (
                <a key={link.label} href={link.href} className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                  {link.label}
                </a>
              )
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSelector />
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                Entrar
              </Button>
            </Link>
            <Link to="/onboarding">
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white px-4">
                Criar Conta
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-100">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                link.href.startsWith('/') ? (
                  <Link 
                    key={link.label} 
                    to={link.href} 
                    className="text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50 text-slate-600" 
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a 
                    key={link.label} 
                    href={link.href} 
                    className="text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50 text-slate-600" 
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                )
              ))}
              <div className="flex gap-2 px-4 pt-4 border-t border-slate-100 mt-2">
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="flex-1">
                  <Button variant="outline" className="w-full text-sm">Entrar</Button>
                </Link>
                  <Link to="/onboarding" onClick={() => setIsMenuOpen(false)} className="flex-1">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm">Criar Conta</Button>
                  </Link>
                </div>
                <div className="px-4 py-2 border-t border-slate-100 flex justify-center">
                  <LanguageSelector />
                </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
