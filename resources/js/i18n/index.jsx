import { createContext, useContext, useState, useCallback } from "react";
import es from "./es.json";
import en from "./en.json";

const translations = { es, en };
const STORAGE_KEY = "grupo-secon-lang";

const LanguageContext = createContext({ lang: "es", t: (key) => key, setLang: () => {} });

function getNestedValue(obj, path) {
    return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

export function LanguageProvider({ children }) {
    const [lang, setLangState] = useState(() => {
        try { return localStorage.getItem(STORAGE_KEY) || "es"; }
        catch { return "es"; }
    });

    const setLang = useCallback((newLang) => {
        setLangState(newLang);
        try { localStorage.setItem(STORAGE_KEY, newLang); } catch {}
    }, []);

    const t = useCallback((key, params = {}) => {
        const value = getNestedValue(translations[lang], key)
            ?? getNestedValue(translations.es, key)
            ?? key;

        if (typeof value !== "string") return key;

        return value.replace(/\{\{(\w+)\}\}/g, (_, k) => params[k] ?? `{{${k}}}`);
    }, [lang]);

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useTranslation() {
    return useContext(LanguageContext);
}

export const LANGUAGES = [
    { code: "es", label: "Español", flag: "🇪🇸" },
    { code: "en", label: "English", flag: "🇬🇧" },
];
