import { useState } from "react";
import SectionShell from "@/components/planes/SectionShell";
import LoopItems from "@/components/planes/LoopItems";

const FIELDS = [
    { key: "tipo_espacio", label: "Tipo de espacio", placeholder: "Ej: Recinto principal, Backstage, Zona VIP...", required: true, wide: true },
    { key: "direccion", label: "Dirección", placeholder: "Dirección completa del espacio", required: true, wide: true },
    { key: "telefono", label: "Teléfono", type: "tel", placeholder: "+34 000 000 000" },
    { key: "email", label: "Email de contacto", type: "email", placeholder: "contacto@ejemplo.com" },
    { key: "persona_contacto", label: "Persona de contacto", placeholder: "Nombre y cargo" },
];

export default function Seccion3({ plan, section }) {
    const [items, setItems] = useState(() => {
        try { return JSON.parse(section.form_data?.espacios_json ?? "[]"); }
        catch { return []; }
    });

    const formData = { espacios_json: JSON.stringify(items, null, 2) };

    return (
        <SectionShell plan={plan} section={section} formData={formData} onFormChange={() => {}}>
            <p className="text-sm text-muted-foreground">
                Registra cada espacio/titular del evento con sus datos de contacto.
            </p>
            <LoopItems
                items={items}
                onChange={setItems}
                fields={FIELDS}
                addLabel="Añadir espacio / titular"
                itemLabel={(item) => item.tipo_espacio || item.direccion || "Espacio sin nombre"}
            />
        </SectionShell>
    );
}
