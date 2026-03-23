import { Head } from "@inertiajs/react";
import { useRef } from "react";
import { motion } from "framer-motion";
import { Crosshair } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import MapEditor from "@/components/planes/MapEditor";
import { Shine } from "@/components/animate-ui/primitives/effects/shine";

export default function EditorMapas() {
    const editorRef = useRef(null);

    return (
        <AppLayout
            title="Editor de Mapas"
            subtitle="Crea planos, rutas de emergencia y anotaciones sobre imágenes"
            headerAction={
                <Shine enableOnHover color="white" opacity={0.4} duration={600} asChild>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => editorRef.current?.startCapture()}
                        className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#253C87] to-[#208DCA] text-white font-bold text-sm shadow-xl shadow-[#208DCA]/40 transition-all"
                    >
                        <motion.div
                            animate={{ rotate: [0, 15, -15, 0] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        >
                            <Crosshair size={18} />
                        </motion.div>
                        Captura de pantalla
                    </motion.button>
                </Shine>
            }
        >
            <Head title="Editor de Mapas" />
            <div className="flex flex-col h-[calc(100vh-8rem)] overflow-hidden px-6 pt-4">
                <MapEditor ref={editorRef} mode="standalone" />
            </div>
        </AppLayout>
    );
}
