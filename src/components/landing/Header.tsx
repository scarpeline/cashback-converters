import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { useTranslation } from "react-i18next";

const Header = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { label: t("be_franchisee") || "Seja um Franqueado", href: "/seja-um-franqueado" },
    { label: t("features") || "Funcionalidades", href: "#features" },
    { label: t("pricing") || "Preços", href: "#pricing" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg border-b" style={{ background: "hsl(222 47% 6% / 0.9)", borderColor: "hsl(222 20% 18%)" }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="SalãoCashBack" className="w-10 h-10 lg:w-12 lg:h-12" />
            <span className="font-display font-bold text-lg lg:text-xl text-gradient-gold">SalãoCashBack</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-sm font-medium transition-colors" style={{ color: "hsl(220 9% 65%)" }} onMouseEnter={e => (e.target as HTMLElement).style.color = "hsl(42 100% 55%)"} onMouseLeave={e => (e.target as HTMLElement).style.color = "hsl(220 9% 65%)"}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <LanguageSelector />
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">{t("enter")}</Button>
            </Link>
            <Link to="/login">
              <Button variant="gold" size="sm">{t("get_started")}</Button>
            </Link>
            {/* Botão Seja um Franqueado removido temporariamente
            <Link to="/seja-um-franqueado">
              <Button variant="outline" size="sm" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                {t("be_franchisee")}
              </Button>
            </Link>
            */}
          </div>

          <button className="md:hidden p-2" style={{ color: "hsl(0 0% 98%)" }} onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 animate-fade-in" style={{ borderTop: "1px solid hsl(222 20% 18%)" }}>
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a key={link.label} href={link.href} className="text-sm font-medium py-2" style={{ color: "hsl(220 9% 65%)" }} onClick={() => setIsMenuOpen(false)}>
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4" style={{ borderTop: "1px solid hsl(222 20% 18%)" }}>
                <div className="flex justify-center mb-2">
                  <LanguageSelector />
                </div>
                <Link to="/login" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                  <Button variant="ghost" className="w-full justify-center text-white/70">{t("enter")}</Button>
                </Link>
                <Link to="/login" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                  <Button variant="gold" className="w-full justify-center">{t("get_started")}</Button>
                </Link>
<<<<<<< HEAD
                {/* Botão Seja um Franqueado removido temporariamente
                <Link to="/seja-um-franqueado" onClick={() => setIsMenuOpen(false)}>
=======
                <Link to="/seja-um-franqueado" onClick={() => setIsMenuOpen(!isMenuOpen)}>
>>>>>>> origin/main
                  <Button variant="outline" className="w-full justify-center border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                    {t("be_franchisee")}
                  </Button>
                </Link>
                */}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
