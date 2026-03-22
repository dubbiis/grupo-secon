import { Head } from "@inertiajs/react";
import AppLayout from "@/components/AppLayout";
import MapEditor from "@/components/planes/MapEditor";
import { motion } from "framer-motion";
import { Map, Info } from "lucide-react";

export default function EditorMapas() {
    return (
        <AppLayout
            title="Editor de Mapas"
            subtitle="Crea planos, rutas de emergencia y anotaciones sobre imágenes"
        >
            <Head title="Editor de Mapas" />

            <div className="p-6 max-w-full">
                {/* Info banner */}
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 rounded-2xl bg-[#273887]/8 border border-[#273887]/20 p-4 mb-6"
                >
                    <div className="w-9 h-9 rounded-xl bg-[#208DCA]/15 border border-[#208DCA]/20 flex items-center justify-center flex-shrink-0">
                        <Map size={17} className="text-[#208DCA]" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900 mb-1">Editor de mapas y rutas</p>
                        <p className="text-xs text-slate-900 leading-relaxed">
                            Sube capturas de Google Maps, planos del recinto o cualquier imagen base y dibuja encima:
                            rutas de evacuación, puntos de acceso, hospitales, puestos de seguridad y más.
                            Descarga el resultado como PNG o JPG para incluirlo en cualquier plan.
                        </p>
                        <div className="flex flex-wrap gap-3 mt-2.5 text-[10px] text-slate-900">
                            <span className="flex items-center gap-1"><Info size={10} /> Busca el recinto en el mapa lateral · haz captura · pega con Ctrl+V</span>
                            <span className="flex items-center gap-1"><Info size={10} /> Clic derecho sobre iconos o texto para más opciones</span>
                        </div>
                    </div>
                </motion.div>

                <MapEditor mode="standalone" />
            </div>
        </AppLayout>
    );
}
