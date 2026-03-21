import { useState, useMemo } from "react";
import { useForm, Link } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Save, Check, Code2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RippleButton } from "@/components/animate-ui/components/buttons/ripple";

const MODELS = ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"];

const COMMON_VARS = [
    "nombre_evento", "organizador", "direccion_evento", "tipo_evento", "nombre_espacio",
    "num_asistentes", "fecha_evento", "horario_evento", "aforo_total", "num_accesos",
    "perfil_publico", "hay_vips", "nombre_redactor", "num_habilitacion",
    "espacios_json", "vips_json", "hospitales_reales", "comisarias_reales",
    "datos_transporte_googlemaps", "contexto_secciones_anteriores",
];

// Valores de ejemplo realistas para la previsualización
const EXAMPLE_VALUES = {
    nombre_evento:        "Concierto Aitana — Madrid Arena 2025",
    organizador:          "Live Nation España S.L.",
    direccion_evento:     "Av. de la Capital de España, s/n, 28042 Madrid",
    tipo_evento:          "Concierto",
    nombre_espacio:       "Madrid Arena",
    num_asistentes:       "12.000",
    fecha_evento:         "15 de noviembre de 2025",
    horario_evento:       "20:00 h – 23:30 h (puertas: 19:00 h)",
    montaje_desmontaje:   "Montaje: 13/11/2025 · Desmontaje: 16/11/2025",
    aforo_total:          "12.500 personas",
    num_accesos:          "6 accesos (4 principales + 2 de emergencia)",
    perfil_publico:       "Mayoritariamente joven (18-35 años), femenino, ámbito nacional",
    rango_edad:           "18-35 años",
    ambito_geografico:    "Nacional",
    hay_vips:             "Sí",
    nombre_redactor:      "Carlos Martínez López",
    num_habilitacion:     "28/S/00123",
    productora:           "El Mundo es Mío Productions S.L.",
    descripcion_accesos:  "Acceso norte (principal), sur (VIP), este y oeste (emergencia)",
    espacios_json:        '[{"tipo":"Sala principal","direccion":"Av. de la Capital s/n","telefono":"91 722 04 00","email":"info@madridarena.es","persona_contacto":"Ana García"}]',
    vips_json:            '[{"nombre":"Zona VIP Platinum","descripcion":"300 personas, acceso lateral norte"}]',
    hospitales_reales:    "Hospital Universitario La Paz (4,2 km, 8 min) · Hospital Gregorio Marañón (6,8 km, 14 min)",
    comisarias_reales:    "Comisaría de Hortaleza (2,1 km, 5 min) · Comisaría de Barajas (5,3 km, 10 min)",
    datos_transporte_googlemaps: "Metro L8 (Campo de las Naciones, 350m) · Bus 122, 140 · Parking: 1.200 plazas en Recinto Ferial IFEMA",
    contexto_secciones_anteriores: "[Resumen de secciones 1-6 del plan de seguridad del evento]",
};

function applyExamples(template) {
    let result = template;
    for (const [key, value] of Object.entries(EXAMPLE_VALUES)) {
        result = result.replaceAll(`{{${key}}}`, value);
    }
    // Highlight any remaining unresolved variables
    result = result.replace(/\{\{(\w+)\}\}/g, (match) => `⚠ ${match} ⚠`);
    return result;
}

