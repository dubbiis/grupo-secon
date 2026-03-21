import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SectionShell from "@/components/planes/SectionShell";

export default function Seccion4({ plan, section }) {
    const [form, setForm] = useState({
        aforo_total: "",
        num_accesos: "",
        descripcion_accesos: "",
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
                    <label className="text-sm font-medium mb-1.5 block">Aforo total *</label>
                    <Input type="number" {...field("aforo_total")} placeholder="Capacidad máxima del recinto" min={1} />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Número de accesos *</label>
                    <Input type="number" {...field("num_accesos")} placeholder="Número de entradas/salidas" min={1} />
                </div>
            </div>

            <div>
                <label className="text-sm font-medium mb-1.5 block">Descripción de accesos y zonas *</label>
                <Textarea
                    {...field("descripcion_accesos")}
                    placeholder="Describe cada acceso: Acceso Norte (público general), Acceso Sur (VIP), Puerta de servicio (personal)..."
                    rows={4}
                />
            </div>

            <div>
                <label className="text-sm font-medium mb-1.5 block">Transporte público cercano</label>
                <Textarea
                    {...field("datos_transporte_googlemaps")}
                    placeholder="Metro: L1 - Estación Plaza España (200m), L3 - Estación Sants (400m)&#10;Autobús: Líneas 9, 50, 56 - Parada Calle Mayor&#10;Renfe: Estación Sants (1.2km, 12min a pie)"
                    rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                    Indica las opciones de transporte público más cercanas con distancia aproximada.
                </p>
            </div>

            <div>
                <label className="text-sm font-medium mb-1.5 block">Parkings cercanos</label>
                <Textarea
                    {...field("datos_parkings_googlemaps")}
                    placeholder="Parking Arenas de Barcelona (150m, 800 plazas)&#10;Parking Pl. España (300m, 500 plazas)&#10;Zona regulada ORA en Calle de Lleida"
                    rows={3}
                />
            </div>
        </SectionShell>
    );
}
