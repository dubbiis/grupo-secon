import SectionShell from "@/components/planes/SectionShell";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function Seccion7({ plan, section }) {
    return (
        <SectionShell plan={plan} section={section} formData={{}} onFormChange={() => {}} showIA={true}>
            <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 rounded-xl bg-amber-500/8 border border-amber-500/20 p-4"
            >
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={15} className="text-amber-400" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-amber-400 mb-0.5">Sección generada automáticamente</p>
                    <p className="text-sm text-white/45 leading-relaxed">
                        El análisis de riesgos se genera a partir del contexto completo de las secciones anteriores.
                        Asegúrate de completar las secciones 1-6 antes de pulsar "Generar con IA".
                    </p>
                </div>
            </motion.div>
        </SectionShell>
    );
}
