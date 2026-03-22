import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation, LANGUAGES } from "@/i18n";
import { Globe, Check } from "lucide-react";

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
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 hover:border-[#208DCA]/30 transition-all shadow-sm"
            >
                <span className="text-base leading-none">{current.flag}</span>
                {!compact && <span className="text-slate-700">{current.label}</span>}
                <Globe size={14} className="text-slate-400" />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.97 }}
                        className="absolute bottom-full left-0 mb-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 min-w-[160px]"
                    >
                        {LANGUAGES.map((l) => (
                            <button
                                key={l.code}
                                onClick={() => { setLang(l.code); setOpen(false); }}
                                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${
                                    lang === l.code
                                        ? "text-[#273887] bg-[#208DCA]/8 font-medium"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                }`}
                            >
                                <span className="text-base leading-none">{l.flag}</span>
                                <span className="flex-1">{l.label}</span>
                                {lang === l.code && <Check size={14} className="text-[#208DCA]" />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
