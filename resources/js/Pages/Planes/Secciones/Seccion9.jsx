import SectionShell from "@/components/planes/SectionShell";
import FileUpload from "@/components/planes/FileUpload";
import { motion } from "framer-motion";
import { Table2 } from "lucide-react";

export default function Seccion9({ plan, section, files = [] }) {
    const excelFiles = files.filter((f) => f.file_category === "excel");

    return (
        <SectionShell plan={plan} section={section} formData={{}} onFormChange={() => {}}>
            <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 rounded-xl bg-green-500/8 border border-green-500/20 p-4"
            >
                <div className="w-8 h-8 rounded-lg bg-green-500/15 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Table2 size={15} className="text-green-400" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-green-400 mb-0.5">Planificación del personal de seguridad</p>
                    <p className="text-sm text-white/45 leading-relaxed">
                        Sube el documento Excel con la planificación detallada:
                        turnos, puestos, nombres, categorías profesionales y horarios.
                    </p>
                </div>
            </motion.div>

            <FileUpload
                uuid={plan.uuid}
                sectionNumber={9}
                category="excel"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                multiple={false}
                existingFiles={excelFiles}
                label="Subir Excel de planificación"
                description="Formato .xlsx, .xls o .csv"
            />
        </SectionShell>
    );
}
