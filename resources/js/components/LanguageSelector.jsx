import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation, LANGUAGES } from "@/i18n";
import { Globe } from "lucide-react";

export default function LanguageSelector({ compact = false }) {
    const { lang, setLang } = useTranslation();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        if (open) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/6 transition-all"
            >
                <Globe size={13} />
                {!compact && <span>{current.flag} {current.code.toUpperCase()}</span>}
                {compact && <span>{current.flag}</span>}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.97 }}
                        className="absolute bottom-full left-0 mb-1 bg-[#0f1219] border border-white/12 rounded-xl shadow-2xl overflow-hidden z-50 min-w-[130px]"
                    >
                        {LANGUAGES.map((l) => (
                            <button
                                key={l.code}
                                onClick={() => { setLang(l.code); setOpen(false); }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                                    lang === l.code
                                        ? "text-[#208DCA] bg-[#208DCA]/8"
                                        : "text-white/60 hover:text-white hover:bg-white/6"
                                }`}
                            >
                                <span>{l.flag}</span>
                                <span>{l.label}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
