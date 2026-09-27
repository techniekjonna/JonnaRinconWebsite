import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Language = 'en' | 'nl';

interface LanguageContextValue {
  language: Language;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'jr_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'nl' ? 'nl' : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // ignore (private browsing, storage disabled, etc.)
    }
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage((l) => (l === 'en' ? 'nl' : 'en'));
  }, []);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

// Inline translation helper — each call site carries both strings, so there's
// no separate dictionary file to keep in sync across dozens of components.
// Proper nouns (song/EP titles, brand names, quotes) simply aren't wrapped
// in t(), so they render unchanged regardless of language.
export type TFn = (en: string, nl: string) => string;

export function useT(): TFn {
  const { language } = useLanguage();
  return useCallback((en: string, nl: string) => (language === 'nl' ? nl : en), [language]);
}
