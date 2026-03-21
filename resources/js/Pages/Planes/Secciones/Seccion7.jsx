import SectionShell from "@/components/planes/SectionShell";
import { AlertTriangle } from "lucide-react";

export default function Seccion7({ plan, section }) {
    return (
        <SectionShell plan={plan} section={section} formData={{}} onFormChange={() => {}} showIA={true}>
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-4">
                <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-amber-800">Sección generada automáticamente</p>
                    <p className="text-sm text-amber-700 mt-0.5">
                        El análisis de riesgos se genera a partir del contexto de todas las secciones anteriores.
                        Asegúrate de completar las secciones 1-6 antes de generar.
                    </p>
                </div>
            </div>
        </SectionShell>
    );
}
