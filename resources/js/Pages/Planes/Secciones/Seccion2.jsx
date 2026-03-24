import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SectionShell from "@/components/planes/SectionShell";
import { useTranslation } from "@/i18n";

export default function Seccion2({ plan, section }) {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        descripcion_general: "",
        objetivo_evento: "",
        fecha_inicio: "",
        fecha_fin: "",
        horario_apertura: "",
        horario_cierre: "",
        inicio_montaje: "",
        fin_montaje: "",
        aforo_previsto: "",
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
        montaje_desmontaje: form.inicio_montaje && form.fin_montaje
            ? `Inicio montaje: ${form.inicio_montaje} / Fin montaje: ${form.fin_montaje}`
            : form.inicio_montaje || "",
    }), [form]);

    return (
        <SectionShell plan={plan} section={section} formData={formConDerivados} onFormChange={setForm}>
            <div>
                <label className="text-sm font-medium mb-1.5 block">{t("s2.event_desc")}</label>
                <Textarea
                    {...field("descripcion_general")}
                    placeholder={t("s2.event_desc_ph")}
                    rows={4}
                />
            </div>

            <div>
                <label className="text-sm font-medium mb-1.5 block">{t("forms.event_objective")}</label>
                <Textarea
                    {...field("objetivo_evento")}
                    placeholder={t("s2.event_obj_ph")}
                    rows={3}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("s2.date_start")}</label>
                    <Input type="date" {...field("fecha_inicio")} />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("s2.date_end")}</label>
                    <Input type="date" {...field("fecha_fin")} />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("forms.opening_time")}</label>
                    <Input type="time" {...field("horario_apertura")} />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("forms.closing_time")}</label>
                    <Input type="time" {...field("horario_cierre")} />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("s2.setup_start")}</label>
                    <Input {...field("inicio_montaje")} placeholder={t("s2.setup_start_ph")} />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("s2.setup_end")}</label>
                    <Input {...field("fin_montaje")} placeholder={t("s2.setup_end_ph")} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("s2.capacity")}</label>
                    <Input
                        type="number"
                        {...field("aforo_previsto")}
                        placeholder={t("s2.capacity_ph")}
                        min={1}
                    />
                </div>
            </div>
        </SectionShell>
    );
}
