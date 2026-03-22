import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import SectionShell from "@/components/planes/SectionShell";
import FileUpload from "@/components/planes/FileUpload";
import { useTranslation } from "@/i18n";

export default function Seccion11({ plan, section, files = [] }) {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        tipo_run_of_show: "imagen",
        run_of_show_texto: "",
        ...section.form_data,
    });

    const rosFiles = files.filter((f) => f.file_category === "run_of_show");

    return (
        <SectionShell plan={plan} section={section} formData={form} onFormChange={setForm}>
            <div>
                <label className="text-sm font-medium mb-1.5 block">{t("s11.format")}</label>
                <div className="flex gap-3">
                    {[
                        { value: "imagen", label: "Imagen / Documento" },
                        { value: "texto", label: "Texto / Tabla" },
                    ].map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, tipo_run_of_show: opt.value }))}
                            className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                                form.tipo_run_of_show === opt.value
                                    ? "bg-[#273887] text-slate-900 border-[#273887]"
                                    : "bg-transparent text-muted-foreground border-input hover:border-[#208DCA]"
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {form.tipo_run_of_show === "imagen" ? (
                <FileUpload
                    uuid={plan.uuid}
                    sectionNumber={11}
                    category="run_of_show"
                    accept="image/*,application/pdf"
                    multiple
                    existingFiles={rosFiles}
                    label="Subir run of show"
                    description="Imagen o PDF con el cronograma del evento"
                />
            ) : (
                <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("s11.text_label")}</label>
                    <Textarea
                        value={form.run_of_show_texto}
                        onChange={(e) => setForm((prev) => ({ ...prev, run_of_show_texto: e.target.value }))}
                        placeholder={"08:00 - Apertura puertas personal técnico\n10:00 - Llegada artistas\n14:00 - Soundcheck\n18:00 - Apertura puertas público\n20:00 - Show principal\n22:30 - Cierre y evacuación"}
                        rows={10}
                        className="font-mono text-sm"
                    />
                </div>
            )}
        </SectionShell>
    );
}
