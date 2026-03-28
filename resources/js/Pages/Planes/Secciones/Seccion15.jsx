import { useState } from "react";
import { router } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import FileUpload from "@/components/planes/FileUpload";
import { Shine } from "@/components/animate-ui/primitives/effects/shine";
import { RippleButton } from "@/components/animate-ui/components/buttons/ripple";
import { FileDown, CheckCircle2, Save, Eye, Globe } from "lucide-react";
import { useTranslation } from "@/i18n";

export default function Seccion15({ plan, section, files = [] }) {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        titulo_pdf: plan.title ?? "",
        language: "es",
        ...section.form_data,
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const portadaFiles = files.filter((f) => f.file_category === "portada");

    const handleSave = () => {
        setSaving(true);
        router.put(
            `/planes/${plan.uuid}/seccion/15`,
            { form_data: form, generated_text: "", status: "listo" },
            {
                preserveScroll: true,
                onSuccess: () => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); },
                onError: () => setSaving(false),
            }
        );
    };

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#208DCA] animate-pulse" />
                    {t("common.section")} 15
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
            <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-6 shadow-xl shadow-slate-200/50">

                <p className="text-sm text-slate-500">
                    Configura el título y la imagen de portada del PDF final. El documento se genera con la tipografía y diseño corporativo de Grupo Secon.
                </p>

                {/* PDF Title */}
                <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1.5 block uppercase tracking-wide">
                        Título del PDF
                    </label>
                    <Input
                        value={form.titulo_pdf}
                        onChange={(e) => setForm((prev) => ({ ...prev, titulo_pdf: e.target.value }))}
                        placeholder="Nombre del evento o título del plan"
                    />
                </div>

                {/* Language */}
                <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1.5 block uppercase tracking-wide">
                        <Globe size={11} className="inline mr-1 -mt-0.5" />
                        Idioma del documento
                    </label>
                    <div className="flex items-center gap-2">
                        {[
                            { value: "es", label: "Español" },
                            { value: "en", label: "English" },
                        ].map(({ value, label }) => (
                            <motion.button
                                key={value}
                                type="button"
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setForm((prev) => ({ ...prev, language: value }))}
                                className={`flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl border transition-all ${
                                    form.language === value
                                        ? "bg-[#208DCA]/15 border-[#208DCA]/30 text-[#208DCA] shadow-sm shadow-[#208DCA]/10"
                                        : "bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300"
                                }`}
                            >
                                {label}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Cover image */}
                <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1.5 block uppercase tracking-wide">
                        Imagen de portada
                        <span className="text-slate-400 normal-case tracking-normal font-normal ml-1">(opcional)</span>
                    </label>
                    <FileUpload
                        uuid={plan.uuid}
                        sectionNumber={15}
                        category="portada"
                        accept="image/*"
                        multiple={false}
                        existingFiles={portadaFiles}
                        label="Subir imagen de portada"
                        description="JPG o PNG — se mostrará en la primera página del documento"
                    />
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-3">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 shadow-sm"
                >
                    <Save size={14} />
                    {saving ? "..." : t("common.save")}
                </button>

                <div className="flex items-center gap-3">
                    <Shine enableOnHover color="white" opacity={0.25} duration={500} asChild>
                        <motion.a
                            href={`/planes/${plan.uuid}/pdf/previsualizar`}
                            target="_blank"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-600 border border-slate-200 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all"
                        >
                            <Eye size={14} />
                            Previsualizar
                        </motion.a>
                    </Shine>
                    <Shine enableOnHover color="white" opacity={0.25} duration={500} asChild>
                        <motion.a
                            href={`/planes/${plan.uuid}/pdf/descargar`}
                            target="_blank"
                            whileHover={{ scale: 1.04, y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#253C87] to-[#208DCA] text-white text-sm font-bold shadow-lg shadow-[#208DCA]/30 hover:shadow-xl hover:shadow-[#208DCA]/40 transition-all"
                        >
                            <FileDown size={14} />
                            Descargar PDF
                        </motion.a>
                    </Shine>
                </div>
            </div>
        </div>
    );
}
