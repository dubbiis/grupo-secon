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
