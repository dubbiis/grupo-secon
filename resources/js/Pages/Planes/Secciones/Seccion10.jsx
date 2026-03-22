import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SectionShell from "@/components/planes/SectionShell";
import { useTranslation } from "@/i18n";

const TIPOS_ASISTENTES = ["Público general", "Artistas / VIPs", "Personal de seguridad", "Proveedores / Técnicos", "Prensa / Acreditados"];

export default function Seccion10({ plan, section }) {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        tipos_asistentes: "",
        vehiculos: "",
        hay_aparcamiento: "no",
        zonas_aparcamiento: "",
        ...section.form_data,
    });

    const field = (key) => ({
        value: form[key],
        onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
    });

    return (
        <SectionShell plan={plan} section={section} formData={form} onFormChange={setForm}>
            <div>
                <label className="text-sm font-medium mb-1.5 block">Perfiles de asistentes que necesitan gestión de transporte</label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {TIPOS_ASISTENTES.map((tipo) => {
                        const selected = form.tipos_asistentes.split(",").map((s) => s.trim()).filter(Boolean).includes(tipo);
                        return (
                            <button
                                key={tipo}
                                type="button"
                                onClick={() => {
                                    const current = form.tipos_asistentes.split(",").map((s) => s.trim()).filter(Boolean);
                                    const updated = selected
                                        ? current.filter((t) => t !== tipo)
                                        : [...current, tipo];
                                    setForm((prev) => ({ ...prev, tipos_asistentes: updated.join(", ") }));
                                }}
                                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                    selected
                                        ? "bg-[#273887] text-slate-900 border-[#273887]"
                                        : "bg-transparent text-muted-foreground border-input hover:border-[#208DCA]"
                                }`}
                            >
                                {tipo}
                            </button>
                        );
                    })}
                </div>
                <Input {...field("tipos_asistentes")} placeholder="O escribe los perfiles manualmente..." />
            </div>

            <div>
                <label className="text-sm font-medium mb-1.5 block">Vehículos y medios de transporte utilizados</label>
                <Textarea
                    {...field("vehiculos")}
                    placeholder="Ej: Autobuses lanzadera desde parking exterior, furgonetas de producción, vehículos de seguridad, motocicletas de escolta..."
                    rows={3}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium mb-1.5 block">¿Hay zonas de aparcamiento habilitadas?</label>
                    <select
                        value={form.hay_aparcamiento}
                        onChange={(e) => setForm((prev) => ({ ...prev, hay_aparcamiento: e.target.value }))}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <option value="no">No</option>
                        <option value="si">Sí</option>
                    </select>
                </div>
            </div>

            {form.hay_aparcamiento === "si" && (
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Descripción de zonas de aparcamiento</label>
                    <Textarea
                        {...field("zonas_aparcamiento")}
                        placeholder="Ej: Parking Norte (500 plazas, uso exclusivo artistas/VIP), Parking Sur (1200 plazas, público general), zona carga/descarga en Calle Mayor..."
                        rows={3}
                    />
                </div>
            )}
        </SectionShell>
    );
}
