import { useState } from "react";
import SectionShell from "@/components/planes/SectionShell";
import LoopItems from "@/components/planes/LoopItems";

const FIELDS = [
    { key: "nombre", label: "Nombre", placeholder: "Nombre completo", required: true },
    { key: "cargo", label: "Cargo / Función", placeholder: "Ej: Director de Seguridad, Jefe de Producción..." },
    { key: "email", label: "Email", type: "email", placeholder: "contacto@empresa.com" },
    { key: "telefono", label: "Teléfono", type: "tel", placeholder: "+34 000 000 000", required: true },
    { key: "empresa", label: "Empresa / Organización", placeholder: "Empresa u organismo" },
];

export default function Seccion13({ plan, section }) {
    const [items, setItems] = useState(() => {
        try { return JSON.parse(section.form_data?.contactos_json ?? "[]"); }
        catch { return []; }
    });

    const formData = { contactos_json: JSON.stringify(items, null, 2) };

    return (
        <SectionShell plan={plan} section={section} formData={formData} onFormChange={() => {}}>
            <p className="text-sm text-muted-foreground">
                Registra todos los contactos clave: organizadores, técnicos, servicios de emergencia y personal de seguridad.
            </p>
            <LoopItems
                items={items}
                onChange={setItems}
                fields={FIELDS}
                addLabel="Añadir contacto"
                itemLabel={(item) => item.nombre ? `${item.nombre}${item.cargo ? ` — ${item.cargo}` : ""}` : "Contacto sin nombre"}
            />
        </SectionShell>
    );
}
