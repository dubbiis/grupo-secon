import { useState } from "react";
import SectionShell from "@/components/planes/SectionShell";
import LoopItems from "@/components/planes/LoopItems";
import { useTranslation } from "@/i18n";

export default function Seccion13({ plan, section }) {
    const { t } = useTranslation();

    const FIELDS = [
        { key: "nombre", label: t("s13.name"), placeholder: t("s13.name_ph"), required: true },
        { key: "cargo", label: t("s13.role"), placeholder: t("s13.role_ph") },
        { key: "email", label: t("s13.email"), type: "email", placeholder: t("s13.email_ph") },
        { key: "telefono", label: t("s13.phone"), type: "tel", placeholder: t("s13.phone_ph"), required: true },
        { key: "empresa", label: t("s13.company"), placeholder: t("s13.company_ph") },
    ];

    const [items, setItems] = useState(() => {
        try { return JSON.parse(section.form_data?.contactos_json ?? "[]"); }
        catch { return []; }
    });

    const contactosResumen = items.length > 0
        ? items.map((c, i) => {
            const parts = [c.nombre || t("common.unnamed")];
            if (c.cargo) parts.push(c.cargo);
            if (c.empresa) parts.push(c.empresa);
            if (c.telefono) parts.push(`Tel: ${c.telefono}`);
            if (c.email) parts.push(c.email);
            return `${i + 1}. ${parts.join(" — ")}`;
        }).join("\n")
        : "";

    const formData = {
        contactos_json: JSON.stringify(items, null, 2),
        contactos_resumen: contactosResumen,
        num_contactos: items.length,
    };

    return (
        <SectionShell plan={plan} section={section} formData={formData} onFormChange={() => {}}>
            <p className="text-sm text-muted-foreground">
                {t("s13.desc")}
            </p>
            <LoopItems
                items={items}
                onChange={setItems}
                fields={FIELDS}
                addLabel={t("s13.add")}
                itemLabel={(item) => item.nombre ? `${item.nombre}${item.cargo ? ` — ${item.cargo}` : ""}` : t("s13.unnamed_contact")}
            />
        </SectionShell>
    );
}
