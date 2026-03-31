import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import SectionShell from "@/components/planes/SectionShell";
import FileUpload from "@/components/planes/FileUpload";
import { motion } from "framer-motion";
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
                        { value: "imagen", label: t("s11.image_doc") },
                        { value: "texto", label: t("s11.text_table") },
                    ].map((opt) => (
                        <motion.button
                            key={opt.value}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setForm((prev) => ({ ...prev, tipo_run_of_show: opt.value }))}
                            className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                                form.tipo_run_of_show === opt.value
                                    ? "bg-gradient-to-r from-[#253C87] to-[#208DCA] text-white border-[#208DCA]/50 shadow-md shadow-[#208DCA]/20"
                                    : "bg-white text-slate-500 border-slate-200 hover:border-[#208DCA]/40 hover:text-slate-700"
                            }`}
                        >
                            {opt.label}
                        </motion.button>
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
                    label={t("s11.upload")}
                    description={t("s11.upload_desc")}
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
