import { Head } from "@inertiajs/react";
import { useRef } from "react";
import { motion } from "framer-motion";
import { Crosshair } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import MapEditor from "@/components/planes/MapEditor";
import GoogleMapsProvider from "@/components/GoogleMapsProvider";
import { Shine } from "@/components/animate-ui/primitives/effects/shine";
import { useTranslation } from "@/i18n";

export default function EditorMapas() {
    const { t } = useTranslation();
    const editorRef = useRef(null);

    return (
        <GoogleMapsProvider>
        <AppLayout
            title={t("editor_mapas.title")}
            subtitle={t("editor_mapas.subtitle")}
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
                        {t("editor_mapas.screenshot")}
                    </motion.button>
                </Shine>
            }
        >
            <Head title={t("editor_mapas.title")} />
            <div className="flex flex-col h-[calc(100vh-8rem)] overflow-hidden px-6 pt-4">
                <MapEditor ref={editorRef} mode="standalone" />
            </div>
        </AppLayout>
        </GoogleMapsProvider>
    );
}
