import { useState, useRef } from "react";
import { router } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Save, CheckCircle2, RefreshCw } from "lucide-react";
import { RippleButton } from "@/components/animate-ui/components/buttons/ripple";
import GeneradorIA from "./GeneradorIA";

export default function SectionShell({ plan, section, formData, onFormChange, showIA = true, children }) {
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [generatedText, setGeneratedText] = useState(section.generated_text ?? "");
    const saveTimerRef = useRef(null);

    const save = (data, text, status) => {
        setSaving(true);
        router.put(
            `/planes/${plan.uuid}/seccion/${section.section_number}`,
            { form_data: data, generated_text: text, status },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSaving(false);
                    setSaved(true);
                    setTimeout(() => setSaved(false), 2500);
                },
                onError: () => setSaving(false),
            }
        );
    };

    const confirm = () => {
        save(formData, generatedText, "listo");
        const next = section.section_number + 1;
        if (next <= 15) {
            setTimeout(() => router.visit(`/planes/${plan.uuid}/seccion/${next}`), 400);
        }
    };

    return (
        <div className="space-y-6">

            {/* Section header */}
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/40 uppercase tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#208DCA] animate-pulse" />
                            Sección {section.section_number}
                        </span>
                        <AnimatePresence>
                            {saved && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.8, x: -8 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, x: -8 }}
                                    className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-lg"
                                >
                                    <CheckCircle2 size={11} />
                                    Guardado
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                    <h2 className="text-2xl font-bold text-white leading-tight">{section.section_name}</h2>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 pt-1">
                    <button
                        onClick={() => save(formData, generatedText, section.status)}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-white/6 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20 disabled:opacity-50"
                    >
                        {saving
                            ? <RefreshCw size={13} className="animate-spin" />
                            : <Save size={13} />
                        }
                        <span className="hidden sm:inline">{saving ? "..." : "Guardar"}</span>
                    </button>
                    <RippleButton
                        size="sm"
                        onClick={confirm}
                        className="bg-gradient-to-r from-[#253C87] to-[#208DCA] text-white border-0 gap-1.5 shadow-md shadow-[#253C87]/25 text-xs"
                    >
                        Confirmar
                        <ChevronRight size={13} />
                    </RippleButton>
                </div>
            </div>

            {/* Form card */}
            <div className="rounded-2xl bg-white/3 border border-white/8 p-6 space-y-5 shadow-xl shadow-black/20">
                {children}
            </div>

            {/* AI generator */}
            {showIA && (
                <div className="rounded-2xl bg-white/2 border border-white/6 overflow-hidden">
                    <div className="px-6 pt-5 pb-5">
                        <GeneradorIA
                            uuid={plan.uuid}
                            section={section.section_number}
                            formData={formData}
                            initialText={generatedText}
                            onTextChange={(t) => setGeneratedText(t)}
                            onStatusChange={() => {}}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
