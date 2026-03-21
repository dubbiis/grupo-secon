import SectionShell from "@/components/planes/SectionShell";
import FileUpload from "@/components/planes/FileUpload";
import { Map } from "lucide-react";

export default function Seccion8({ plan, section, files = [] }) {
    const planoFiles = files.filter((f) => f.file_category === "plano");

    return (
        <SectionShell plan={plan} section={section} formData={{}} onFormChange={() => {}}>
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 border p-4">
                <Map size={16} className="text-[#208DCA] flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium">Planos del dispositivo de seguridad</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Sube los planos del recinto con la distribución del personal de seguridad,
                        accesos controlados, puestos de control y zonas diferenciadas.
                    </p>
                </div>
            </div>

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
