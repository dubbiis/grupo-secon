import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SectionShell from "@/components/planes/SectionShell";

export default function Seccion2({ plan, section }) {
    const [form, setForm] = useState({
        descripcion: "",
        objetivo_evento: "",
        fecha_inicio: "",
        fecha_fin: "",
        horario_apertura: "",
        horario_cierre: "",
        fecha_montaje: "",
        fecha_desmontaje: "",
        num_asistentes: "",
        tiene_vip: "no",
        descripcion_vip: "",
        ...section.form_data,
    });

    const field = (key) => ({
        value: form[key],
        onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
    });

    return (
        <SectionShell plan={plan} section={section} formData={form} onFormChange={setForm}>
            <div>
                <label className="text-sm font-medium mb-1.5 block">Descripción del evento *</label>
                <Textarea
                    {...field("descripcion")}
                    placeholder="Describe brevemente el evento, artistas, actividades..."
                    rows={4}
                />
            </div>

            <div>
                <label className="text-sm font-medium mb-1.5 block">Objetivo del evento</label>
                <Textarea
                    {...field("objetivo_evento")}
                    placeholder="Propósito y objetivos del evento"
                    rows={3}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Fecha de inicio *</label>
                    <Input type="date" {...field("fecha_inicio")} />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Fecha de fin *</label>
                    <Input type="date" {...field("fecha_fin")} />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Hora apertura</label>
                    <Input type="time" {...field("horario_apertura")} />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Hora cierre</label>
                    <Input type="time" {...field("horario_cierre")} />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Inicio montaje</label>
                    <Input type="date" {...field("fecha_montaje")} />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Fin desmontaje</label>
                    <Input type="date" {...field("fecha_desmontaje")} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Número de asistentes *</label>
                    <Input
                        type="number"
                        {...field("num_asistentes")}
                        placeholder="Aforo total esperado"
                        min={1}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">¿Zona VIP?</label>
                    <select
                        value={form.tiene_vip}
                        onChange={(e) => setForm((prev) => ({ ...prev, tiene_vip: e.target.value }))}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <option value="no">No</option>
                        <option value="si">Sí</option>
                    </select>
                </div>
            </div>

            {form.tiene_vip === "si" && (
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Descripción zona VIP</label>
                    <Textarea
                        {...field("descripcion_vip")}
                        placeholder="Accesos, capacidad y características de la zona VIP"
                        rows={3}
                    />
                </div>
            )}
        </SectionShell>
    );
}
