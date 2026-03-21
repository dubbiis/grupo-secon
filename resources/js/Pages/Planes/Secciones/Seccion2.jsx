import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SectionShell from "@/components/planes/SectionShell";

export default function Seccion2({ plan, section }) {
    const [form, setForm] = useState({
        descripcion_general: "",
        objetivo_evento: "",
        fecha_inicio: "",
        fecha_fin: "",
        horario_apertura: "",
        horario_cierre: "",
        fecha_montaje: "",
        fecha_desmontaje: "",
        num_asistentes: "",
        tiene_vip: "no",
        asistentes_vip: "",
        ...section.form_data,
    });

    const field = (key) => ({
        value: form[key],
        onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
    });

    // Campos derivados que el prompt espera
    const formConDerivados = useMemo(() => ({
        ...form,
        fecha_evento: form.fecha_inicio && form.fecha_fin
            ? `${form.fecha_inicio} al ${form.fecha_fin}`
            : form.fecha_inicio || "",
        horario_evento: form.horario_apertura && form.horario_cierre
            ? `${form.horario_apertura} a ${form.horario_cierre}`
            : form.horario_apertura || "",
        montaje_desmontaje: form.fecha_montaje && form.fecha_desmontaje
            ? `Montaje: ${form.fecha_montaje} / Desmontaje: ${form.fecha_desmontaje}`
            : "",
    }), [form]);

    return (
        <SectionShell plan={plan} section={section} formData={formConDerivados} onFormChange={setForm}>
            <div>
                <label className="text-sm font-medium mb-1.5 block">Descripción del evento *</label>
                <Textarea
                    {...field("descripcion_general")}
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
                        className="flex h-9 w-full rounded-lg border border-white/10 bg-white/6 px-3 py-1 text-sm text-white shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#208DCA]/50 focus-visible:border-[#208DCA]/40"
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
                        {...field("asistentes_vip")}
                        placeholder="Accesos, capacidad y características de la zona VIP"
                        rows={3}
                    />
                </div>
            )}
        </SectionShell>
    );
}
