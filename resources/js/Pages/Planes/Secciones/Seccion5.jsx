import { useState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import SectionShell from "@/components/planes/SectionShell";
import FileUpload from "@/components/planes/FileUpload";
import MapEditor from "@/components/planes/MapEditor";
import PlacesPanel from "@/components/planes/PlacesPanel";
import { Map } from "lucide-react";
import { useTranslation } from "@/i18n";

/** Parse "Nombre (dist): Dirección. Tel: ..." lines into { label, address } */
function parseResourceLines(text, prefix) {
    if (!text) return [];
    return text.split("\n").reduce((acc, line) => {
        const trimmed = line.trim();
        if (!trimmed) return acc;
        const colonIdx = trimmed.indexOf(":");
        if (colonIdx > 0) {
            const name = trimmed.slice(0, colonIdx).replace(/\s*\(.*?\)\s*$/, "").trim();
            const rest = trimmed.slice(colonIdx + 1).replace(/\.?\s*Tel[.:].*/i, "").trim();
            if (rest) acc.push({ label: `${prefix} ${name}`, address: rest });
        }
        return acc;
    }, []);
}

export default function Seccion5({ plan, section, files = [], eventAddress = "", planAddresses = [] }) {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        hospitales_reales: "",
        comisarias_reales: "",
        ...section.form_data,
    });
    const [showMapEditor, setShowMapEditor] = useState(false);

    // Combine plan addresses with live-parsed hospital/police addresses
    const allAddresses = useMemo(() => {
        const hospitals = parseResourceLines(form.hospitales_reales, "🏥");
        const police = parseResourceLines(form.comisarias_reales, "🚔");
        return [...planAddresses, ...hospitals, ...police];
    }, [planAddresses, form.hospitales_reales, form.comisarias_reales]);

    const field = (key) => ({
        value: form[key],
        onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
    });

    const mapFiles = files.filter((f) => f.file_category === "imagen_ruta");

    return (
        <SectionShell plan={plan} section={section} formData={form} onFormChange={setForm}>

            {/* ── Búsqueda automática de emergencias ── */}
            <div className="space-y-3">
                <label className="text-sm font-medium block">Recursos de emergencia cercanos</label>
                <PlacesPanel
                    uuid={plan.uuid}
                    type="emergencia"
                    onResult={(fields) => setForm((prev) => ({ ...prev, ...fields }))}
                />
            </div>

            <div>
                <label className="text-sm font-medium mb-1.5 block">{t("s5.hospitals")}</label>
                <Textarea
                    {...field("hospitales_reales")}
                    placeholder={"Hospital Clinic (0.8km, 8min): Carrer de Villarroel 170, 93 227 54 00\nCAP Casanova (0.3km, 3min): Carrer de Casanova 143, 93 227 54 00\nHospital de la Santa Creu (1.2km): Carrer del Carme 47, 93 227 54 00"}
                    rows={5}
                />
                <p className="text-xs text-muted-foreground mt-1">
                    Rellenado automáticamente o escribe manualmente. Nombre, distancia, dirección y teléfono.
                </p>
            </div>

            <div>
                <label className="text-sm font-medium mb-1.5 block">{t("s5.police")}</label>
                <Textarea
                    {...field("comisarias_reales")}
                    placeholder={"Comisaría Policía Nacional (0.5km, 5min): Carrer de Rosselló 65, 091\nComisaría Policía Local (0.8km): Carrer de Nou de la Rambla 76-78\nCuartel Guardia Civil (2.1km): Carrer de Provença 337, 062"}
                    rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                    Rellenado automáticamente o escribe manualmente. Policía Nacional, Local y Guardia Civil.
                </p>
            </div>

            {/* ── Map editor ── */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">{t("s5.route_map")}</label>
                    <button
                        onClick={() => setShowMapEditor((v) => !v)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${
                            showMapEditor
                                ? "bg-[#208DCA]/15 border-[#208DCA]/30 text-[#208DCA]"
                                : "bg-white border-slate-200 text-slate-900 hover:text-slate-900"
                        }`}
                    >
                        <Map size={12} />
                        {showMapEditor ? "Cerrar editor" : "Abrir editor de mapas"}
                    </button>
                </div>

                {showMapEditor && (
                    <MapEditor
                        mode="section"
                        uuid={plan.uuid}
                        sectionNumber={5}
                        category="imagen_ruta"
                        existingFiles={mapFiles}
                        onSaved={() => {}}
                        eventAddress={eventAddress}
                        planAddresses={allAddresses}
                    />
                )}

                <FileUpload
                    uuid={plan.uuid}
                    sectionNumber={5}
                    category="imagen_ruta"
                    accept="image/*"
                    multiple
                    existingFiles={mapFiles}
                    label="O sube una imagen de rutas"
                    description="PNG, JPG o PDF con la ubicación de recursos de emergencia"
                />
            </div>
        </SectionShell>
    );
}
