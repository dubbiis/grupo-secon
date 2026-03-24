import { useState, useEffect } from "react";
import SectionShell from "@/components/planes/SectionShell";
import LoopItems from "@/components/planes/LoopItems";
import { useTranslation } from "@/i18n";

const FIELDS = [
    { key: "nombre_espacio", label: "Nombre del espacio", placeholder: "Ej: Sala principal, Backstage, Zona VIP...", required: true, wide: true },
    { key: "tipo_espacio", label: "Tipo de espacio", placeholder: "Ej: Recinto principal, Backstage, Zona VIP..." },
    { key: "direccion", label: "Dirección", placeholder: "Dirección completa del espacio", wide: true },
    { key: "telefono", label: "Teléfono", type: "tel", placeholder: "+34 000 000 000" },
    { key: "email", label: "Email de contacto", type: "email", placeholder: "contacto@ejemplo.com" },
    { key: "persona_contacto", label: "Persona de contacto", placeholder: "Nombre y cargo" },
];

export default function Seccion3({ plan, section, sections }) {
    const { t } = useTranslation();

    // Read section 1 data to pre-populate first space
    const sec1 = sections?.find((s) => s.section_number === 1);
    const sec1Data = sec1?.form_data ?? {};

    const [items, setItems] = useState(() => {
        try {
            const parsed = JSON.parse(section.form_data?.espacios_json ?? "[]");
            if (parsed.length > 0) return parsed;
        } catch {}

        // Pre-populate from section 1 if no spaces exist yet
        if (sec1Data.nombre_espacio || sec1Data.tipo_espacio || sec1Data.direccion_evento) {
            return [{
                nombre_espacio: sec1Data.nombre_espacio ?? "",
                tipo_espacio: sec1Data.tipo_espacio === "Otro" ? (sec1Data.tipo_espacio_otro ?? "") : (sec1Data.tipo_espacio ?? ""),
                direccion: sec1Data.direccion_evento ?? "",
                telefono: "",
                email: "",
                persona_contacto: "",
            }];
        }
        return [];
    });

    const formData = { espacios_json: JSON.stringify(items, null, 2) };

    return (
        <SectionShell plan={plan} section={section} formData={formData} onFormChange={() => {}}>
            <p className="text-sm text-muted-foreground">
                {t("s3.desc")}
            </p>
            <LoopItems
                items={items}
                onChange={setItems}
                fields={FIELDS}
                addLabel={t("s3.add")}
                itemLabel={(item) => item.nombre_espacio || item.tipo_espacio || "Espacio sin nombre"}
            />
        </SectionShell>
    );
}
