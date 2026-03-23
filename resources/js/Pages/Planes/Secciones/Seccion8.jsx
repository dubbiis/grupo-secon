import { useState } from "react";
import SectionShell from "@/components/planes/SectionShell";
import FileUpload from "@/components/planes/FileUpload";
import MapEditor from "@/components/planes/MapEditor";
import { motion } from "framer-motion";
import { Map, Upload } from "lucide-react";
import { useTranslation } from "@/i18n";

export default function Seccion8({ plan, section, files = [], eventAddress = "" }) {
    const { t } = useTranslation();
    const [showMapEditor, setShowMapEditor] = useState(false);
    const planoFiles = files.filter((f) => f.file_category === "plano");

    return (
        <SectionShell plan={plan} section={section} formData={{}} onFormChange={() => {}}>
            <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 rounded-xl bg-[#208DCA]/8 border border-[#208DCA]/20 p-4"
            >
                <div className="w-8 h-8 rounded-lg bg-[#208DCA]/15 border border-[#208DCA]/20 flex items-center justify-center flex-shrink-0">
                    <Map size={15} className="text-[#208DCA]" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-[#208DCA] mb-0.5">{t("s8.title")}</p>
                    <p className="text-sm text-slate-900 leading-relaxed">
                        Sube los planos del recinto con la distribución del personal de seguridad,
                        accesos controlados, puestos de control y zonas diferenciadas.
                        Puedes usar el editor para anotar directamente sobre imágenes del recinto.
                    </p>
                </div>
            </motion.div>

            {/* Toggle editor / upload */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setShowMapEditor(false)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-all ${
                        !showMapEditor
                            ? "bg-[#208DCA]/15 border-[#208DCA]/30 text-[#208DCA]"
                            : "bg-white border-slate-200 text-slate-900 hover:text-slate-900"
                    }`}
                >
                    <Upload size={12} />
                    Subir archivo
                </button>
                <button
                    onClick={() => setShowMapEditor(true)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-all ${
                        showMapEditor
                            ? "bg-[#208DCA]/15 border-[#208DCA]/30 text-[#208DCA]"
                            : "bg-white border-slate-200 text-slate-900 hover:text-slate-900"
                    }`}
                >
                    <Map size={12} />
                    Editor de mapas
                </button>
            </div>

            {!showMapEditor ? (
                <FileUpload
                    uuid={plan.uuid}
                    sectionNumber={8}
                    category="plano"
                    accept="image/*,application/pdf"
                    multiple
                    existingFiles={planoFiles}
                    label="Subir plano del recinto"
                    description="PNG, JPG o PDF — se incluirán en el plan de seguridad"
                />
            ) : (
                <MapEditor
                    mode="section"
                    uuid={plan.uuid}
                    sectionNumber={8}
                    category="plano"
                    existingFiles={planoFiles}
                    onSaved={() => {}}
                    eventAddress={eventAddress}
                />
            )}
        </SectionShell>
    );
}
