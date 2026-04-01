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
    { label: t("be_franchisee"), href: "/seja-um-franqueado" },
    { label: t("features"), href: "#features" },
    { label: t("pricing"), href: "#pricing" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-premium" style={{ background: "rgba(10, 15, 30, 0.7)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20 lg:h-24">
          <Link to="/" className="flex items-center gap-4 hover-scale group">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500 blur-lg opacity-20 group-hover:opacity-40 transition-premium" />
              <img src={logo} alt="SalãoCashBack" className="relative w-12 h-12 lg:w-14 lg:h-14 drop-shadow-2xl" />
            </div>
            <span className="font-display font-black text-xl lg:text-3xl text-gradient-gold tracking-tight">SalãoCashBack</span>
          </Link>

          <nav className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-sm font-bold tracking-wide transition-premium text-slate-400 hover:text-orange-400 hover:text-glow-orange">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-6">
            <LanguageSelector />
            <div className="h-6 w-px bg-white/10 mx-2" />
            <Link to="/login" className="hover-scale">
              <Button variant="ghost" size="sm" className="font-bold text-slate-300 hover:text-white hover:bg-white/5">{t("enter")}</Button>
            </Link>
            <Link to="/login" className="hover-scale">
              <Button variant="gold" size="default" className="shadow-gold px-8 font-black">{t("get_started")}</Button>
            </Link>
          </div>

          <button className="md:hidden p-3 rounded-2xl bg-white/5 border border-white/10 active:scale-95 transition-premium" style={{ color: "hsl(0 0% 98%)" }} onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-6 animate-in fade-in slide-in-from-top-4 duration-300 border-t border-white/10">
            <nav className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <a key={link.label} href={link.href} className="text-lg font-bold px-4 py-2 rounded-2xl hover:bg-white/5 transition-premium text-slate-300" onClick={() => setIsMenuOpen(false)}>
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-4 pt-6 border-t border-white/10">
                <div className="flex justify-start px-4">
                  <LanguageSelector />
                </div>
                <div className="grid grid-cols-2 gap-4 px-4">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full font-bold text-slate-300">{t("enter")}</Button>
                  </Link>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="gold" className="w-full font-black shadow-gold">{t("get_started")}</Button>
                  </Link>
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
