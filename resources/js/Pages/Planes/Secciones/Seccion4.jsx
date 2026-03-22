import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SectionShell from "@/components/planes/SectionShell";
import PlacesPanel from "@/components/planes/PlacesPanel";
import { useTranslation } from "@/i18n";

export default function Seccion4({ plan, section }) {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        aforo_total:               "",
        num_accesos:               "",
        descripcion_accesos:       "",
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

            <div>
                <label className="text-sm font-medium mb-1.5 block">{t("s4.access_desc")}</label>
                <Textarea
                    {...field("descripcion_accesos")}
                    placeholder="Describe cada acceso: Acceso Norte (público general), Acceso Sur (VIP), Puerta de servicio (personal)..."
                    rows={4}
                />
            </div>

            {/* ── Búsqueda automática de transporte ── */}
            <div className="space-y-3">
                <label className="text-sm font-medium block">Transporte público y parkings</label>
                <PlacesPanel
                    uuid={plan.uuid}
                    type="transporte"
                    onResult={(fields) => setForm((prev) => ({ ...prev, ...fields }))}
                />
            </div>

            <div>
                <label className="text-sm font-medium mb-1.5 block">{t("s4.public_transport")}</label>
                <Textarea
                    {...field("datos_transporte_googlemaps")}
                    placeholder="Metro: L1 - Estación Plaza España (200m), L3 - Estación Sants (400m)&#10;Autobús: Líneas 9, 50, 56 - Parada Calle Mayor&#10;Renfe: Estación Sants (1.2km, 12min a pie)"
                    rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                    Rellenado automáticamente o escribe manualmente.
                </p>
            </div>

            <div>
                <label className="text-sm font-medium mb-1.5 block">{t("s4.parking_nearby")}</label>
                <Textarea
                    {...field("datos_parkings_googlemaps")}
                    placeholder="Parking Arenas de Barcelona (150m, 800 plazas)&#10;Parking Pl. España (300m, 500 plazas)&#10;Zona regulada ORA en Calle de Lleida"
                    rows={3}
                />
            </div>
        </SectionShell>
    );
}
