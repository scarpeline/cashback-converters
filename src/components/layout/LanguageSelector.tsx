import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';

const languages = [
  { code: 'pt', name: 'Português', flag: 'BR' },
  { code: 'en', name: 'English', flag: 'US' },
  { code: 'es', name: 'Español', flag: 'ES' },
  { code: 'fr', name: 'Français', flag: 'FR' },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-bold transition-premium border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white backdrop-blur-xl shadow-premium group"
          id="language-menu-button"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <Globe className="h-4.5 w-4.5 mr-2.5 text-orange-400 group-hover:rotate-[30deg] transition-premium" />
          <span className="hidden sm:inline tracking-tight">{currentLanguage.name}</span>
          <span className="sm:hidden font-black text-xs tracking-widest">{currentLanguage.code.toUpperCase()}</span>
        </button>
      </div>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div
            className="absolute right-1/2 translate-x-1/2 sm:right-0 sm:translate-x-0 z-20 mt-4 w-60 origin-top rounded-[2rem] bg-slate-950/80 border border-white/10 shadow-premium backdrop-blur-[20px] ring-1 ring-white/10 focus:outline-none overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="language-menu-button"
          >
            <div className="p-3 space-y-1.5" role="none">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`flex items-center justify-between w-full px-4 py-3.5 text-sm rounded-2xl transition-premium ${
                    i18n.language === lang.code
                      ? 'bg-gradient-orange text-white font-black shadow-gold'
                      : 'text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                  role="menuitem"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xl filter drop-shadow-md">{lang.flag === 'BR' ? '🇧🇷' : lang.flag === 'US' ? '🇺🇸' : lang.flag === 'ES' ? '🇪🇸' : '🇫🇷'}</span>
                    <span className="font-medium tracking-tight">{lang.name}</span>
                  </span>
                  {i18n.language === lang.code && (
                    <div className="bg-white/20 backdrop-blur-md rounded-full p-1 border border-white/30">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