export default function PromptEdit({ prompt, flash }) {
    const [showPreview, setShowPreview] = useState(false);
    const { data, setData, put, processing, errors } = useForm({
        system_prompt: prompt.system_prompt,
        user_prompt_template: prompt.user_prompt_template,
        model: prompt.model,
        max_tokens: prompt.max_tokens,
    });

    const preview = useMemo(() => applyExamples(data.user_prompt_template), [data.user_prompt_template]);

    const submit = (e) => { e.preventDefault(); put(`/admin/prompts/${prompt.section_number}`); };

    const insertVar = (varName) => {
        setData("user_prompt_template", data.user_prompt_template + `{{${varName}}}`);
    };

    return (
        <div className="min-h-screen bg-[#07090f] text-white">
            <header className="border-b border-white/8 bg-black/30 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#253C87] to-[#208DCA] flex items-center justify-center">
                        <Shield size={13} className="text-white" />
                    </div>
                    <span className="font-bold text-white">Admin</span>
                    <span className="text-white/25 text-sm">
                        / <Link href="/admin/prompts" className="hover:text-white transition-colors">Prompts</Link>
                        {" "}/ Sección {prompt.section_number}
                    </span>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">
                        §{prompt.section_number} — {prompt.section_name}
                    </h1>
                    <p className="text-sm text-white/35 mt-1">Edita el prompt que se envía a OpenAI para esta sección</p>
                </div>

                <AnimatePresence>
                    {flash?.success && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="mb-6 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 flex items-center gap-2">
                            <Check size={14} />
                            {flash.success}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={submit} className="space-y-6">
                    {/* Model + tokens */}
                    <div className="grid grid-cols-2 gap-4 p-5 rounded-2xl bg-white/3 border border-white/8">
                        <div>
                            <label className="text-xs font-semibold text-white/35 mb-1.5 block uppercase tracking-wide">Modelo</label>
                            <select
                                value={data.model}
                                onChange={(e) => setData("model", e.target.value)}
                                className="flex h-9 w-full rounded-lg border border-white/10 bg-white/6 px-3 py-1 text-sm text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#208DCA]/50"
                            >
                                {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-white/35 mb-1.5 block uppercase tracking-wide">Max tokens</label>
                            <Input
                                type="number"
                                value={data.max_tokens}
                                onChange={(e) => setData("max_tokens", parseInt(e.target.value))}
                                min={512} max={16000}
                            />
                        </div>
                    </div>

                    {/* Variables */}
                    <div className="p-5 rounded-2xl bg-white/3 border border-white/8">
                        <div className="flex items-center gap-2 mb-3">
                            <Code2 size={13} className="text-[#208DCA]" />
                            <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">Variables disponibles — clic para insertar</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {COMMON_VARS.map((v) => (
                                <motion.button
                                    key={v}
                                    type="button"
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => insertVar(v)}
                                    className="text-xs bg-[#208DCA]/10 text-[#208DCA] border border-[#208DCA]/20 px-2 py-1 rounded-lg font-mono hover:bg-[#208DCA]/20 transition-colors"
                                >
                                    {`{{${v}}}`}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* System prompt */}
                    <div className="p-5 rounded-2xl bg-white/3 border border-white/8 space-y-3">
                        <div>
                            <label className="text-xs font-semibold text-white/50 mb-1 block uppercase tracking-wide">System Prompt</label>
                            <p className="text-xs text-white/25">Instrucción de sistema. Define el rol y el tono del modelo.</p>
                        </div>
                        <Textarea value={data.system_prompt} onChange={(e) => setData("system_prompt", e.target.value)} rows={6} className="font-mono text-xs" />
                        {errors.system_prompt && <p className="text-red-400 text-xs">{errors.system_prompt}</p>}
                    </div>

                    {/* User prompt template + preview */}
                    <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
                        {/* Tab bar */}
                        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/6">
                            <div>
                                <label className="text-xs font-semibold text-white/50 uppercase tracking-wide">User Prompt Template</label>
                                <p className="text-xs text-white/25 mt-0.5">
                                    Usa <code className="bg-white/8 px-1.5 py-0.5 rounded text-[#208DCA]">{"{{variable}}"}</code> para insertar datos del formulario.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPreview(!showPreview)}
                                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                                    showPreview
                                        ? "bg-[#208DCA]/15 border-[#208DCA]/30 text-[#208DCA]"
                                        : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/8"
                                }`}
                            >
                                {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
                                {showPreview ? "Ocultar previsualización" : "Vista previa con ejemplos"}
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Editor */}
                            <Textarea
                                value={data.user_prompt_template}
                                onChange={(e) => setData("user_prompt_template", e.target.value)}
                                rows={14}
                                className="font-mono text-xs"
                            />
                            {errors.user_prompt_template && <p className="text-red-400 text-xs">{errors.user_prompt_template}</p>}

                            {/* Preview panel */}
                            <AnimatePresence>
                                {showPreview && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.22 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="rounded-xl border border-[#208DCA]/20 bg-[#208DCA]/4 overflow-hidden">
                                            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#208DCA]/15 bg-[#208DCA]/6">
                                                <Eye size={12} className="text-[#208DCA]" />
                                                <span className="text-xs font-semibold text-[#208DCA] uppercase tracking-wide">Vista previa — datos de ejemplo</span>
                                                <span className="ml-auto text-xs text-white/25 font-mono">Concierto Aitana · Madrid Arena 2025</span>
                                            </div>
                                            <pre className="px-5 py-4 text-xs text-white/70 leading-relaxed whitespace-pre-wrap font-sans overflow-y-auto max-h-96">
                                                {preview}
                                            </pre>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <RippleButton type="submit" disabled={processing} className="bg-gradient-to-r from-[#253C87] to-[#208DCA] text-white border-0 gap-2">
                            <Save size={14} />
                            {processing ? "Guardando..." : "Guardar prompt"}
                        </RippleButton>
                        <Link href="/admin/prompts">
                            <Button type="button" variant="outline">Cancelar</Button>
                        </Link>
                    </div>
                </form>
            </main>
        </div>
    );
}
