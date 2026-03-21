import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Send, ChevronDown, ChevronUp, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RippleButton } from "@/components/animate-ui/components/buttons/ripple";

export default function GeneradorIA({ uuid, section, initialText, onTextChange, onStatusChange }) {
    const [text, setText] = useState(initialText ?? "");
    const [generating, setGenerating] = useState(false);
    const [showCambios, setShowCambios] = useState(false);
    const [instrucciones, setInstrucciones] = useState("");
    const [applyingCambios, setApplyingCambios] = useState(false);
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
        streamSSE(
            `/planes/${uuid}/seccion/${section}/generar`,
            null,
            () => setGenerating(true),
            () => setGenerating(false)
        );
    };

    const handleCambios = () => {
        if (!instrucciones.trim()) return;
        streamSSE(
            `/planes/${uuid}/seccion/${section}/cambios`,
            { instrucciones },
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
                    <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">Generador IA</span>
                </div>
            </div>

            {/* Generate button (when no text yet) */}
            {!text && !generating && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <RippleButton
                        onClick={handleGenerar}
                        className="bg-gradient-to-r from-[#253C87] to-[#208DCA] text-white border-0 gap-2 shadow-lg shadow-[#253C87]/25 hover:shadow-[#253C87]/40 hover:opacity-90"
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
                                        <span className="text-xs text-white/40">Generando texto...</span>
                                        {/* Pulsing dots */}
                                        <div className="flex gap-0.5">
                                            {[0,1,2].map((i) => (
                                                <motion.div key={i} className="w-1 h-1 rounded-full bg-[#208DCA]/60"
                                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                                    transition={{ duration: 1, delay: i * 0.15, repeat: Infinity }}
                                                />
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                        <span className="text-xs text-white/50">Texto generado</span>
                                    </>
                                )}
                            </div>
                            {!generating && text && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleGenerar}
                                    className="text-white/30 hover:text-white gap-1.5 text-xs h-7"
                                >
                                    <RefreshCw size={11} />
                                    Regenerar
                                </Button>
                            )}
                        </div>

                        {/* Text display */}
                        <div
                            ref={textRef}
                            className="relative min-h-48 max-h-[500px] overflow-y-auto rounded-xl border border-white/8 bg-black/30 p-5 text-sm leading-relaxed whitespace-pre-wrap text-white/80 shadow-inner"
                        >
                            {text}
                            {generating && (
                                <motion.span
                                    animate={{ opacity: [1, 0, 1] }}
                                    transition={{ duration: 0.7, repeat: Infinity }}
                                    className="inline-block w-0.5 h-4 bg-[#208DCA] ml-0.5 align-middle rounded-full"
                                />
                            )}
                        </div>

                        {/* Solicitar cambios */}
                        {!generating && text && (
                            <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
                                <button
                                    onClick={() => setShowCambios(!showCambios)}
                                    className="w-full flex items-center justify-between px-4 py-3 text-xs font-medium text-white/50 hover:text-white hover:bg-white/4 transition-colors"
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
                                            <div className="px-4 pb-4 pt-2 space-y-3 border-t border-white/6">
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
                                                    className="bg-gradient-to-r from-[#253C87] to-[#208DCA] text-white border-0 gap-2 text-xs"
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
