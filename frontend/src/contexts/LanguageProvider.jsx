import { useEffect, useMemo, useState } from "react";
import { LanguageContext } from "./LanguageContext";
import { LANGUAGE_OPTIONS, translations } from "../i18n/translations";

const LANGUAGE_STORAGE_KEY = "nisova-learning-language";
const supportedLanguages = new Set(LANGUAGE_OPTIONS.map(({ code }) => code));

function getInitialLanguage() {
  const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return supportedLanguages.has(savedLanguage) ? savedLanguage : "en";
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const contextValue = useMemo(() => {
    function t(key, values = {}) {
      const template = translations[language][key] ?? translations.en[key] ?? key;
      return template.replace(/\{(\w+)\}/g, (match, name) =>
        Object.hasOwn(values, name) ? String(values[name]) : match,
      );
    }

    return { language, setLanguage, t };
  }, [language]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}
