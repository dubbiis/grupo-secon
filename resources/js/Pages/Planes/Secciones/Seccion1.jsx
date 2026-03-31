import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SectionShell from "@/components/planes/SectionShell";
import AddressAutocomplete from "@/components/planes/AddressAutocomplete";
import GoogleMapsProvider from "@/components/GoogleMapsProvider";
import { ChevronDown, Info } from "lucide-react";
import { useTranslation } from "@/i18n";

const EVENT_TYPE_KEYS = [
    "corporativo", "feria", "exposicion", "lanzamiento", "activacion",
    "concierto", "festival", "deportivo", "rodaje", "produccion",
    "close_protection", "otro",
];

const SPACE_TYPE_KEYS = [
    "estadio", "arena", "hotel", "espacio_eventos", "centro_convenciones",
    "showroom", "estudio", "plato", "recinto_ferial", "venue_outdoor", "otro",
];

export default function Seccion1({ plan, section }) {
    const { t } = useTranslation();

    const TIPOS_EVENTO = EVENT_TYPE_KEYS.map((k) => ({ key: k, label: t(`s1_event_types.${k}`) }));
    const TIPOS_ESPACIO = SPACE_TYPE_KEYS.map((k) => ({ key: k, label: t(`s1_space_types.${k}`) }));

    const [form, setForm] = useState({
        nombre_evento: "",
        organizador: "",
        direccion_evento: "",
        tipo_evento: "",
        tipo_evento_otro: "",
        nombre_espacio: "",
        tipo_espacio: "",
        tipo_espacio_otro: "",
        productora: "",
        nombre_redactor: "",
        num_habilitacion: "",
        info_adicional: "",
        ...section.form_data,
    });

    const [showExtra, setShowExtra] = useState(!!form.info_adicional);

    const field = (key) => ({
        value: form[key],
        onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
    });

    const eventTypeLabels = TIPOS_EVENTO.map((t) => t.label);
    const spaceTypeLabels = TIPOS_ESPACIO.map((t) => t.label);
    const otherEventLabel = TIPOS_EVENTO.find((t) => t.key === "otro")?.label;
    const otherSpaceLabel = TIPOS_ESPACIO.find((t) => t.key === "otro")?.label;

    return (
        <GoogleMapsProvider>
        <SectionShell plan={plan} section={section} formData={form} onFormChange={setForm} showCustomQuestions={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-1.5 block">{t("forms.event_name")} {t("forms.required")}</label>
                    <Input {...field("nombre_evento")} placeholder={t("s1.event_name_ph")} />
                </div>

                <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("forms.organizer")} {t("forms.required")}</label>
                    <Input {...field("organizador")} placeholder={t("s1.organizer_ph")} />
                </div>

                <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("forms.producer")}</label>
                    <Input {...field("productora")} placeholder={t("s1.producer_ph")} />
                </div>

                <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-1.5 block">{t("forms.address")} {t("forms.required")}</label>
                    <AddressAutocomplete
                        value={form.direccion_evento}
                        onChange={(val) => setForm((prev) => ({ ...prev, direccion_evento: val }))}
                        onSelect={(place) => setForm((prev) => ({
                            ...prev,
                            direccion_evento: place.displayName || place.name || prev.direccion_evento,
                        }))}
                        placeholder={t("s1.address_ph")}
                    />
                </div>

                <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("forms.event_type")}</label>
                    <select
                        value={eventTypeLabels.includes(form.tipo_evento) ? form.tipo_evento : form.tipo_evento ? otherEventLabel : ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, tipo_evento: e.target.value, ...(e.target.value !== otherEventLabel && { tipo_evento_otro: "" }) }))}
                        className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#208DCA]/50 focus-visible:border-[#208DCA]/40"
                    >
                        <option value="">{t("forms.select")}</option>
                        {TIPOS_EVENTO.map((tipo) => <option key={tipo.key} value={tipo.label}>{tipo.label}</option>)}
                    </select>
                    {form.tipo_evento === otherEventLabel && (
                        <Input
                            value={form.tipo_evento_otro ?? ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, tipo_evento_otro: e.target.value }))}
                            placeholder={t("s1.specify_event_type_ph")}
                            className="mt-2"
                        />
                    )}
                </div>

                <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("forms.space_name")}</label>
                    <Input {...field("nombre_espacio")} placeholder={t("s1.space_name_ph")} />
                </div>

                <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("forms.space_type")}</label>
                    <select
                        value={spaceTypeLabels.includes(form.tipo_espacio) ? form.tipo_espacio : form.tipo_espacio ? otherSpaceLabel : ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, tipo_espacio: e.target.value, ...(e.target.value !== otherSpaceLabel && { tipo_espacio_otro: "" }) }))}
                        className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#208DCA]/50 focus-visible:border-[#208DCA]/40"
                    >
                        <option value="">{t("forms.select")}</option>
                        {TIPOS_ESPACIO.map((tipo) => <option key={tipo.key} value={tipo.label}>{tipo.label}</option>)}
                    </select>
                    {form.tipo_espacio === otherSpaceLabel && (
                        <Input
                            value={form.tipo_espacio_otro ?? ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, tipo_espacio_otro: e.target.value }))}
                            placeholder={t("forms.specify_other")}
                            className="mt-2"
                        />
                    )}
                </div>

                <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("forms.plan_writer")}</label>
                    <Input {...field("nombre_redactor")} placeholder={t("s1.plan_writer_ph")} />
                </div>

                <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("forms.license_number")}</label>
                    <Input {...field("num_habilitacion")} placeholder={t("s1.license_ph")} />
                </div>
            </div>

            {/* Informacion adicional -- collapsible */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
                <button
                    type="button"
                    onClick={() => setShowExtra(!showExtra)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                    <span className="flex items-center gap-2">
                        <Info size={14} className="text-[#208DCA]" />
                        {t("s1.extra_info")}
                    </span>
                    <motion.div animate={{ rotate: showExtra ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown size={14} className="text-slate-400" />
                    </motion.div>
                </button>
                <AnimatePresence>
                    {showExtra && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="px-4 pb-4 pt-1 border-t border-slate-200">
                                <p className="text-xs text-slate-500 mb-2">{t("s1.extra_info_desc")}</p>
                                <Textarea
                                    value={form.info_adicional ?? ""}
                                    onChange={(e) => setForm((prev) => ({ ...prev, info_adicional: e.target.value }))}
                                    placeholder={t("s1.extra_info_ph")}
                                    rows={4}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </SectionShell>
        </GoogleMapsProvider>
    );
}
