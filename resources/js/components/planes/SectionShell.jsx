import { useState, useRef } from "react";
import { router } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Save, CheckCircle2, RefreshCw } from "lucide-react";
import { RippleButton } from "@/components/animate-ui/components/buttons/ripple";
import GeneradorIA from "./GeneradorIA";
import CustomQuestions from "./CustomQuestions";
import { useTranslation } from "@/i18n";

export default function SectionShell({ plan, section, formData, onFormChange, showIA = true, children }) {
    const { t } = useTranslation();
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
            <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#208DCA] animate-pulse" />
                    {t("common.section")} {section.section_number}
                </span>
                <AnimatePresence>
                    {saved && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.8, x: -8 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: -8 }}
                            className="inline-flex items-center gap-1 text-xs text-green-500 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-lg"
                        >
                            <CheckCircle2 size={11} />
                            {t("common.saved")}
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 leading-tight">{section.section_name}</h2>

            {/* Form card */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-5 shadow-xl shadow-slate-200/50">
                {children}

                {/* Custom questions — only for sections with IA */}
                {showIA && (
                    <CustomQuestions
                        sectionNumber={section.section_number}
                        customAnswers={formData?.custom_answers ?? {}}
                        onChange={(answers) => onFormChange((prev) => ({ ...prev, custom_answers: answers }))}
                    />
                )}
            </div>

            {/* AI generator */}
            {showIA && (
                <div className="rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden">
                    <div className="px-6 pt-5 pb-5">
                        <GeneradorIA
                            uuid={plan.uuid}
                            section={section.section_number}
                            formData={formData}
                            initialText={generatedText}
                            onTextChange={(txt) => setGeneratedText(txt)}
                            onStatusChange={() => {}}
                        />
                    </div>
                </div>
            )}

            {/* Action buttons — at the bottom */}
            <div className="flex items-center justify-end gap-3">
                <button
                    onClick={() => save(formData, generatedText, section.status)}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 shadow-sm"
                >
                    {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                    {saving ? "..." : t("common.save")}
                </button>
                <RippleButton
                    onClick={confirm}
                    className="bg-gradient-to-r from-[#273887] to-[#208DCA] text-white border-0 gap-2 shadow-md shadow-[#273887]/25 px-5 py-2"
                >
                    {t("common.confirm")}
                    <ChevronRight size={14} />
                </RippleButton>
            </div>
        </div>
    );
}
