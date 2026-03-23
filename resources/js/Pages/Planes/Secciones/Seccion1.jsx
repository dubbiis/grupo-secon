import { useState } from "react";
import { Input } from "@/components/ui/input";
import SectionShell from "@/components/planes/SectionShell";
import { useTranslation } from "@/i18n";

export default function Seccion1({ plan, section }) {
    const { t } = useTranslation();
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
    const TIPOS_ESPACIO = ["Recinto cerrado", "Espacio abierto", "Mixto", "Instalación permanente", "Otro"];

    return (
        <SectionShell plan={plan} section={section} formData={form} onFormChange={setForm}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-1.5 block">{ t("forms.event_name") } {t("forms.required")}</label>
                    <Input {...field("nombre_evento")} placeholder="Ej: Concierto Madrid Arena 2025" />
                </div>

                <div>
                    <label className="text-sm font-medium mb-1.5 block">{ t("forms.organizer") } {t("forms.required")}</label>
                    <Input {...field("organizador")} placeholder="Nombre del organizador" />
                </div>

                <div>
                    <label className="text-sm font-medium mb-1.5 block">{ t("forms.producer") }</label>
                    <Input {...field("productora")} placeholder="Empresa productora" />
                </div>

                <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-1.5 block">{ t("forms.address") } {t("forms.required")}</label>
                    <Input {...field("direccion_evento")} placeholder="Dirección completa del recinto" />
                </div>

                <div>
                    <label className="text-sm font-medium mb-1.5 block">{ t("forms.event_type") }</label>
                    <select
                        value={TIPOS_EVENTO.includes(form.tipo_evento) ? form.tipo_evento : form.tipo_evento ? "Otro" : ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, tipo_evento: e.target.value, ...(e.target.value !== "Otro" && { tipo_evento_otro: "" }) }))}
                        className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#208DCA]/50 focus-visible:border-[#208DCA]/40"
                    >
                        <option value="">{ t("forms.select") }</option>
                        {TIPOS_EVENTO.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                    </select>
                    {form.tipo_evento === "Otro" && (
                        <Input
                            value={form.tipo_evento_otro ?? ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, tipo_evento_otro: e.target.value }))}
                            placeholder="Especifica el tipo de evento..."
                            className="mt-2"
                        />
                    )}
                </div>

                <div>
                    <label className="text-sm font-medium mb-1.5 block">{ t("forms.space_name") }</label>
                    <Input {...field("nombre_espacio")} placeholder="Ej: WiZink Center, Palacio de Deportes..." />
                </div>

                <div>
                    <label className="text-sm font-medium mb-1.5 block">{ t("forms.space_type") }</label>
                    <select
                        value={TIPOS_ESPACIO.includes(form.tipo_espacio) ? form.tipo_espacio : form.tipo_espacio ? "Otro" : ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, tipo_espacio: e.target.value, ...(e.target.value !== "Otro" && { tipo_espacio_otro: "" }) }))}
                        className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#208DCA]/50 focus-visible:border-[#208DCA]/40"
                    >
                        <option value="">{ t("forms.select") }</option>
                        {TIPOS_ESPACIO.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                    </select>
                    {form.tipo_espacio === "Otro" && (
                        <Input
                            value={form.tipo_espacio_otro ?? ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, tipo_espacio_otro: e.target.value }))}
                            placeholder={t("forms.specify_other")}
                            className="mt-2"
                        />
                    )}
                </div>

                <div>
                    <label className="text-sm font-medium mb-1.5 block">{ t("forms.plan_writer") }</label>
                    <Input {...field("nombre_redactor")} placeholder="Nombre del redactor" />
                </div>

                <div>
                    <label className="text-sm font-medium mb-1.5 block">{ t("forms.license_number") }</label>
                    <Input {...field("num_habilitacion")} placeholder="Número de habilitación profesional" />
                </div>
            </div>
        </SectionShell>
    );
}
