import { useForm, Link } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Save, Check, Code2 } from "lucide-react";
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

export default function PromptEdit({ prompt, flash }) {
    const { data, setData, put, processing, errors } = useForm({
        system_prompt: prompt.system_prompt,
        user_prompt_template: prompt.user_prompt_template,
        model: prompt.model,
        max_tokens: prompt.max_tokens,
    });

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
                            <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">Variables disponibles</p>
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

                    {/* User prompt template */}
                    <div className="p-5 rounded-2xl bg-white/3 border border-white/8 space-y-3">
                        <div>
                            <label className="text-xs font-semibold text-white/50 mb-1 block uppercase tracking-wide">User Prompt Template</label>
                            <p className="text-xs text-white/25">
                                Plantilla del mensaje usuario. Usa <code className="bg-white/8 px-1.5 py-0.5 rounded text-[#208DCA]">{"{{variable}}"}</code> para insertar datos del formulario.
                            </p>
                        </div>
                        <Textarea value={data.user_prompt_template} onChange={(e) => setData("user_prompt_template", e.target.value)} rows={14} className="font-mono text-xs" />
                        {errors.user_prompt_template && <p className="text-red-400 text-xs">{errors.user_prompt_template}</p>}
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
