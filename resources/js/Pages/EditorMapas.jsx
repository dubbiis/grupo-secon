import { Head } from "@inertiajs/react";
import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crosshair, X } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import MapEditor from "@/components/planes/MapEditor";
import { Shine } from "@/components/animate-ui/primitives/effects/shine";

export default function EditorMapas() {
    const editorRef = useRef(null);
    const [capturing, setCapturing] = useState(false);

    // Sync capture state from MapEditor
    useEffect(() => {
        const interval = setInterval(() => {
            if (editorRef.current) {
                setCapturing(editorRef.current.captureMode);
            }
        }, 200);
        return () => clearInterval(interval);
    }, []);

    return (
        <AppLayout
            title="Editor de Mapas"
            subtitle="Crea planos, rutas de emergencia y anotaciones sobre imágenes"
            headerAction={
                <AnimatePresence mode="wait">
                    {capturing ? (
                        <motion.button
                            key="cancel"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => editorRef.current?.cancelCapture()}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm shadow-lg shadow-red-500/30 transition-all"
                        >
                            <X size={16} />
                            Cancelar captura
                        </motion.button>
                    ) : (
                        <Shine enableOnHover color="white" opacity={0.4} duration={600} asChild>
                            <motion.button
                                key="capture"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
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
                    )}
                </AnimatePresence>
            }
        >
            <Head title="Editor de Mapas" />
            <div className="flex flex-col h-[calc(100vh-8rem)] overflow-hidden px-6 pt-4">
                <MapEditor ref={editorRef} mode="standalone" />
            </div>
        </AppLayout>
    );
}
