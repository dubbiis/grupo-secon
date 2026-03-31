import { useState, useEffect } from "react";
import SectionShell from "@/components/planes/SectionShell";
import LoopItems from "@/components/planes/LoopItems";
import { useTranslation } from "@/i18n";

export default function Seccion3({ plan, section, sections }) {
    const { t } = useTranslation();

    const FIELDS = [
        { key: "nombre_espacio", label: t("s3.space_name"), placeholder: t("s3.space_name_ph"), required: true, wide: true },
        { key: "tipo_espacio", label: t("s3.space_type"), placeholder: t("s3.space_type_ph") },
        { key: "direccion", label: t("s3.address"), placeholder: t("s3.address_ph"), wide: true },
        { key: "telefono", label: t("s3.phone"), type: "tel", placeholder: t("s3.phone_ph") },
        { key: "email", label: t("s3.email"), type: "email", placeholder: t("s3.email_ph") },
        { key: "persona_contacto", label: t("s3.contact_person"), placeholder: t("s3.contact_person_ph") },
    ];

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
                itemLabel={(item) => item.nombre_espacio || item.tipo_espacio || t("s3.unnamed_space")}
            />
        </SectionShell>
    );
}
