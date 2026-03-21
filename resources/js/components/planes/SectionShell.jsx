import { useState, useEffect, useRef } from "react";
import { router } from "@inertiajs/react";
import { motion } from "framer-motion";
import { ChevronRight, Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import GeneradorIA from "./GeneradorIA";

/**
 * Shell reutilizable para secciones con IA.
 * Props:
 *   plan, section, fields (array of rendered inputs), showIA, children
 */
export default function SectionShell({ plan, section, formData, onFormChange, showIA = true, children }) {
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [generatedText, setGeneratedText] = useState(section.generated_text ?? "");
    const saveTimerRef = useRef(null);

    // Auto-save on form data change (debounced)
    const autoSave = (data) => {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            save(data, generatedText, section.status);
        }, 2000);
    };

    const save = (data, text, status) => {
        setSaving(true);
        router.put(
            `/planes/${plan.uuid}/seccion/${section.section_number}`,
            { form_data: data, generated_text: text, status },
            {
                preserveScroll: true,
                onSuccess: () => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); },
                onError: () => setSaving(false),
            }
        );
    };

    const confirm = () => {
        save(formData, generatedText, "listo");
        // Navigate to next section
        const next = section.section_number + 1;
        if (next <= 15) {
            setTimeout(() => {
                router.visit(`/planes/${plan.uuid}/seccion/${next}`);
            }, 400);
        }
    };

    return (
        <div className="space-y-6">
            {/* Section header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            Sección {section.section_number}
                        </span>
                        {saved && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-xs text-green-600 flex items-center gap-1"
                            >
                                <CheckCircle2 size={12} /> Guardado
                            </motion.span>
                        )}
                    </div>
                    <h2 className="text-xl font-bold">{section.section_name}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => save(formData, generatedText, section.status)}
                        disabled={saving}
                        className="gap-1.5"
                    >
                        <Save size={14} />
                        {saving ? "Guardando..." : "Guardar"}
                    </Button>
                    <Button
                        variant="secon"
                        size="sm"
                        onClick={confirm}
                        className="gap-1.5"
                    >
                        Confirmar
                        <ChevronRight size={14} />
                    </Button>
                </div>
            </div>

            {/* Form fields */}
            <div className="space-y-4">
                {children}
            </div>

            {/* IA generator */}
            {showIA && (
                <div className="border-t pt-6">
                    <GeneradorIA
                        uuid={plan.uuid}
                        section={section.section_number}
                        initialText={generatedText}
                        onTextChange={(t) => setGeneratedText(t)}
                        onStatusChange={() => {}}
                    />
                </div>
            )}
        </div>
    );
}
