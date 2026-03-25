import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SectionShell from "@/components/planes/SectionShell";
import PlacesPanel from "@/components/planes/PlacesPanel";
import { useTranslation } from "@/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { DoorOpen, ImagePlus } from "lucide-react";


function AccessPhotoUpload({ uuid, accessIdx, currentUrl, onUploaded }) {
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [localPreview, setLocalPreview] = useState(null);

    const upload = async (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => setLocalPreview(e.target.result);
        reader.readAsDataURL(file);

        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("file_category", `acceso_foto_${accessIdx}`);
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
            const res = await fetch(`/planes/${uuid}/seccion/4/archivo`, {
                method: "POST",
                headers: { "X-CSRF-TOKEN": csrfToken },
                body: fd,
            });
            if (res.ok) {
                const data = await res.json();
                onUploaded(data.url);
                setLocalPreview(null);
            }
        } finally {
            setUploading(false);
        }
    };

    const displayUrl = localPreview || currentUrl;

    return (
        <div
            className="w-full h-28 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#208DCA]/50 hover:bg-[#208DCA]/5 transition-all group relative overflow-hidden"
            onClick={() => inputRef.current?.click()}
        >
            {displayUrl ? (
                <>
                    <img src={displayUrl} alt="acceso" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ImagePlus size={18} className="text-white" />
                    </div>
                </>
            ) : uploading ? (
                <div className="text-xs text-[#208DCA] animate-pulse">Subiendo...</div>
            ) : (
                <>
                    <ImagePlus size={18} className="text-slate-400 group-hover:text-[#208DCA]/50 transition-colors" />
                    <span className="text-[10px] text-slate-400">Foto del acceso</span>
                </>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => upload(e.target.files?.[0])}
            />
        </div>
    );
}

export default function Seccion4({ plan, section }) {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        num_accesos:               "",
        descripcion_accesos:       "",
        accesos_detalle:           [],
        acceso_vehiculos_emergencia: "",
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
                current[i] || { nombre: `Acceso ${i + 1}`, descripcion: "", foto_url: "" }
            );
            return { ...prev, accesos_detalle: updated };
        });
    }, [numAccesos]);

    const updateAcceso = (idx, key, val) => {
        setForm((prev) => {
            const updated = [...(prev.accesos_detalle || [])];
            updated[idx] = { ...updated[idx], [key]: val };
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

    useEffect(() => {
        [transportRef, parkingRef].forEach((ref) => {
            const el = ref.current;
            if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
        });
    }, [form.datos_transporte_googlemaps, form.datos_parkings_googlemaps]);

    return (
        <SectionShell plan={plan} section={section} formData={form} onFormChange={setForm}>
            <div>
                <label className="text-sm font-medium mb-1.5 block">{t("s4.accesses")}</label>
                <Input type="number" {...field("num_accesos")} placeholder="Número de entradas/salidas" min={1} />
            </div>

            {/* Access detail cards */}
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
                            <AccessPhotoUpload
                                uuid={plan.uuid}
                                accessIdx={i}
                                currentUrl={acceso.foto_url}
                                onUploaded={(url) => updateAcceso(i, "foto_url", url)}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Acceso vehículos de emergencia */}
            <div>
                <label className="text-sm font-medium mb-1.5 block">{t("s4.emergency_access")}</label>
                <Textarea
                    {...field("acceso_vehiculos_emergencia")}
                    placeholder={t("s4.emergency_access_ph")}
                    rows={3}
                />
            </div>

            {/* Búsqueda automática de transporte */}
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
