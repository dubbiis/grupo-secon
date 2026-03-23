import { Head } from "@inertiajs/react";
import AppLayout from "@/components/AppLayout";
import MapEditor from "@/components/planes/MapEditor";

export default function EditorMapas() {
    return (
        <AppLayout
            title="Editor de Mapas"
            subtitle="Crea planos, rutas de emergencia y anotaciones sobre imágenes"
        >
            <Head title="Editor de Mapas" />
            <div className="flex flex-col h-[calc(100vh-8rem)] overflow-hidden px-6 pt-4">
                <MapEditor mode="standalone" />
            </div>
        </AppLayout>
    );
}
