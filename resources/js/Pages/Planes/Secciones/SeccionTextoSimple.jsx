import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import SectionShell from "@/components/planes/SectionShell";
import { useTranslation } from "@/i18n";

/**
 * Sección genérica — muestra campo de texto libre + IA (si tiene template).
 * Usada para secciones que aún no tienen un formulario específico.
 */
export default function SeccionTextoSimple({ plan, section }) {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        notas: "",
        ...section.form_data,
    });

    return (
        <SectionShell plan={plan} section={section} formData={form} onFormChange={setForm}>
            <div>
                <label className="text-sm font-medium mb-1.5 block">{t("simple_section.additional_notes")}</label>
                <Textarea
                    value={form.notas}
                    onChange={(e) => setForm((prev) => ({ ...prev, notas: e.target.value }))}
                    placeholder={t("simple_section.placeholder")}
                    rows={5}
                />
            </div>
        </SectionShell>
    );
}
