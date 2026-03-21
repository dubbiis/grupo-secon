import SectionShell from "@/components/planes/SectionShell";
import FileUpload from "@/components/planes/FileUpload";
import { Table2 } from "lucide-react";

export default function Seccion9({ plan, section, files = [] }) {
    const excelFiles = files.filter((f) => f.file_category === "excel");

    return (
        <SectionShell plan={plan} section={section} formData={{}} onFormChange={() => {}}>
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 border p-4">
                <Table2 size={16} className="text-[#208DCA] flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium">Planificación del personal de seguridad</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Sube el documento Excel con la planificación detallada del personal:
                        turnos, puestos, nombres, categorías profesionales y horarios.
                    </p>
                </div>
            </div>

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
