import { useState, useRef } from "react";
import { router } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertTriangle, Search, Zap, X, Plus, Loader2, RefreshCw,
    Send, ChevronDown, ChevronRight, Save, CheckCircle2, Pencil, Eye, Sparkles,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { RippleButton } from "@/components/animate-ui/components/buttons/ripple";
import { Shine } from "@/components/animate-ui/primitives/effects/shine";
import { useTranslation } from "@/i18n";

function renderMarkdown(raw) {
    const escaped = raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return escaped
        .replace(/\*\*(.+?)\*\*/gs, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/gs, "<em>$1</em>")
        .replace(/---/g, "<hr class='border-slate-200 my-4'>")
        .replace(/\n/g, "<br>");
}

// Parse a full generated_text (joined with ---) back into per-risk array
function parseRiskTexts(fullText) {
    if (!fullText) return [];
    return fullText.split(/\n\n---\n\n/);
}

export default function Seccion7({ plan, section }) {
    const { t } = useTranslation();
    const [riesgos, setRiesgos] = useState(section.form_data?.riesgos ?? []);
    const [identifying, setIdentifying] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [currentRiskIdx, setCurrentRiskIdx] = useState(null);
    const [totalRisks, setTotalRisks] = useState(0);

    // Per-risk texts
    const [riskTexts, setRiskTexts] = useState(() => parseRiskTexts(section.generated_text ?? ""));

    // UI state
    const [expandedRisk, setExpandedRisk] = useState(null);
    const [editModes, setEditModes] = useState({});
    const [showCambios, setShowCambios] = useState({});
    const [instrucciones, setInstrucciones] = useState({});
    const [applyingCambios, setApplyingCambios] = useState({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const riskRefs = useRef({});

    const fullText = riskTexts.join("\n\n---\n\n");

    // -- Paso 1: Identificar --
    const handleIdentificar = async () => {
        setIdentifying(true);
        const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
        try {
            const res = await fetch(`/planes/${plan.uuid}/seccion/7/identificar-riesgos`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrf },
            });
            if (res.ok) {
                const data = await res.json();
                setRiesgos(data.riesgos ?? []);
                setRiskTexts([]);
            }
        } catch {}
        setIdentifying(false);
    };

    // -- Paso 2: Analizar --
    const handleAnalizar = async () => {
        if (riesgos.length === 0) return;
        setAnalyzing(true);
        setCurrentRiskIdx(null);
        setRiskTexts(Array(riesgos.length).fill(""));
        setExpandedRisk(0);

        const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
        try {
            const response = await fetch(`/planes/${plan.uuid}/seccion/7/analizar-riesgos`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrf, "Accept": "text/event-stream" },
                body: JSON.stringify({ riesgos }),
            });
            if (!response.ok) { setAnalyzing(false); return; }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let idx = 0;
            const texts = Array(riesgos.length).fill("");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;
                    try {
                        const parsed = JSON.parse(line.slice(6).trim());
                        if (parsed.riesgo_inicio) {
                            idx = parsed.riesgo_inicio - 1;
                            setCurrentRiskIdx(idx);
                            setTotalRisks(parsed.total);
                            setExpandedRisk(idx);
                        }
                        if (parsed.text) {
                            texts[idx] += parsed.text;
                            setRiskTexts([...texts]);
                            const el = riskRefs.current[idx];
                            if (el) el.scrollTop = el.scrollHeight;
                        }
                        if (parsed.done) setCurrentRiskIdx(null);
                    } catch {}
                }
            }
        } catch {}
        setAnalyzing(false);
    };

    // -- Cambios por riesgo --
    const handleCambios = async (i) => {
        const instr = instrucciones[i] ?? "";
        if (!instr.trim()) return;
        setApplyingCambios((p) => ({ ...p, [i]: true }));

        const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
        try {
            const response = await fetch(`/planes/${plan.uuid}/seccion/7/cambios`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrf, "Accept": "text/event-stream" },
                body: JSON.stringify({ instrucciones: instr, texto_actual: riskTexts[i] ?? "" }),
            });
            if (!response.ok) { setApplyingCambios((p) => ({ ...p, [i]: false })); return; }

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
                    try {
                        const parsed = JSON.parse(line.slice(6).trim());
                        if (parsed.text) {
                            accumulated += parsed.text;
                            setRiskTexts((prev) => {
                                const next = [...prev];
                                next[i] = accumulated;
                                return next;
                            });
                        }
                    } catch {}
                }
            }
        } catch {}
        setApplyingCambios((p) => ({ ...p, [i]: false }));
        setInstrucciones((p) => ({ ...p, [i]: "" }));
        setShowCambios((p) => ({ ...p, [i]: false }));
    };

    // -- Guardar --
    const save = (status) => {
        setSaving(true);
        router.put(
            `/planes/${plan.uuid}/seccion/7`,
            { form_data: { riesgos }, generated_text: fullText, status },
            {
                preserveScroll: true,
                onSuccess: () => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500); },
                onError: () => setSaving(false),
            }
        );
    };

    const confirm = () => {
        save("listo");
        setTimeout(() => router.visit(`/planes/${plan.uuid}/seccion/8`), 400);
    };

    const updateRiesgo = (i, field, val) => setRiesgos((p) => p.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
    const removeRiesgo = (i) => setRiesgos((p) => p.filter((_, idx) => idx !== i));
    const addRiesgo = () => setRiesgos((p) => [...p, { nombre: "", contexto: "" }]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#208DCA] animate-pulse" />
                    {t("common.section")} 7
                </span>
                <AnimatePresence>
                    {saved && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.8, x: -8 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: -8 }}
                            className="inline-flex items-center gap-1 text-xs text-green-500 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-lg"
                        >
                            <CheckCircle2 size={11} /> {t("common.saved")}
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 leading-tight">{t(`section_full_names.${section.section_number}`) || section.section_name}</h2>

            {/* Banner */}
            <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 rounded-xl bg-amber-500/8 border border-amber-500/20 p-4"
            >
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={15} className="text-amber-400" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-amber-400 mb-0.5">{t("section7.banner_title")}</p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        {t("section7.banner_description")}
                    </p>
                </div>
            </motion.div>

            {/* Paso 1: Identificar */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-xl shadow-slate-200/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Search size={14} className="text-[#208DCA]" />
                        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{t("section7.step1")}</span>
                    </div>
                    <Shine enableOnHover color="white" opacity={0.4} duration={600} asChild>
                        <button
                            onClick={handleIdentificar}
                            disabled={identifying}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#208DCA]/15 text-[#208DCA] border border-[#208DCA]/25 hover:bg-[#208DCA]/25 hover:border-[#208DCA]/40 transition-all disabled:opacity-50"
                        >
                            {identifying ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                            {identifying ? t("section7.identifying") : riesgos.length > 0 ? t("section7.re_identify") : t("section7.identify_risks")}
                        </button>
                    </Shine>
                </div>

                <AnimatePresence>
                    {riesgos.map((riesgo, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: i * 0.05 }}
                            className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2"
                        >
                            <div className="flex items-center gap-3">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[#208DCA]/15 text-[#208DCA] text-xs font-bold flex-shrink-0">
                                    {i + 1}
                                </span>
                                <input
                                    type="text"
                                    value={riesgo.nombre}
                                    onChange={(e) => updateRiesgo(i, "nombre", e.target.value)}
                                    placeholder={t("section7.risk_name_placeholder")}
                                    className="flex-1 bg-transparent border-none text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none uppercase"
                                />
                                <button onClick={() => removeRiesgo(i)} className="text-slate-400 hover:text-red-400 transition-colors p-1">
                                    <X size={14} />
                                </button>
                            </div>
                            <textarea
                                value={riesgo.contexto}
                                onChange={(e) => updateRiesgo(i, "contexto", e.target.value)}
                                placeholder={t("section7.risk_context_placeholder")}
                                rows={2}
                                className="w-full bg-transparent border-none text-xs text-slate-600 placeholder:text-slate-400 focus:outline-none resize-none leading-relaxed"
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>

                {riesgos.length > 0 && (
                    <button onClick={addRiesgo} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#208DCA] transition-colors">
                        <Plus size={12} /> {t("section7.add_risk")}
                    </button>
                )}
            </div>

            {/* Paso 2: Analizar */}
            {riesgos.length > 0 && (
                <div className="rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden">
                    <div className="px-6 pt-5 pb-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles size={14} className="text-[#208DCA]" />
                                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{t("section7.step2")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {riskTexts.some(Boolean) && !analyzing && (
                                    <Shine enableOnHover color="white" opacity={0.4} duration={600} asChild>
                                        <button
                                            onClick={handleAnalizar}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/15 text-purple-500 border border-purple-500/25 hover:bg-purple-500/25 transition-all"
                                        >
                                            <RefreshCw size={12} /> {t("common.regenerate_all")}
                                        </button>
                                    </Shine>
                                )}
                                {!riskTexts.some(Boolean) && !analyzing && (
                                    <Shine enableOnHover color="white" opacity={0.4} duration={600} asChild>
                                        <button
                                            onClick={handleAnalizar}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-[#273887] to-[#208DCA] text-white shadow-md shadow-[#273887]/25 hover:opacity-90 transition-all"
                                        >
                                            <Zap size={12} /> {t("section7.analyze_risks", { count: riesgos.length })}
                                        </button>
                                    </Shine>
                                )}
                            </div>
                        </div>

                        {/* Progress bar */}
                        {analyzing && currentRiskIdx !== null && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-3 p-3 rounded-xl bg-[#208DCA]/8 border border-[#208DCA]/20"
                            >
                                <Loader2 size={14} className="text-[#208DCA] animate-spin flex-shrink-0" />
                                <span className="text-xs text-[#208DCA]">
                                    {t("section7.analyzing_risk", { current: currentRiskIdx + 1, total: totalRisks })}: <strong>{riesgos[currentRiskIdx]?.nombre}</strong>
                                </span>
                                <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-[#273887] to-[#208DCA] rounded-full"
                                        initial={{ width: "0%" }}
                                        animate={{ width: `${((currentRiskIdx + 1) / totalRisks) * 100}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Risk cards */}
                        <AnimatePresence>
                            {riesgos.map((riesgo, i) => {
                                const text = riskTexts[i] ?? "";
                                const isStreaming = analyzing && currentRiskIdx === i;
                                const isExpanded = expandedRisk === i;
                                const isEditMode = !!editModes[i];
                                const isCambiosOpen = !!showCambios[i];
                                const isApplying = !!applyingCambios[i];

                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        className="rounded-xl border border-slate-200 overflow-hidden bg-white"
                                    >
                                        {/* Card header */}
                                        <div
                                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors ${isExpanded ? "bg-slate-50" : "hover:bg-slate-50"}`}
                                            onClick={() => setExpandedRisk(isExpanded ? null : i)}
                                        >
                                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold flex-shrink-0 transition-all ${
                                                text ? "bg-[#208DCA]/15 text-[#208DCA] border border-[#208DCA]/20" : isStreaming ? "bg-amber-400/15 text-amber-500 border border-amber-400/20" : "bg-slate-100 text-slate-400 border border-slate-200"
                                            }`}>
                                                {isStreaming ? <Loader2 size={11} className="animate-spin" /> : i + 1}
                                            </span>
                                            <span className="flex-1 text-sm font-semibold text-slate-800 uppercase tracking-wide truncate">
                                                {riesgo.nombre || t("section7.risk_n", { n: i + 1 })}
                                            </span>
                                            {text && (
                                                <span className="text-[10px] text-[#208DCA] bg-[#208DCA]/10 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                                                    {t("common.analyzed")}
                                                </span>
                                            )}
                                            {isStreaming && (
                                                <span className="text-[10px] text-amber-500 bg-amber-400/10 px-2 py-0.5 rounded-full font-medium flex-shrink-0 animate-pulse">
                                                    {t("common.generating")}
                                                </span>
                                            )}
                                            <motion.div
                                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="text-slate-400 flex-shrink-0"
                                            >
                                                <ChevronDown size={14} />
                                            </motion.div>
                                        </div>

                                        {/* Card body */}
                                        <AnimatePresence initial={false}>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: "auto" }}
                                                    exit={{ height: 0 }}
                                                    transition={{ duration: 0.22, ease: "easeInOut" }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-4 pb-4 pt-3 space-y-3 border-t border-slate-100">
                                                        {/* Edit toggle */}
                                                        {text && !isStreaming && (
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Shine enableOnHover color="white" opacity={0.4} duration={600} asChild>
                                                                    <button
                                                                        onClick={() => setEditModes((p) => ({ ...p, [i]: !p[i] }))}
                                                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[#208DCA]/10 text-[#208DCA] border border-[#208DCA]/20 hover:bg-[#208DCA]/20 transition-all"
                                                                    >
                                                                        {isEditMode ? <><Eye size={11} /> {t("ai.preview")}</> : <><Pencil size={11} /> {t("common.edit")}</>}
                                                                    </button>
                                                                </Shine>
                                                            </div>
                                                        )}

                                                        {/* Text area */}
                                                        {(text || isStreaming) ? (
                                                            isEditMode || isStreaming ? (
                                                                <textarea
                                                                    ref={(el) => { riskRefs.current[i] = el; }}
                                                                    value={text}
                                                                    onChange={(e) => setRiskTexts((p) => {
                                                                        const next = [...p];
                                                                        next[i] = e.target.value;
                                                                        return next;
                                                                    })}
                                                                    readOnly={isStreaming}
                                                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800 resize-none focus:outline-none focus:border-[#208DCA]/40 focus:ring-1 focus:ring-[#208DCA]/30 transition-colors field-sizing-content min-h-[180px]"
                                                                    placeholder={t("section7.analysis_placeholder")}
                                                                />
                                                            ) : (
                                                                <div
                                                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800 min-h-[100px]"
                                                                    dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
                                                                />
                                                            )
                                                        ) : (
                                                            <div className="py-6 text-center text-xs text-slate-400">
                                                                {t("common.not_analyzed")}
                                                            </div>
                                                        )}

                                                        {/* Solicitar cambios */}
                                                        {text && !isStreaming && (
                                                            <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                                                                <button
                                                                    onClick={() => setShowCambios((p) => ({ ...p, [i]: !p[i] }))}
                                                                    className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                                                >
                                                                    <span className="flex items-center gap-1.5">
                                                                        <RefreshCw size={11} className="text-[#208DCA]" />
                                                                        {t("common.request_changes_risk")}
                                                                    </span>
                                                                    <motion.div animate={{ rotate: isCambiosOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                                                        <ChevronDown size={12} />
                                                                    </motion.div>
                                                                </button>
                                                                <AnimatePresence>
                                                                    {isCambiosOpen && (
                                                                        <motion.div
                                                                            initial={{ height: 0, opacity: 0 }}
                                                                            animate={{ height: "auto", opacity: 1 }}
                                                                            exit={{ height: 0, opacity: 0 }}
                                                                            transition={{ duration: 0.2 }}
                                                                            className="overflow-hidden"
                                                                        >
                                                                            <div className="px-3 pb-3 pt-2 space-y-2 border-t border-slate-200">
                                                                                <Textarea
                                                                                    value={instrucciones[i] ?? ""}
                                                                                    onChange={(e) => setInstrucciones((p) => ({ ...p, [i]: e.target.value }))}
                                                                                    placeholder={t("section7.changes_placeholder")}
                                                                                    rows={2}
                                                                                />
                                                                                <RippleButton
                                                                                    size="sm"
                                                                                    onClick={() => handleCambios(i)}
                                                                                    disabled={isApplying || !(instrucciones[i] ?? "").trim()}
                                                                                    className="bg-gradient-to-r from-[#273887] to-[#208DCA] text-white border-0 gap-2 text-xs"
                                                                                >
                                                                                    {isApplying
                                                                                        ? <><Loader2 size={11} className="animate-spin" /> {t("common.applying")}</>
                                                                                        : <><Send size={11} /> {t("ai.apply_changes")}</>
                                                                                    }
                                                                                </RippleButton>
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Botones guardar / confirmar */}
            <div className="flex items-center justify-end gap-3">
                <button
                    onClick={() => save(section.status)}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 shadow-sm"
                >
                    {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                    {saving ? "..." : t("common.save")}
                </button>
                <RippleButton
                    onClick={confirm}
                    className="bg-gradient-to-r from-[#273887] to-[#208DCA] text-white border-0 gap-2 shadow-md shadow-[#273887]/25 px-5 py-2"
                >
                    {t("common.confirm")}
                    <ChevronRight size={14} />
                </RippleButton>
            </div>
        </div>
    );
}
