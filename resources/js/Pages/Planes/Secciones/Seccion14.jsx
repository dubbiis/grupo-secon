import { useState } from "react";
import SectionShell from "@/components/planes/SectionShell";
import LoopItems from "@/components/planes/LoopItems";
import FileUpload from "@/components/planes/FileUpload";
import { useTranslation } from "@/i18n";

const FIELDS = [
    { key: "nombre", label: "Nombre del anexo", placeholder: "Ej: Contrato de servicios, Licencia municipal...", required: true, wide: true },
    { key: "descripcion", label: "Descripción", type: "textarea", placeholder: "Breve descripción del documento adjunto...", wide: true },
];

export default function Seccion14({ plan, section, files = [] }) {
    const [items, setItems] = useState(() => {
        try { return JSON.parse(section.form_data?.anexos_json ?? "[]"); }
        catch { return []; }
    });

    const formData = { anexos_json: JSON.stringify(items, null, 2) };
    const anexoFiles = files.filter((f) => f.file_category === "anexo");

    const { t } = useTranslation();
    return (
        <SectionShell plan={plan} section={section} formData={formData} onFormChange={() => {}}>
            <p className="text-sm text-muted-foreground">
                Lista y sube los documentos que se adjuntan al plan de seguridad como anexos.
            </p>

            <LoopItems
                items={items}
                onChange={setItems}
                fields={FIELDS}
                addLabel={t("s14.add")}
                itemLabel={(item) => item.nombre || "Anexo sin nombre"}
            />

            <div>
                <label className="text-sm font-medium mb-1.5 block">Subir documentos de anexos</label>
                <FileUpload
                    uuid={plan.uuid}
                    sectionNumber={14}
                    category="anexo"
                    accept="*"
                    multiple
                    existingFiles={anexoFiles}
                    label="Subir documentos adjuntos"
                    description="PDF, Word, Excel u otros formatos de documento"
                />
            </div>
        </SectionShell>
    );
}
