import { useState, useMemo } from "react";
import { useForm, Link } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Check, Code2, Eye, EyeOff, BookOpen, Zap, AlertTriangle } from "lucide-react";
import AppLayout from "@/components/AppLayout";
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
        example_output: prompt.example_output ?? "",
        use_example_output: prompt.use_example_output ?? false,
        model: prompt.model,
        max_tokens: prompt.max_tokens,
    });

    const preview = useMemo(() => applyExamples(data.user_prompt_template), [data.user_prompt_template]);

    const submit = (e) => { e.preventDefault(); put(`/admin/prompts/${prompt.section_number}`); };

    const insertVar = (varName) => {
        setData("user_prompt_template", data.user_prompt_template + `{{${varName}}}`);
    };

    return (
        <AppLayout
            title={`§${prompt.section_number} — ${prompt.section_name}`}
            subtitle="Edita el prompt que se envía a OpenAI para esta sección"
        >
            <div className="px-8 py-6 max-w-4xl mx-auto">
                <div className="mb-2">
                    <Link href="/admin/prompts" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                        ← Volver a Prompts
                    </Link>
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
                    <div className="p-5 rounded-2xl bg-white border border-gray-200 space-y-5">
                        <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#273887]/60 to-[#208DCA]/60 flex items-center justify-center flex-shrink-0">
                                <Code2 size={11} className="text-white" />
                            </div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Configuración del modelo IA</p>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            {/* Modelo */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 block uppercase tracking-wide">Modelo GPT</label>
                                <select
                                    value={data.model}
                                    onChange={(e) => setData("model", e.target.value)}
                                    className="flex h-9 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-1 text-sm text-gray-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#208DCA]/50"
                                >
                                    {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <div className="space-y-1.5 pt-1">
                                    {[
                                        { name: "gpt-4o-mini", desc: "Rápido y económico. Recomendado para la mayoría de secciones. Buena calidad con menor coste." },
                                        { name: "gpt-4o",      desc: "Máxima calidad. Usa para secciones críticas (análisis de riesgos, dispositivo de seguridad). Más lento y caro." },
                                        { name: "gpt-4-turbo", desc: "Equilibrio entre calidad y velocidad. Alternativa a gpt-4o con contexto muy largo." },
                                    ].map(({ name, desc }) => (
                                        <div key={name} className={`flex gap-2 p-2 rounded-lg transition-colors ${data.model === name ? "bg-[#208DCA]/8 border border-[#208DCA]/15" : "opacity-40"}`}>
                                            <span className="font-mono text-[10px] text-[#208DCA] flex-shrink-0 mt-0.5">{name}</span>
                                            <span className="text-[10px] text-gray-500 leading-snug">{desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Max tokens */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 block uppercase tracking-wide">Máximo de tokens</label>
                                <Input
                                    type="number"
                                    value={data.max_tokens}
                                    onChange={(e) => setData("max_tokens", parseInt(e.target.value))}
                                    min={512} max={16000}
                                />
                                <div className="space-y-2 pt-1">
                                    <p className="text-[10px] text-gray-500 leading-relaxed">
                                        Un <span className="text-gray-600 font-medium">token</span> equivale aproximadamente a ¾ de una palabra en español. El modelo detiene la generación al alcanzar este límite.
                                    </p>
                                    <div className="space-y-1">
                                        {[
                                            { range: "512 – 1.024",  label: "Respuesta corta",   hint: "Secciones de contactos o anexos" },
                                            { range: "2.048 – 4.096", label: "Respuesta media",  hint: "Mayoría de secciones (recomendado)" },
                                            { range: "6.000 – 8.000", label: "Respuesta larga",  hint: "Análisis de riesgos, dispositivo" },
                                            { range: "16.000",        label: "Máximo absoluto",  hint: "Solo si la sección es muy extensa" },
                                        ].map(({ range, label, hint }) => (
                                            <div key={range} className="flex items-start gap-2">
                                                <span className="font-mono text-[10px] text-gray-400 w-24 flex-shrink-0 pt-px">{range}</span>
                                                <div>
                                                    <span className="text-[10px] text-white/55 font-medium">{label}</span>
                                                    <span className="text-[10px] text-gray-400"> — {hint}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Variables */}
                    <div className="p-5 rounded-2xl bg-white border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                            <Code2 size={13} className="text-[#208DCA]" />
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Variables disponibles — clic para insertar</p>
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
                    <div className="p-5 rounded-2xl bg-white border border-gray-200 space-y-3">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 block uppercase tracking-wide">System Prompt</label>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Es la <span className="text-gray-600 font-medium">instrucción invisible</span> que recibe el modelo antes de leer el mensaje del usuario. Define su rol, tono y restricciones. El usuario final nunca lo ve.
                            </p>
                            <div className="flex flex-wrap gap-2 text-[10px]">
                                <span className="px-2 py-1 rounded-md bg-gray-100 border border-gray-200 text-gray-400">✓ Define el rol ("Eres un experto en...")</span>
                                <span className="px-2 py-1 rounded-md bg-gray-100 border border-gray-200 text-gray-400">✓ Idioma y formato de salida</span>
                                <span className="px-2 py-1 rounded-md bg-gray-100 border border-gray-200 text-gray-400">✓ Tono (formal, técnico, conciso)</span>
                                <span className="px-2 py-1 rounded-md bg-gray-100 border border-gray-200 text-gray-400">✗ No pongas datos del evento aquí</span>
                            </div>
                        </div>
                        <Textarea value={data.system_prompt} onChange={(e) => setData("system_prompt", e.target.value)} rows={6} className="font-mono text-xs" />
                        {errors.system_prompt && <p className="text-red-400 text-xs">{errors.system_prompt}</p>}
                    </div>

                    {/* User prompt template + preview */}
                    <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden">
                        {/* Tab bar */}
                        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">User Prompt Template</label>
                                <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                                    El mensaje que recibe el modelo <span className="text-gray-600 font-medium">con los datos reales del evento</span> ya insertados. Escribe el texto del prompt y usa <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[#208DCA] font-mono">{"{{variable}}"}</code> donde quieras que aparezca un dato del formulario.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPreview(!showPreview)}
                                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                                    showPreview
                                        ? "bg-[#208DCA]/15 border-[#208DCA]/30 text-[#208DCA]"
                                        : "bg-gray-100 border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
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
                                                <span className="ml-auto text-xs text-gray-400 font-mono">Concierto Aitana · Madrid Arena 2025</span>
                                            </div>
                                            <pre className="px-5 py-4 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans overflow-y-auto max-h-96">
                                                {preview}
                                            </pre>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Ejemplo de salida + toggle few-shot */}
                    <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden">
                        {/* Header */}
                        <div className="px-5 pt-5 pb-4 border-b border-gray-100 space-y-2">
                            <div className="flex items-center gap-2">
                                <BookOpen size={13} className="text-amber-400" />
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ejemplo de texto de salida</label>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">Opcional</span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">
                                Referencia del formato y estilo esperados para esta sección. Sirve como guía visual para el equipo y,
                                si se activa la opción de abajo, se envía a la IA junto con el prompt para mejorar la consistencia del resultado.
                            </p>
                        </div>

                        <div className="p-5 space-y-4">
                            <Textarea
                                value={data.example_output}
                                onChange={(e) => setData("example_output", e.target.value)}
                                rows={12}
                                className="text-xs leading-relaxed"
                                placeholder={"Pega aquí un ejemplo de texto bien redactado para esta sección...\n\nEj: El presente Plan de Seguridad tiene por objetivo..."}
                            />

                            {/* Toggle few-shot */}
                            <div className={`rounded-xl border p-4 transition-colors ${
                                data.use_example_output
                                    ? "border-amber-500/30 bg-amber-500/6"
                                    : "border-gray-200 bg-gray-50"
                            }`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1.5 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Zap size={12} className={data.use_example_output ? "text-amber-400" : "text-gray-400"} />
                                            <span className={`text-xs font-semibold ${data.use_example_output ? "text-amber-300" : "text-gray-500"}`}>
                                                Enviar ejemplo a la IA como guía de estilo
                                            </span>
                                            {data.use_example_output && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/25 text-amber-400 font-semibold">
                                                    ACTIVO
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-gray-400 leading-relaxed">
                                            Cuando está activo, el ejemplo se añade al final del mensaje del usuario con la instrucción{" "}
                                            <em>"úsalo solo como guía de estructura y tono, no lo copies"</em>.
                                            La IA tendrá una referencia explícita del formato esperado.
                                        </p>
                                        {data.use_example_output && data.example_output && (
                                            <div className="flex items-start gap-1.5 mt-2">
                                                <AlertTriangle size={11} className="text-amber-400/60 mt-px flex-shrink-0" />
                                                <p className="text-[10px] text-amber-400/60 leading-relaxed">
                                                    El ejemplo añade aproximadamente{" "}
                                                    <span className="font-semibold text-amber-400/80">
                                                        ~{Math.round(data.example_output.length / 3)} tokens extra
                                                    </span>{" "}
                                                    por cada generación (≈ ${(Math.round(data.example_output.length / 3) * 0.00000015).toFixed(6)} con gpt-4o-mini).
                                                    Para secciones con muchas generaciones, valorar si el beneficio compensa el coste.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Switch */}
                                    <button
                                        type="button"
                                        onClick={() => setData("use_example_output", !data.use_example_output)}
                                        disabled={!data.example_output?.trim()}
                                        className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-all duration-200 focus:outline-none ${
                                            data.use_example_output
                                                ? "bg-amber-500"
                                                : "bg-gray-200"
                                        } ${!data.example_output?.trim() ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
                                    >
                                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
                                            data.use_example_output ? "left-5" : "left-0.5"
                                        }`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <RippleButton type="submit" disabled={processing} className="bg-gradient-to-r from-[#273887] to-[#208DCA] text-white border-0 gap-2">
                            <Save size={14} />
                            {processing ? "Guardando..." : "Guardar prompt"}
                        </RippleButton>
                        <Link href="/admin/prompts">
                            <Button type="button" variant="outline">Cancelar</Button>
                        </Link>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
