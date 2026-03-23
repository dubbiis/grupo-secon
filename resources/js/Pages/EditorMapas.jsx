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

            <div className="h-[calc(100vh-3.5rem)] overflow-hidden">
                <MapEditor mode="standalone" />
            </div>
        </AppLayout>
    );
}
