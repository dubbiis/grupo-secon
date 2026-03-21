import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Send, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function GeneradorIA({ uuid, section, initialText, onTextChange, onStatusChange }) {
    const [text, setText] = useState(initialText ?? "");
    const [generating, setGenerating] = useState(false);
    const [showCambios, setShowCambios] = useState(false);
    const [instrucciones, setInstrucciones] = useState("");
    const [applyingCambios, setApplyingCambios] = useState(false);
    const textRef = useRef(null);

    useEffect(() => {
        setText(initialText ?? "");
    }, [initialText]);

    const scrollToBottom = () => {
        if (textRef.current) {
            textRef.current.scrollTop = textRef.current.scrollHeight;
        }
    };

    const streamSSE = async (url, body, onStart, onEnd) => {
        onStart();

        // SSE with fetch for POST
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": csrfToken,
                "Accept": "text/event-stream",
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            onEnd();
            return;
        }

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
                    if (parsed.done) {
                        onStatusChange?.();
                    }
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
            () => {
                setApplyingCambios(false);
                setInstrucciones("");
                setShowCambios(false);
            }
        );
    };

    return (
        <div className="space-y-4">
            {/* Generate button */}
            {!text && !generating && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Button
                        variant="secon"
                        onClick={handleGenerar}
                        className="gap-2"
                    >
                        <Sparkles size={16} />
                        Generar con IA
                    </Button>
                </motion.div>
            )}

            {/* Streaming text area */}
            <AnimatePresence>
                {(text || generating) && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {generating ? (
                                    <>
                                        <Loader2 size={14} className="text-[#208DCA] animate-spin" />
                                        <span className="text-sm text-muted-foreground">Generando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={14} className="text-[#208DCA]" />
                                        <span className="text-sm font-medium">Texto generado</span>
                                    </>
                                )}
                            </div>
                            {!generating && text && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleGenerar}
                                    className="text-muted-foreground gap-1 text-xs"
                                >
                                    <RefreshCw size={12} />
                                    Regenerar
                                </Button>
                            )}
                        </div>

                        {/* Text */}
                        <div
                            ref={textRef}
                            className="relative min-h-48 max-h-[500px] overflow-y-auto rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap"
                        >
                            {text}
                            {generating && (
                                <span className="inline-block w-0.5 h-4 bg-[#208DCA] animate-pulse ml-0.5 align-middle" />
                            )}
                        </div>

                        {/* Solicitar cambios */}
                        {!generating && text && (
                            <div className="border rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setShowCambios(!showCambios)}
                                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <RefreshCw size={14} className="text-[#208DCA]" />
                                        Solicitar cambios
                                    </span>
                                    {showCambios ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>

                                <AnimatePresence>
                                    {showCambios && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-4 pb-4 space-y-3 border-t">
                                                <Textarea
                                                    value={instrucciones}
                                                    onChange={(e) => setInstrucciones(e.target.value)}
                                                    placeholder="Ej: Cambia el número de asistentes a 5000, añade información sobre acceso para personas con movilidad reducida..."
                                                    rows={3}
                                                    className="mt-3"
                                                />
                                                <Button
                                                    variant="secon"
                                                    size="sm"
                                                    onClick={handleCambios}
                                                    disabled={applyingCambios || !instrucciones.trim()}
                                                    className="gap-2"
                                                >
                                                    {applyingCambios ? (
                                                        <><Loader2 size={14} className="animate-spin" /> Aplicando...</>
                                                    ) : (
                                                        <><Send size={14} /> Aplicar cambios</>
                                                    )}
                                                </Button>
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
