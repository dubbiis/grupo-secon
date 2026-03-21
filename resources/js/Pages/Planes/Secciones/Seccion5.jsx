import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import SectionShell from "@/components/planes/SectionShell";
import FileUpload from "@/components/planes/FileUpload";
import { Info } from "lucide-react";

export default function Seccion5({ plan, section, files = [] }) {
    const [form, setForm] = useState({
        hospitales_reales: "",
        comisarias_reales: "",
        ...section.form_data,
    });

    const field = (key) => ({
        value: form[key],
        onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
    });

    const mapFiles = files.filter((f) => f.file_category === "imagen_ruta");

    return (
        <SectionShell plan={plan} section={section} formData={form} onFormChange={setForm}>
            <div className="flex items-start gap-3 rounded-xl bg-[#208DCA]/8 border border-[#208DCA]/20 p-4">
                <Info size={16} className="text-[#208DCA] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-white/60">
                    Busca en Google Maps los hospitales, comisarías y recursos de emergencia cercanos al lugar del evento
                    e introduce la información en los campos siguientes. La IA utilizará estos datos reales para redactar la sección.
                </p>
            </div>

            <div>
                <label className="text-sm font-medium mb-1.5 block">Recursos sanitarios cercanos *</label>
                <Textarea
                    {...field("hospitales_reales")}
                    placeholder={"Hospital Clinic (0.8km, 8min): Carrer de Villarroel 170, 93 227 54 00\nCAP Casanova (0.3km, 3min): Carrer de Casanova 143, 93 227 54 00\nHospital de la Santa Creu (1.2km): Carrer del Carme 47, 93 227 54 00"}
                    rows={5}
                />
                <p className="text-xs text-muted-foreground mt-1">
                    Nombre, distancia, dirección y teléfono de hospitales/urgencias en un radio de 5km.
                </p>
            </div>

            <div>
                <label className="text-sm font-medium mb-1.5 block">Fuerzas de seguridad cercanas *</label>
                <Textarea
                    {...field("comisarias_reales")}
                    placeholder={"Comisaría Policía Nacional (0.5km, 5min): Carrer de Rosselló 65, 091\nComisaría Policía Local (0.8km): Carrer de Nou de la Rambla 76-78\nCuartel Guardia Civil (2.1km): Carrer de Provença 337, 062"}
                    rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                    Policía Nacional, Policía Local y Guardia Civil más cercanas con distancia y teléfono.
                </p>
            </div>

            <div>
                <label className="text-sm font-medium mb-1.5 block">Mapa de rutas de emergencia</label>
                <FileUpload
                    uuid={plan.uuid}
                    sectionNumber={5}
                    category="imagen_ruta"
                    accept="image/*"
                    multiple
                    existingFiles={mapFiles}
                    label="Subir mapa / imagen de rutas"
                    description="PNG, JPG o PDF con la ubicación de recursos de emergencia"
                />
            </div>
        </SectionShell>
    );
}
