import { useState } from "react";
import { router } from "@inertiajs/react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import FileUpload from "@/components/planes/FileUpload";
import SectionShell from "@/components/planes/SectionShell";
import { FileDown, CheckCircle2, Save } from "lucide-react";

const PALETAS = [
    { id: "secon", label: "Secon Oficial", colors: ["#273887", "#208DCA", "#FFFFFF"] },
    { id: "elegante", label: "Elegante", colors: ["#1A1A1A", "#C9A96E", "#F5F5F5"] },
    { id: "energia", label: "Energía", colors: ["#CC0000", "#1A1A1A", "#FFFFFF"] },
    { id: "naturaleza", label: "Naturaleza", colors: ["#2E7D32", "#81C784", "#F5F5F5"] },
    { id: "moderno", label: "Moderno", colors: ["#6B21A8", "#06B6D4", "#FFFFFF"] },
];

const TIPOGRAFIAS = [
    { id: "roboto", label: "Roboto (Moderna)" },
    { id: "georgia", label: "Georgia (Clásica)" },
    { id: "arial", label: "Arial (Neutra)" },
    { id: "merriweather", label: "Merriweather (Formal)" },
    { id: "montserrat", label: "Montserrat (Corporativa)" },
];

export default function Seccion15({ plan, section, files = [] }) {
    const [form, setForm] = useState({
        titulo_pdf: plan.title ?? "",
        paleta: "secon",
        tipografia: "roboto",
        ...section.form_data,
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const logoFiles = files.filter((f) => f.file_category === "logo");
    const portadaFiles = files.filter((f) => f.file_category === "portada");

    const handleSave = () => {
        setSaving(true);
        router.put(
            `/planes/${plan.uuid}/seccion/15`,
            { form_data: form, generated_text: "", status: "listo" },
            {
                preserveScroll: true,
                onSuccess: () => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); },
                onError: () => setSaving(false),
            }
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            Sección 15
                        </span>
                        {saved && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="text-xs text-green-600 flex items-center gap-1">
                                <CheckCircle2 size={12} /> Guardado
                            </motion.span>
                        )}
                    </div>
                    <h2 className="text-xl font-bold">{section.section_name}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                        <Save size={14} />
                        {saving ? "Guardando..." : "Guardar"}
                    </Button>
                    <a href={`/planes/${plan.uuid}/pdf/descargar`} target="_blank">
                        <Button variant="secon" size="sm" className="gap-1.5">
                            <FileDown size={14} />
                            Generar PDF
                        </Button>
                    </a>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Título del plan en el PDF</label>
                    <Input
                        value={form.titulo_pdf}
                        onChange={(e) => setForm((prev) => ({ ...prev, titulo_pdf: e.target.value }))}
                        placeholder="Plan de Seguridad — Evento..."
                    />
                </div>

                <div>
                    <label className="text-sm font-medium mb-1.5 block">Paleta de colores</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {PALETAS.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => setForm((prev) => ({ ...prev, paleta: p.id }))}
                                className={`relative rounded-lg border-2 overflow-hidden transition-all ${
                                    form.paleta === p.id ? "border-[#208DCA] scale-105 shadow-md" : "border-input hover:border-muted-foreground"
                                }`}
                            >
                                <div className="flex h-10">
                                    {p.colors.map((c, i) => (
                                        <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                                    ))}
                                </div>
                                <p className="text-xs text-center py-1.5 font-medium">{p.label}</p>
                                {form.paleta === p.id && (
                                    <div className="absolute top-1 right-1 w-4 h-4 bg-[#208DCA] rounded-full flex items-center justify-center">
                                        <CheckCircle2 size={10} className="text-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium mb-1.5 block">Tipografía</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {TIPOGRAFIAS.map((tip) => (
                            <button
                                key={tip.id}
                                type="button"
                                onClick={() => setForm((prev) => ({ ...prev, tipografia: tip.id }))}
                                className={`px-4 py-2.5 rounded-lg border text-sm transition-all text-left ${
                                    form.tipografia === tip.id
                                        ? "bg-[#273887]/10 border-[#273887] text-[#273887] font-medium"
                                        : "border-input text-muted-foreground hover:border-muted-foreground"
                                }`}
                            >
                                {tip.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Logo del cliente</label>
                        <FileUpload
                            uuid={plan.uuid}
                            sectionNumber={15}
                            category="logo"
                            accept="image/*"
                            multiple={false}
                            existingFiles={logoFiles}
                            label="Subir logo"
                            description="PNG o SVG con fondo transparente recomendado"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Imagen de portada</label>
                        <FileUpload
                            uuid={plan.uuid}
                            sectionNumber={15}
                            category="portada"
                            accept="image/*"
                            multiple={false}
                            existingFiles={portadaFiles}
                            label="Subir imagen de portada"
                            description="JPG o PNG — formato apaisado recomendado"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
