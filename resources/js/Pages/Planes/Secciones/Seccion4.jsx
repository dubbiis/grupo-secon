import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SectionShell from "@/components/planes/SectionShell";
import PlacesPanel from "@/components/planes/PlacesPanel";
import { useTranslation } from "@/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { DoorOpen } from "lucide-react";

export default function Seccion4({ plan, section }) {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        aforo_total:               "",
        num_accesos:               "",
        descripcion_accesos:       "",
        accesos_detalle:           [],
        datos_transporte_googlemaps: "",
        datos_parkings_googlemaps: "",
        ...section.form_data,
    });

    const numAccesos = Math.max(1, parseInt(form.num_accesos) || 1);

    // Sync accesos_detalle array with num_accesos (minimum 1)
    useEffect(() => {
        setForm((prev) => {
            const current = prev.accesos_detalle || [];
            if (current.length === numAccesos) return prev;
            const updated = Array.from({ length: numAccesos }, (_, i) =>
                current[i] || { nombre: `Acceso ${i + 1}`, descripcion: "" }
            );
            return { ...prev, accesos_detalle: updated };
        });
    }, [numAccesos]);

    const updateAcceso = (idx, key, val) => {
        setForm((prev) => {
            const updated = [...(prev.accesos_detalle || [])];
            updated[idx] = { ...updated[idx], [key]: val };
            // Also sync to descripcion_accesos as combined text for AI
            const combined = updated.map((a) => `${a.nombre}: ${a.descripcion}`).filter((s) => s.length > 3).join("\n");
            return { ...prev, accesos_detalle: updated, descripcion_accesos: combined };
        });
    };

    const field = (key) => ({
        value: form[key],
        onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
    });

    const transportRef = useRef(null);
    const parkingRef = useRef(null);

    // Auto-resize textareas when value changes programmatically
    useEffect(() => {
        [transportRef, parkingRef].forEach((ref) => {
            const el = ref.current;
            if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
        });
    }, [form.datos_transporte_googlemaps, form.datos_parkings_googlemaps]);

    return (
        <SectionShell plan={plan} section={section} formData={form} onFormChange={setForm}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("s4.capacity")}</label>
                    <Input type="number" {...field("aforo_total")} placeholder="Capacidad máxima del recinto" min={1} />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("s4.accesses")}</label>
                    <Input type="number" {...field("num_accesos")} placeholder="Número de entradas/salidas" min={1} />
                </div>
            </div>

            {/* Access detail cards — always at least 1 */}
            <div className="space-y-3">
                <label className="text-sm font-medium block">{t("s4.access_desc")}</label>
                <AnimatePresence>
                        {(form.accesos_detalle || []).map((acceso, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ delay: i * 0.05 }}
                                className="rounded-xl border border-slate-200 bg-white p-3 space-y-2"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-[#208DCA]/10 flex items-center justify-center flex-shrink-0">
                                        <DoorOpen size={14} className="text-[#208DCA]" />
                                    </div>
                                    <Input
                                        value={acceso.nombre}
                                        onChange={(e) => updateAcceso(i, "nombre", e.target.value)}
                                        placeholder={`Nombre del acceso ${i + 1}`}
                                        className="text-sm font-medium"
                                    />
                                </div>
                                <Textarea
                                    value={acceso.descripcion}
                                    onChange={(e) => updateAcceso(i, "descripcion", e.target.value)}
                                    placeholder="Ubicación, tipo de público, controles de seguridad, ancho, señalización..."
                                    rows={2}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

            {/* ── Búsqueda automática de transporte ── */}
            <div className="space-y-3">
                <label className="text-sm font-medium block">{t("s4.transport")}</label>
                <PlacesPanel
                    uuid={plan.uuid}
                    type="transporte"
                    onResult={(fields) => setForm((prev) => ({ ...prev, ...fields }))}
                />
            </div>

            <div>
                <label className="text-sm font-medium mb-1.5 block">{t("s4.public_transport")}</label>
                <Textarea
                    ref={transportRef}
                    {...field("datos_transporte_googlemaps")}
                    placeholder="Metro: L1 - Estación Plaza España (200m), L3 - Estación Sants (400m)&#10;Autobús: Líneas 9, 50, 56 - Parada Calle Mayor&#10;Renfe: Estación Sants (1.2km, 12min a pie)"
                    rows={2}
                    style={{ minHeight: "3rem", overflow: "hidden" }}
                />
                <p className="text-xs text-slate-500 mt-1">
                    Rellenado automáticamente o escribe manualmente.
                </p>
            </div>

            <div>
                <label className="text-sm font-medium mb-1.5 block">{t("s4.parking_nearby")}</label>
                <Textarea
                    ref={parkingRef}
                    {...field("datos_parkings_googlemaps")}
                    placeholder="Parking Arenas de Barcelona (150m, 800 plazas)&#10;Parking Pl. España (300m, 500 plazas)&#10;Zona regulada ORA en Calle de Lleida"
                    rows={2}
                    style={{ minHeight: "3rem", overflow: "hidden" }}
                />
            </div>
        </SectionShell>
    );
}
