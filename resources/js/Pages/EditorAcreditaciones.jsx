import { Head } from "@inertiajs/react";
import AppLayout from "@/components/AppLayout";
import CredentialCreator from "@/components/planes/CredentialCreator";
import { motion } from "framer-motion";
import { CreditCard, Info } from "lucide-react";

export default function EditorAcreditaciones() {
    return (
        <AppLayout
            title="Editor de Acreditaciones"
            subtitle="Diseña tarjetas de acreditación para tu evento"
        >
            <Head title="Editor de Acreditaciones" />

            <div className="p-6 max-w-5xl">
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 rounded-2xl bg-[#253C87]/8 border border-[#253C87]/20 p-4 mb-6"
                >
                    <div className="w-9 h-9 rounded-xl bg-[#208DCA]/15 border border-[#208DCA]/20 flex items-center justify-center flex-shrink-0">
                        <CreditCard size={17} className="text-[#208DCA]" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-white mb-1">Diseñador de tarjetas de acreditación</p>
                        <p className="text-xs text-white/45 leading-relaxed">
                            Crea tarjetas visuales para el personal del evento: staff, prensa, VIPs, artistas y seguridad.
                            Añade foto, logo, colores corporativos y campos personalizados. Descarga en PNG o inclúyelas directamente en un plan.
                        </p>
                        <div className="flex flex-wrap gap-3 mt-2.5 text-[10px] text-white/30">
                            <span className="flex items-center gap-1"><Info size={10} /> Sube la foto del portador y el logo del evento</span>
                            <span className="flex items-center gap-1"><Info size={10} /> Elige una paleta o personaliza los colores</span>
                            <span className="flex items-center gap-1"><Info size={10} /> Añade hasta 4 campos personalizados</span>
                        </div>
                    </div>
                </motion.div>

                <CredentialCreator />
            </div>
        </AppLayout>
    );
}
