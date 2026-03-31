import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';

const languages = [
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  // 🛡️ Regra Global: Idiomas automáticos por região
  useEffect(() => {
    const savedLang = localStorage.getItem('i18nextLng');
    if (!savedLang) {
      const browserLang = navigator.language.split('-')[0];
      const isSupported = languages.some(l => l.code === browserLang);
      if (isSupported) {
        i18n.changeLanguage(browserLang);
      }
    }
  }, [i18n]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <div className="relative inline-block text-left animate-in fade-in duration-700">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-3 px-6 py-3 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-3xl transition-all duration-500 hover:border-orange-500/30 hover:bg-slate-900/60 shadow-2xl diamond-glow relative overflow-hidden"
        id="language-menu-button"
        aria-expanded={isOpen}
      >
        <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-5 transition-opacity" />
        <Globe className="h-4.5 w-4.5 text-orange-400 group-hover:rotate-[30deg] transition-all duration-700" />
        
        <div className="flex flex-col items-start leading-none">
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Region</span>
           <span className="text-xs font-black text-white tracking-tight flex items-center gap-2">
             <span className="text-base">{currentLanguage.flag}</span>
             <span className="hidden sm:inline">{currentLanguage.name}</span>
             <span className="sm:hidden uppercase">{currentLanguage.code}</span>
             <ChevronDown size={10} className={`text-slate-600 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
           </span>
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 z-50 mt-4 w-64 origin-top-right rounded-[2.5rem] bg-slate-950/90 border border-white/10 shadow-gold backdrop-blur-3xl ring-1 ring-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-500"
            role="menu"
          >
            <div className="p-4 space-y-2">
              <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 italic">Select Language</p>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`flex items-center justify-between w-full px-5 py-4 text-sm rounded-2xl transition-all duration-300 group/item ${
                    i18n.language === lang.code
                      ? 'bg-gradient-gold text-black font-black shadow-gold'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                  role="menuitem"
                >
                  <span className="flex items-center gap-4">
                    <span className="text-2xl filter drop-shadow-md group-hover/item:scale-110 transition-transform">{lang.flag}</span>
                    <span className="font-bold tracking-tight">{lang.name}</span>
                  </span>
                  {i18n.language === lang.code && (
                    <div className="bg-black/20 backdrop-blur-md rounded-full p-1.5 border border-black/10">
                      <Check className="h-3 w-3 text-black" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            <div className="bg-white/5 p-4 text-center">
               <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest italic">Global Dashboard v4.7</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default LanguageSelector;
