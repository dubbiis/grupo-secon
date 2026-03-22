import { useState } from "react";
import { Input } from "@/components/ui/input";
import SectionShell from "@/components/planes/SectionShell";

export default function Seccion1({ plan, section }) {
    const [form, setForm] = useState({
        nombre_evento: "",
        organizador: "",
        direccion_evento: "",
        tipo_evento: "",
        nombre_espacio: "",
        productora: "",
        nombre_redactor: "",
        num_habilitacion: "",
        ...section.form_data,
    });

    const field = (key) => ({
        value: form[key],
        onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
    });

    const TIPOS_EVENTO = ["Concierto", "Festival", "Evento deportivo", "Evento corporativo", "Feria/Exposición", "Manifestación", "Otro"];
    const TIPOS_ESPACIO = ["Recinto cerrado", "Espacio abierto", "Mixto", "Instalación permanente"];

    return (
        <SectionShell plan={plan} section={section} formData={form} onFormChange={setForm}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-1.5 block">Nombre del evento *</label>
                    <Input {...field("nombre_evento")} placeholder="Ej: Concierto Madrid Arena 2025" />
                </div>

                <div>
                    <label className="text-sm font-medium mb-1.5 block">Organizador *</label>
                    <Input {...field("organizador")} placeholder="Nombre del organizador" />
                </div>

                <div>
                    <label className="text-sm font-medium mb-1.5 block">Productora</label>
                    <Input {...field("productora")} placeholder="Empresa productora" />
                </div>

                <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-1.5 block">Dirección del evento *</label>
                    <Input {...field("direccion_evento")} placeholder="Dirección completa del recinto" />
                </div>

                <div>
                    <label className="text-sm font-medium mb-1.5 block">Tipo de evento</label>
                    <select
                        value={form.tipo_evento}
                        onChange={(e) => setForm((prev) => ({ ...prev, tipo_evento: e.target.value }))}
                        className="flex h-9 w-full rounded-lg border border-slate-200 bg-slate-200 px-3 py-1 text-sm text-slate-900 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#208DCA]/50 focus-visible:border-[#208DCA]/40"
                    >
                        <option value="">Seleccionar...</option>
                        {TIPOS_EVENTO.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <div>
                    <label className="text-sm font-medium mb-1.5 block">Nombre del espacio/recinto</label>
                    <Input {...field("nombre_espacio")} placeholder="Ej: WiZink Center, Palacio de Deportes..." />
                </div>

                <div>
                    <label className="text-sm font-medium mb-1.5 block">Tipo de espacio</label>
                    <select
                        value={form.tipo_espacio ?? ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, tipo_espacio: e.target.value }))}
                        className="flex h-9 w-full rounded-lg border border-slate-200 bg-slate-200 px-3 py-1 text-sm text-slate-900 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#208DCA]/50 focus-visible:border-[#208DCA]/40"
                    >
                        <option value="">Seleccionar...</option>
                        {TIPOS_ESPACIO.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <div>
                    <label className="text-sm font-medium mb-1.5 block">Redactor del plan</label>
                    <Input {...field("nombre_redactor")} placeholder="Nombre del redactor" />
                </div>

                <div>
                    <label className="text-sm font-medium mb-1.5 block">Nº de habilitación</label>
                    <Input {...field("num_habilitacion")} placeholder="Número de habilitación profesional" />
                </div>
            </div>
        </SectionShell>
    );
}
