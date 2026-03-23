import { Head } from "@inertiajs/react";
import AppLayout from "@/components/AppLayout";
import MapEditor from "@/components/planes/MapEditor";

export default function EditorMapas() {
    return (
        <AppLayout>
            <Head title="Editor de Mapas" />
            <div className="h-full overflow-hidden">
                <MapEditor mode="standalone" />
            </div>
        </AppLayout>
    );
}
