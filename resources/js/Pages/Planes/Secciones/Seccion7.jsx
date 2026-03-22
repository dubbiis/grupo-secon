import { useState, useRef, useEffect } from "react";
import { router } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertTriangle, Search, Zap, X, Plus, Loader2, RefreshCw,
    Send, ChevronDown, ChevronRight, Save, CheckCircle2, Pencil, Eye, Sparkles,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { RippleButton } from "@/components/animate-ui/components/buttons/ripple";
import { Shine } from "@/components/animate-ui/primitives/effects/shine";

function renderMarkdown(raw) {
    const escaped = raw
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    return escaped
        .replace(/\*\*(.+?)\*\*/gs, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/gs, "<em>$1</em>")
        .replace(/---/g, "<hr class='border-gray-200 my-4'>")
        .replace(/\n/g, "<br>");
}

export default function Seccion7({ plan, section }) {
    const [riesgos, setRiesgos] = useState(section.form_data?.riesgos ?? []);
    const [identifying, setIdentifying] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [currentRisk, setCurrentRisk] = useState(null);
    const [totalRisks, setTotalRisks] = useState(0);
    const [generatedText, setGeneratedText] = useState(section.generated_text ?? "");
    const [editMode, setEditMode] = useState(false);
    const [showCambios, setShowCambios] = useState(false);
    const [instrucciones, setInstrucciones] = useState("");
    const [applyingCambios, setApplyingCambios] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const textRef = useRef(null);

    const scrollToBottom = () => {
        if (textRef.current) textRef.current.scrollTop = textRef.current.scrollHeight;
    };

    // Paso 1: Identificar riesgos
    const handleIdentificar = async () => {
        setIdentifying(true);
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
        try {
            const res = await fetch(`/planes/${plan.uuid}/seccion/7/identificar-riesgos`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrfToken },
            });
            if (res.ok) {
                const data = await res.json();
                setRiesgos(data.riesgos ?? []);
            }
        } catch {}
        setIdentifying(false);
    };

    // Paso 2: Analizar todos los riesgos (SSE secuencial)
    const handleAnalizar = async () => {
        if (riesgos.length === 0) return;
        setAnalyzing(true);
        setGeneratedText("");
        setCurrentRisk(null);
        setEditMode(false);

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
        try {
            const response = await fetch(`/planes/${plan.uuid}/seccion/7/analizar-riesgos`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrfToken, "Accept": "text/event-stream" },
                body: JSON.stringify({ riesgos }),
            });
            if (!response.ok) { setAnalyzing(false); return; }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let accumulated = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;
                    const raw = line.slice(6).trim();
                    try {
                        const parsed = JSON.parse(raw);
                        if (parsed.riesgo_inicio) {
                            setCurrentRisk(parsed.riesgo_inicio);
                            setTotalRisks(parsed.total);
                        }
                        if (parsed.text) {
                            accumulated += parsed.text;
                            setGeneratedText(accumulated);
                            scrollToBottom();
                        }
                        if (parsed.done) {
                            setCurrentRisk(null);
                        }
                    } catch {}
                }
            }
        } catch {}
        setAnalyzing(false);
    };

    // Solicitar cambios
    const handleCambios = async () => {
        if (!instrucciones.trim()) return;
        setApplyingCambios(true);
        setEditMode(false);

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
        try {
            const response = await fetch(`/planes/${plan.uuid}/seccion/7/cambios`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrfToken, "Accept": "text/event-stream" },
                body: JSON.stringify({ instrucciones, texto_actual: generatedText }),
            });
            if (!response.ok) { setApplyingCambios(false); return; }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let accumulated = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;
                    const raw = line.slice(6).trim();
                    try {
                        const parsed = JSON.parse(raw);
                        if (parsed.text) {
                            accumulated += parsed.text;
                            setGeneratedText(accumulated);
                            scrollToBottom();
                        }
                    } catch {}
                }
            }
        } catch {}
        setApplyingCambios(false);
        setInstrucciones("");
        setShowCambios(false);
    };

    // Guardar
    const save = (status) => {
        setSaving(true);
        router.put(
            `/planes/${plan.uuid}/seccion/7`,
            { form_data: { riesgos }, generated_text: generatedText, status },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSaving(false);
                    setSaved(true);
                    setTimeout(() => setSaved(false), 2500);
                },
                onError: () => setSaving(false),
            }
        );
    };

    const confirm = () => {
        save("listo");
        setTimeout(() => router.visit(`/planes/${plan.uuid}/seccion/8`), 400);
    };

    // Editar riesgo
    const updateRiesgo = (index, field, value) => {
        setRiesgos((prev) => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
    };
    const removeRiesgo = (index) => setRiesgos((prev) => prev.filter((_, i) => i !== index));
    const addRiesgo = () => setRiesgos((prev) => [...prev, { nombre: "", contexto: "" }]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 text-gray-500 uppercase tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#208DCA] animate-pulse" />
                            Sección 7
                        </span>
                        <AnimatePresence>
                            {saved && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.8, x: -8 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, x: -8 }}
                                    className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-lg"
                                >
                                    <CheckCircle2 size={11} />
                                    Guardado
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 leading-tight">{section.section_name}</h2>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 pt-1">
                    <button
                        onClick={() => save(section.status)}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-200 disabled:opacity-50"
                    >
                        {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                        <span className="hidden sm:inline">{saving ? "..." : "Guardar"}</span>
                    </button>
                    <RippleButton
                        size="sm" onClick={confirm}
                        className="bg-gradient-to-r from-[#273887] to-[#208DCA] text-white border-0 gap-1.5 shadow-md shadow-[#273887]/25 text-xs"
                    >
                        Confirmar <ChevronRight size={13} />
                    </RippleButton>
                </div>
            </div>

            {/* Banner informativo */}
            <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 rounded-xl bg-amber-500/8 border border-amber-500/20 p-4"
            >
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={15} className="text-amber-400" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-amber-400 mb-0.5">Análisis de riesgos en 2 pasos</p>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Primero se identifican los riesgos relevantes para el evento, luego se analiza cada uno con evaluación cuantitativa.
                        Asegúrate de completar las secciones 1-6 antes de comenzar.
                    </p>
                </div>
            </motion.div>

            {/* Paso 1: Identificar riesgos */}
            <div className="rounded-2xl bg-white border border-gray-200 p-6 space-y-4 shadow-xl shadow-gray-200/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Search size={14} className="text-[#208DCA]" />
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Paso 1 — Identificar riesgos</span>
                    </div>
                    <Shine enableOnHover color="white" opacity={0.4} duration={600} asChild>
                        <button
                            onClick={handleIdentificar}
                            disabled={identifying}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-[#208DCA]/15 text-[#208DCA] border border-[#208DCA]/25 hover:bg-[#208DCA]/25 hover:border-[#208DCA]/40 disabled:opacity-50"
                        >
                            {identifying ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                            {identifying ? "Identificando..." : riesgos.length > 0 ? "Re-identificar" : "Identificar riesgos"}
                        </button>
                    </Shine>
                </div>

                {/* Cards de riesgos */}
                <AnimatePresence>
                    {riesgos.map((riesgo, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.05 }}
                            className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-2"
                        >
                            <div className="flex items-center gap-3">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[#208DCA]/15 text-[#208DCA] text-xs font-bold flex-shrink-0">
                                    {index + 1}
                                </span>
                                <input
                                    type="text"
                                    value={riesgo.nombre}
                                    onChange={(e) => updateRiesgo(index, "nombre", e.target.value)}
                                    placeholder="Nombre del riesgo"
                                    className="flex-1 bg-transparent border-none text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none uppercase"
                                />
                                <button
                                    onClick={() => removeRiesgo(index)}
                                    className="text-gray-300 hover:text-red-400 transition-colors p-1"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <textarea
                                value={riesgo.contexto}
                                onChange={(e) => updateRiesgo(index, "contexto", e.target.value)}
                                placeholder="Breve descripción del escenario de riesgo..."
                                rows={2}
                                className="w-full bg-transparent border-none text-xs text-gray-500 placeholder:text-gray-300 focus:outline-none resize-none leading-relaxed"
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>

                {riesgos.length > 0 && (
                    <button
                        onClick={addRiesgo}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#208DCA] transition-colors"
                    >
                        <Plus size={12} /> Añadir riesgo
                    </button>
                )}
            </div>

            {/* Paso 2: Analizar riesgos */}
            {riesgos.length > 0 && (
                <div className="rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden">
                    <div className="px-6 pt-5 pb-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles size={14} className="text-[#208DCA]" />
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Paso 2 — Análisis detallado</span>
                            </div>
                            {!generatedText && !analyzing && (
                                <Shine enableOnHover color="white" opacity={0.4} duration={600} asChild>
                                    <button
                                        onClick={handleAnalizar}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-gradient-to-r from-[#273887] to-[#208DCA] text-white shadow-md shadow-[#273887]/25 hover:opacity-90"
                                    >
                                        <Zap size={12} /> Analizar {riesgos.length} riesgos
                                    </button>
                                </Shine>
                            )}
                        </div>

                        {/* Progress indicator */}
                        {analyzing && currentRisk && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-3 p-3 rounded-xl bg-[#208DCA]/8 border border-[#208DCA]/20"
                            >
                                <Loader2 size={14} className="text-[#208DCA] animate-spin" />
                                <span className="text-xs text-[#208DCA]">
                                    Analizando riesgo {currentRisk} de {totalRisks}...
                                </span>
                                <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-[#273887] to-[#208DCA] rounded-full"
                                        initial={{ width: "0%" }}
                                        animate={{ width: `${(currentRisk / totalRisks) * 100}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Generated text area */}
                        {(generatedText || analyzing) && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                {/* Top bar */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {analyzing ? (
                                            <>
                                                <Loader2 size={13} className="text-[#208DCA] animate-spin" />
                                                <span className="text-xs text-gray-500">Generando análisis...</span>
                                            </>
                                        ) : (
                                            <>
                                                {editMode
                                                    ? <Pencil size={12} className="text-[#208DCA]" />
                                                    : <Eye size={12} className="text-gray-400" />
                                                }
                                                <span className="text-xs text-gray-500">
                                                    {editMode ? "Editando texto" : "Vista previa"}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!analyzing && generatedText && (
                                            <Shine enableOnHover color="white" opacity={0.4} duration={600} asChild>
                                                <button
                                                    onClick={() => setEditMode((m) => !m)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-[#208DCA]/15 text-[#208DCA] border border-[#208DCA]/25 hover:bg-[#208DCA]/25"
                                                >
                                                    {editMode ? <><Eye size={12} /> Vista previa</> : <><Pencil size={12} /> Editar</>}
                                                </button>
                                            </Shine>
                                        )}
                                        {!analyzing && generatedText && (
                                            <Shine enableOnHover color="white" opacity={0.4} duration={600} asChild>
                                                <button
                                                    onClick={handleAnalizar}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-purple-500/15 text-purple-400 border border-purple-500/25 hover:bg-purple-500/25"
                                                >
                                                    <RefreshCw size={12} /> Regenerar
                                                </button>
                                            </Shine>
                                        )}
                                    </div>
                                </div>

                                {/* Text content */}
                                <div className="relative">
                                    {analyzing || editMode ? (
                                        <>
                                            <textarea
                                                ref={textRef}
                                                value={generatedText}
                                                onChange={(e) => setGeneratedText(e.target.value)}
                                                readOnly={analyzing}
                                                rows={20}
                                                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm leading-relaxed text-gray-800 shadow-inner resize-y focus:outline-none focus:border-[#208DCA]/40 focus:ring-1 focus:ring-[#208DCA]/30 transition-colors font-sans"
                                                placeholder="El análisis aparecerá aquí."
                                            />
                                            {analyzing && (
                                                <span className="absolute bottom-6 right-5 inline-block w-0.5 h-4 bg-[#208DCA] rounded-full animate-pulse" />
                                            )}
                                        </>
                                    ) : (
                                        <div
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm leading-relaxed text-gray-800 shadow-inner min-h-[200px] max-h-[600px] overflow-y-auto"
                                            dangerouslySetInnerHTML={{ __html: renderMarkdown(generatedText) }}
                                        />
                                    )}
                                </div>

                                {/* Solicitar cambios */}
                                {!analyzing && generatedText && (
                                    <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                                        <button
                                            onClick={() => setShowCambios(!showCambios)}
                                            className="w-full flex items-center justify-between px-4 py-3 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                                        >
                                            <span className="flex items-center gap-2">
                                                <RefreshCw size={12} className="text-[#208DCA]" />
                                                Solicitar cambios al análisis
                                            </span>
                                            <motion.div animate={{ rotate: showCambios ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                                <ChevronDown size={13} />
                                            </motion.div>
                                        </button>
                                        <AnimatePresence>
                                            {showCambios && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-4 pb-4 pt-2 space-y-3 border-t border-gray-100">
                                                        <Textarea
                                                            value={instrucciones}
                                                            onChange={(e) => setInstrucciones(e.target.value)}
                                                            placeholder="Ej: Sube la probabilidad del riesgo de incendio, añade una medida sobre drones..."
                                                            rows={3}
                                                        />
                                                        <RippleButton
                                                            size="sm" onClick={handleCambios}
                                                            disabled={applyingCambios || !instrucciones.trim()}
                                                            className="bg-gradient-to-r from-[#273887] to-[#208DCA] text-white border-0 gap-2 text-xs"
                                                        >
                                                            {applyingCambios
                                                                ? <><Loader2 size={12} className="animate-spin" /> Aplicando...</>
                                                                : <><Send size={12} /> Aplicar cambios</>
                                                            }
                                                        </RippleButton>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
