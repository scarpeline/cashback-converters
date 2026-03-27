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
          className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white backdrop-blur-md shadow-premium group"
          id="language-menu-button"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <Globe className="h-4 w-4 mr-2 text-orange-400 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">{currentLanguage.name}</span>
          <span className="sm:hidden uppercase">{currentLanguage.code}</span>
        </button>
      </div>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div
            className="absolute right-1/2 translate-x-1/2 sm:right-0 sm:translate-x-0 z-20 mt-3 w-56 origin-top rounded-2xl bg-slate-950/90 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl ring-1 ring-white/20 focus:outline-none overflow-hidden animate-in fade-in zoom-in duration-200"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="language-menu-button"
          >
            <div className="p-2 space-y-1" role="none">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`flex items-center justify-between w-full px-4 py-3 text-sm rounded-xl transition-all duration-200 ${
                    i18n.language === lang.code
                      ? 'bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                  role="menuitem"
                >
                  <span className="flex items-center">
                    <span className="mr-3 text-xl">{lang.flag === 'BR' ? '🇧🇷' : lang.flag === 'US' ? '🇺🇸' : lang.flag === 'ES' ? '🇪🇸' : '🇫🇷'}</span>
                    {lang.name}
                  </span>
                  {i18n.language === lang.code && (
                    <div className="bg-orange-500 rounded-full p-0.5">
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
