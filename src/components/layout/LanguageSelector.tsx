import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown } from 'lucide-react';

const languages = [
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'English',   flag: '🇺🇸' },
  { code: 'es', name: 'Español',   flag: '🇪🇸' },
  { code: 'fr', name: 'Français',  flag: '🇫🇷' },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('i18nextLng');
    if (!savedLang) {
      const browserLang = navigator.language.split('-')[0];
      if (languages.some(l => l.code === browserLang)) {
        i18n.changeLanguage(browserLang);
      }
    }
  }, [i18n]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  const current = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline font-medium">{current.name}</span>
        <span className="sm:hidden font-medium uppercase text-xs">{current.code}</span>
        <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`flex items-center justify-between w-full px-3 py-2.5 text-sm transition-colors ${
                  i18n.language === lang.code
                    ? 'bg-orange-50 text-orange-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-base">{lang.flag}</span>
                  <span>{lang.name}</span>
                </span>
                {i18n.language === lang.code && (
                  <Check className="w-3.5 h-3.5 text-orange-500" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default LanguageSelector;
