import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SectionShell from "@/components/planes/SectionShell";
import PlacesPanel from "@/components/planes/PlacesPanel";
import { motion } from "framer-motion";
import { Bus, Train, ParkingCircle } from "lucide-react";
import { useTranslation } from "@/i18n";

const ATTENDEE_TYPE_KEYS = ["general_public", "artists_vips", "security_staff", "suppliers_techs", "press_accredited"];

export default function Seccion10({ plan, section, eventAddress = "" }) {
    const { t } = useTranslation();

    const TIPOS_ASISTENTES = ATTENDEE_TYPE_KEYS.map((k) => ({ key: k, label: t(`s10_attendee_types.${k}`) }));

    const [form, setForm] = useState({
        tipos_asistentes: "",
        vehiculos: "",
        hay_aparcamiento: "no",
        zonas_aparcamiento: "",
        datos_transporte_googlemaps: "",
        datos_parkings_googlemaps: "",
        ...section.form_data,
    });

    const field = (key) => ({
        value: form[key],
        onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
    });

    return (
        <SectionShell plan={plan} section={section} formData={form} onFormChange={setForm}>

            {/* Auto-search: Transport near event */}
            <div className="space-y-3">
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 rounded-xl bg-[#208DCA]/8 border border-[#208DCA]/20 p-4"
                >
                    <div className="w-8 h-8 rounded-lg bg-[#208DCA]/15 border border-[#208DCA]/20 flex items-center justify-center flex-shrink-0">
                        <Bus size={15} className="text-[#208DCA]" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-[#208DCA] mb-0.5">{t("s10.auto_search_title")}</p>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            {t("s10.auto_search_desc")}
                        </p>
                    </div>
                </motion.div>

                <PlacesPanel
                    uuid={plan.uuid}
                    type="transporte"
                    onResult={(fields) => setForm((prev) => ({ ...prev, ...fields }))}
                />
            </div>

            {/* Transport results (editable) */}
            {form.datos_transporte_googlemaps && (
                <div>
                    <label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
                        <Train size={14} className="text-[#208DCA]" />
                        {t("s10.nearby_transport")}
                    </label>
                    <Textarea
                        {...field("datos_transporte_googlemaps")}
                        rows={4}
                        placeholder={t("s10.nearby_transport_ph")}
                    />
                </div>
            )}

            {form.datos_parkings_googlemaps && (
                <div>
                    <label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
                        <ParkingCircle size={14} className="text-[#208DCA]" />
                        {t("s10.nearby_parking")}
                    </label>
                    <Textarea
                        {...field("datos_parkings_googlemaps")}
                        rows={3}
                        placeholder={t("s10.nearby_parking_ph")}
                    />
                </div>
            )}

            {/* Attendee profiles */}
            <div>
                <label className="text-sm font-medium mb-1.5 block">{t("s10.profiles")}</label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {TIPOS_ASISTENTES.map((tipo) => {
                        const selected = form.tipos_asistentes.split(",").map((s) => s.trim()).filter(Boolean).includes(tipo.label);
                        return (
                            <motion.button
                                key={tipo.key}
                                type="button"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => {
                                    const current = form.tipos_asistentes.split(",").map((s) => s.trim()).filter(Boolean);
                                    const updated = selected
                                        ? current.filter((t) => t !== tipo.label)
                                        : [...current, tipo.label];
                                    setForm((prev) => ({ ...prev, tipos_asistentes: updated.join(", ") }));
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                    selected
                                        ? "bg-gradient-to-r from-[#253C87] to-[#208DCA] text-white border-[#208DCA]/50 shadow-sm shadow-[#208DCA]/30"
                                        : "bg-white text-slate-500 border-slate-200 hover:border-[#208DCA]/50 hover:text-[#208DCA]"
                                }`}
                            >
                                {tipo.label}
                            </motion.button>
                        );
                    })}
                </div>
                <Input {...field("tipos_asistentes")} placeholder={t("s10.manual_ph")} />
            </div>

            {/* Vehicles */}
            <div>
                <label className="text-sm font-medium mb-1.5 block">{t("s10.vehicles")}</label>
                <Textarea
                    {...field("vehiculos")}
                    placeholder={t("s10.vehicles_ph")}
                    rows={3}
                />
            </div>

            {/* Parking */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("s10.parking_q")}</label>
                    <select
                        value={form.hay_aparcamiento}
                        onChange={(e) => setForm((prev) => ({ ...prev, hay_aparcamiento: e.target.value }))}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <option value="no">{t("common.no")}</option>
                        <option value="si">{t("common.yes")}</option>
                    </select>
                </div>
            </div>

            {form.hay_aparcamiento === "si" && (
                <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("s10.parking_desc")}</label>
                    <Textarea
                        {...field("zonas_aparcamiento")}
                        placeholder={t("s10.parking_zones_ph")}
                        rows={3}
                    />
                </div>
            )}
        </SectionShell>
    );
}
