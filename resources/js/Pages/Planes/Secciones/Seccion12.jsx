import { useState } from "react";
import SectionShell from "@/components/planes/SectionShell";
import LoopItems from "@/components/planes/LoopItems";

const FIELDS = [
    { key: "nombre_acreditacion", label: "Nombre de la acreditación", placeholder: "Ej: Staff, Prensa, VIP, Artista, Seguridad...", required: true, wide: true },
    { key: "cantidad", label: "Cantidad", type: "number", placeholder: "Nº de acreditaciones" },
    { key: "usuarios", label: "Usuarios / Colectivo", placeholder: "¿Quién la porta?" },
    { key: "zonas_acceso", label: "Zonas de acceso autorizadas", placeholder: "Ej: Backstage, Zona VIP, Escenario...", wide: true },
    { key: "descripcion", label: "Descripción / Características", type: "textarea", placeholder: "Color, forma, datos impresos, controles de verificación...", wide: true },
];

export default function Seccion12({ plan, section }) {
    const [items, setItems] = useState(() => {
        try { return JSON.parse(section.form_data?.acreditaciones_json ?? "[]"); }
        catch { return []; }
    });

    const formData = { acreditaciones_json: JSON.stringify(items, null, 2) };

    return (
        <SectionShell plan={plan} section={section} formData={formData} onFormChange={() => {}}>
            <p className="text-sm text-muted-foreground">
                Define los tipos de acreditación del evento, sus características y las zonas a las que permiten acceso.
            </p>
            <LoopItems
                items={items}
                onChange={setItems}
                fields={FIELDS}
                addLabel="Añadir tipo de acreditación"
                itemLabel={(item) => item.nombre_acreditacion || "Acreditación sin nombre"}
            />
        </SectionShell>
    );
}
