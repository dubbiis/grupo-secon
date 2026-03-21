import { useState } from "react";
import { Input } from "@/components/ui/input";
import SectionShell from "@/components/planes/SectionShell";
import LoopItems from "@/components/planes/LoopItems";

const TIPOS_PUBLICO = [
    "Público general mixto",
    "Jóvenes (18-30 años)",
    "Familiar (todas las edades)",
    "Profesional / Corporativo",
    "Deportivo",
    "Cultural / Artístico",
    "Otro",
];

const VIP_FIELDS = [
    { key: "nombre", label: "Nombre / Artista / Personalidad", placeholder: "Nombre completo", required: true, wide: true },
    { key: "descripcion", label: "Perfil y consideraciones de seguridad", type: "textarea", placeholder: "Describe el perfil y qué implica su presencia para la seguridad...", wide: true },
];

export default function Seccion6({ plan, section }) {
    const [form, setForm] = useState({
        perfil_publico: "",
        rango_edad: "",
        ambito_geografico: "",
        ...section.form_data,
    });

    const [vips, setVips] = useState(() => {
        try { return JSON.parse(section.form_data?.vips_json ?? "[]"); }
        catch { return []; }
    });

    const formData = {
        ...form,
        vips_json: JSON.stringify(vips, null, 2),
    };

    const field = (key) => ({
        value: form[key],
        onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
    });

    return (
        <SectionShell plan={plan} section={section} formData={formData} onFormChange={setForm}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Tipo de público *</label>
                    <select
                        value={form.perfil_publico}
                        onChange={(e) => setForm((prev) => ({ ...prev, perfil_publico: e.target.value }))}
                        className="flex h-9 w-full rounded-lg border border-white/10 bg-white/6 px-3 py-1 text-sm text-white shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#208DCA]/50"
                    >
                        <option value="">Seleccionar...</option>
                        {TIPOS_PUBLICO.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <div>
                    <label className="text-sm font-medium mb-1.5 block">Rango de edad estimado</label>
                    <Input {...field("rango_edad")} placeholder="Ej: 18-45 años, mayoritariamente 25-35" />
                </div>

                <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-1.5 block">Ámbito geográfico</label>
                    <Input {...field("ambito_geografico")} placeholder="Ej: Local (ciudad), Regional (Cataluña), Nacional, Internacional" />
                </div>
            </div>

            <div>
                <label className="text-sm font-medium mb-1.5 block">Artistas / VIPs / Personalidades</label>
                <p className="text-xs text-muted-foreground mb-3">
                    Añade cada artista, VIP o personalidad relevante con sus consideraciones de seguridad.
                </p>
                <LoopItems
                    items={vips}
                    onChange={setVips}
                    fields={VIP_FIELDS}
                    addLabel="Añadir artista / VIP"
                    itemLabel={(item) => item.nombre || "VIP sin nombre"}
                />
            </div>
        </SectionShell>
    );
}
