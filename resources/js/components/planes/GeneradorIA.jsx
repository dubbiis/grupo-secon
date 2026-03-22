import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Send, ChevronDown, Loader2, Zap, Pencil, Eye } from "lucide-react";
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
        .replace(/\n/g, "<br>");
}

export default function GeneradorIA({ uuid, section, formData, initialText, onTextChange, onStatusChange }) {
    const [text, setText] = useState(initialText ?? "");
    const [generating, setGenerating] = useState(false);
    const [showCambios, setShowCambios] = useState(false);
    const [instrucciones, setInstrucciones] = useState("");
    const [applyingCambios, setApplyingCambios] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const textRef = useRef(null);

    useEffect(() => { setText(initialText ?? ""); }, [initialText]);

    const scrollToBottom = () => {
        if (textRef.current) textRef.current.scrollTop = textRef.current.scrollHeight;
    };

    const streamSSE = async (url, body, onStart, onEnd) => {
        onStart();
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrfToken, "Accept": "text/event-stream" },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) { onEnd(); return; }

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
                        setText(accumulated);
                        onTextChange?.(accumulated);
                        scrollToBottom();
                    }
                    if (parsed.done) onStatusChange?.();
                } catch {}
            }
        }
        onEnd();
    };

    const handleGenerar = () => {
        setText("");
        setEditMode(false);
        streamSSE(
            `/planes/${uuid}/seccion/${section}/generar`,
            { form_data: formData ?? {} },
            () => setGenerating(true),
            () => setGenerating(false)
        );
    };

    const handleCambios = () => {
        if (!instrucciones.trim()) return;
        setEditMode(false);
        streamSSE(
            `/planes/${uuid}/seccion/${section}/cambios`,
            { instrucciones, texto_actual: text },
            () => setApplyingCambios(true),
            () => { setApplyingCambios(false); setInstrucciones(""); setShowCambios(false); }
        );
    };

    return (
        <div className="space-y-4">

            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
                <div className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#208DCA]" />
                    <span className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Generador IA</span>
                </div>
            </div>

            {/* Generate button (when no text yet) */}
            {!text && !generating && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <RippleButton
                        onClick={handleGenerar}
                        className="bg-gradient-to-r from-[#273887] to-[#208DCA] text-white border-0 gap-2 shadow-lg shadow-[#273887]/25 hover:shadow-[#273887]/40 hover:opacity-90"
                    >
                        <Zap size={15} />
                        Generar con IA
                    </RippleButton>
                </motion.div>
            )}

            {/* Generated text */}
            <AnimatePresence>
                {(text || generating) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                    >
                        {/* Top bar */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {generating ? (
                                    <>
                                        <Loader2 size={13} className="text-[#208DCA] animate-spin" />
                                        <span className="text-xs text-slate-900">Generando texto...</span>
                                        <div className="flex gap-0.5">
                                            <span className="w-1 h-1 rounded-full bg-[#208DCA]/60 dot-pulse dot-pulse-0" />
                                            <span className="w-1 h-1 rounded-full bg-[#208DCA]/60 dot-pulse dot-pulse-1" />
                                            <span className="w-1 h-1 rounded-full bg-[#208DCA]/60 dot-pulse dot-pulse-2" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {editMode
                                            ? <Pencil size={12} className="text-[#208DCA]" />
                                            : <Eye size={12} className="text-slate-900" />
                                        }
                                        <span className="text-xs text-slate-900">
                                            {editMode ? "Editando texto" : "Vista previa"}
                                        </span>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {!generating && text && (
                                    <Shine enableOnHover color="white" opacity={0.4} duration={600} asChild>
                                        <button
                                            onClick={() => setEditMode((m) => !m)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-[#208DCA]/15 text-[#208DCA] border border-[#208DCA]/25 hover:bg-[#208DCA]/25 hover:border-[#208DCA]/40 hover:shadow-md hover:shadow-[#208DCA]/10"
                                        >
                                            {editMode ? <><Eye size={12} /> Vista previa</> : <><Pencil size={12} /> Editar</>}
                                        </button>
                                    </Shine>
                                )}
                                {!generating && text && (
                                    <Shine enableOnHover color="white" opacity={0.4} duration={600} asChild>
                                        <button
                                            onClick={handleGenerar}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-purple-500/15 text-purple-400 border border-purple-500/25 hover:bg-purple-500/25 hover:border-purple-500/40 hover:shadow-md hover:shadow-purple-500/10"
                                        >
                                            <RefreshCw size={12} />
                                            Regenerar
                                        </button>
                                    </Shine>
                                )}
                            </div>
                        </div>

                        {/* Text area */}
                        <div className="relative">
                            {generating || editMode ? (
                                <>
                                    <textarea
                                        ref={textRef}
                                        value={text}
                                        onChange={(e) => {
                                            setText(e.target.value);
                                            onTextChange?.(e.target.value);
                                        }}
                                        readOnly={generating}
                                        rows={6}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-100 p-5 text-sm leading-relaxed text-slate-900 shadow-inner resize-none focus:outline-none focus:border-[#208DCA]/40 focus:ring-1 focus:ring-[#208DCA]/30 transition-colors font-sans field-sizing-content min-h-[150px]"
                                        placeholder="El texto generado aparecerá aquí."
                                    />
                                    {generating && (
                                        <span className="absolute bottom-6 right-5 inline-block w-0.5 h-4 bg-[#208DCA] rounded-full animate-pulse" />
                                    )}
                                </>
                            ) : (
                                <div
                                    className="w-full rounded-xl border border-slate-200 bg-slate-100 p-5 text-sm leading-relaxed text-slate-900 shadow-inner min-h-[150px]"
                                    dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
                                />
                            )}
                        </div>

                        {/* Solicitar cambios */}
                        {!generating && text && (
                            <div className="rounded-xl border border-slate-200 bg-slate-200 overflow-hidden">
                                <button
                                    onClick={() => setShowCambios(!showCambios)}
                                    className="w-full flex items-center justify-between px-4 py-3 text-xs font-medium text-slate-900 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <RefreshCw size={12} className="text-[#208DCA]" />
                                        Solicitar cambios al texto
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
                                            <div className="px-4 pb-4 pt-2 space-y-3 border-t border-slate-200">
                                                <Textarea
                                                    value={instrucciones}
                                                    onChange={(e) => setInstrucciones(e.target.value)}
                                                    placeholder="Ej: Cambia el número de asistentes a 5.000, añade información sobre accesibilidad..."
                                                    rows={3}
                                                />
                                                <RippleButton
                                                    size="sm"
                                                    onClick={handleCambios}
                                                    disabled={applyingCambios || !instrucciones.trim()}
                                                    className="bg-gradient-to-r from-[#273887] to-[#208DCA] text-white border-0 gap-2 text-xs"
                                                >
                                                    {applyingCambios ? (
                                                        <><Loader2 size={12} className="animate-spin" /> Aplicando...</>
                                                    ) : (
                                                        <><Send size={12} /> Aplicar cambios</>
                                                    )}
                                                </RippleButton>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
