import SectionShell from "@/components/planes/SectionShell";
import FileUpload from "@/components/planes/FileUpload";
import { motion } from "framer-motion";
import { Map } from "lucide-react";

export default function Seccion8({ plan, section, files = [] }) {
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
                    <p className="text-sm font-semibold text-[#208DCA] mb-0.5">Planos del dispositivo de seguridad</p>
                    <p className="text-sm text-white/45 leading-relaxed">
                        Sube los planos del recinto con la distribución del personal de seguridad,
                        accesos controlados, puestos de control y zonas diferenciadas.
                    </p>
                </div>
            </motion.div>

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
        </SectionShell>
    );
}
