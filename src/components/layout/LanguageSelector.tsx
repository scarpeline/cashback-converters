import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

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
  const flagEmoji = currentLanguage.flag === 'BR' ? '🇧🇷' : currentLanguage.flag === 'US' ? '🇺🇸' : currentLanguage.flag === 'ES' ? '🇪🇸' : '🇫🇷';

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-2xl transition-all duration-300 hover:scale-110"
          id="language-menu-button"
          aria-expanded={isOpen}
          aria-haspopup="true"
          title={currentLanguage.name}
        >
          {flagEmoji}
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
                      ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                  role="menuitem"
                >
                  <span className="flex items-center">
                    <span className="mr-3 text-xl">{lang.flag === 'BR' ? '🇧🇷' : lang.flag === 'US' ? '🇺🇸' : lang.flag === 'ES' ? '🇪🇸' : '🇫🇷'}</span>
                    {lang.name}
                  </span>
                  {i18n.language === lang.code && (
                    <div className="bg-blue-600 rounded-full p-0.5">
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
