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
          className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm"
          id="language-menu-button"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <Globe className="h-4 w-4 mr-2" />
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
            className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-xl bg-slate-900 border border-slate-700 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="language-menu-button"
          >
            <div className="py-1" role="none">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`flex items-center justify-between w-full px-4 py-2 text-sm transition-colors ${
                    i18n.language === lang.code
                      ? 'bg-blue-600/10 text-blue-400 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  role="menuitem"
                >
                  <span className="flex items-center">
                    <span className="mr-3 text-lg">{lang.flag === 'BR' ? '🇧🇷' : lang.flag === 'US' ? '🇺🇸' : lang.flag === 'ES' ? '🇪🇸' : '🇫🇷'}</span>
                    {lang.name}
                  </span>
                  {i18n.language === lang.code && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
