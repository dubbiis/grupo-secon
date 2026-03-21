import { useForm, Link } from "@inertiajs/react";
import { Shield, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const MODELS = ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"];

// Variables que pueden usarse en los prompts
const COMMON_VARS = [
    "nombre_evento", "organizador", "direccion", "tipo_evento", "tipo_espacio",
    "num_asistentes", "fecha_inicio", "fecha_fin", "redactor", "num_habilitacion",
    "contexto_secciones_anteriores",
];

export default function PromptEdit({ prompt, flash }) {
    const { data, setData, put, processing, errors } = useForm({
        system_prompt: prompt.system_prompt,
        user_prompt_template: prompt.user_prompt_template,
        model: prompt.model,
        max_tokens: prompt.max_tokens,
    });

    const submit = (e) => {
        e.preventDefault();
        put(`/admin/prompts/${prompt.section_number}`);
    };

    const insertVar = (field, varName) => {
        setData(field, data[field] + `{{${varName}}}`);
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-[#253C87] flex items-center justify-center">
                        <Shield size={14} className="text-white" />
                    </div>
                    <span className="font-bold text-[#253C87]">Admin</span>
                    <span className="text-muted-foreground text-sm">
                        / <Link href="/admin/prompts" className="hover:underline">Prompts</Link>
                        {" "}/ Sección {prompt.section_number}
                    </span>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                <div className="mb-6">
                    <h1 className="text-xl font-bold">Sección {prompt.section_number}: {prompt.section_name}</h1>
                    <p className="text-sm text-muted-foreground mt-1">Edita el prompt que se envía a OpenAI</p>
                </div>

                {flash?.success && (
                    <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3">
                        {flash.success}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-6">
                    {/* Config */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Modelo</label>
                            <select
                                value={data.model}
                                onChange={(e) => setData("model", e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Max tokens</label>
                            <Input
                                type="number"
                                value={data.max_tokens}
                                onChange={(e) => setData("max_tokens", parseInt(e.target.value))}
                                min={512}
                                max={16000}
                            />
                        </div>
                    </div>

                    {/* Variables */}
                    <div>
                        <p className="text-sm font-medium mb-2">Variables disponibles</p>
                        <div className="flex flex-wrap gap-1.5">
                            {COMMON_VARS.map((v) => (
                                <button
                                    key={v}
                                    type="button"
                                    onClick={() => insertVar("user_prompt_template", v)}
                                    className="text-xs bg-[#253C87]/10 text-[#253C87] px-2 py-1 rounded-md font-mono hover:bg-[#253C87]/20 transition-colors"
                                >
                                    {`{{${v}}}`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* System prompt */}
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">System Prompt</label>
                        <p className="text-xs text-muted-foreground mb-2">Instrucción de sistema. Define el rol y comportamiento del modelo.</p>
                        <Textarea
                            value={data.system_prompt}
                            onChange={(e) => setData("system_prompt", e.target.value)}
                            rows={6}
                            className="font-mono text-xs"
                        />
                        {errors.system_prompt && <p className="text-destructive text-xs mt-1">{errors.system_prompt}</p>}
                    </div>

                    {/* User prompt template */}
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">User Prompt Template</label>
                        <p className="text-xs text-muted-foreground mb-2">
                            Plantilla del mensaje usuario. Usa <code className="bg-muted px-1 rounded">{"{{variable}}"}</code> para insertar datos del formulario.
                        </p>
                        <Textarea
                            value={data.user_prompt_template}
                            onChange={(e) => setData("user_prompt_template", e.target.value)}
                            rows={12}
                            className="font-mono text-xs"
                        />
                        {errors.user_prompt_template && <p className="text-destructive text-xs mt-1">{errors.user_prompt_template}</p>}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" variant="secon" disabled={processing} className="gap-2">
                            <Save size={14} />
                            {processing ? "Guardando..." : "Guardar prompt"}
                        </Button>
                        <Link href="/admin/prompts">
                            <Button type="button" variant="outline">Cancelar</Button>
                        </Link>
                    </div>
                </form>
            </main>
        </div>
    );
}
