import { useState, useRef } from "react";
import { router } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Table2, Upload, Plus, X, ChevronRight, Save, CheckCircle2,
    RefreshCw, CloudUpload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RippleButton } from "@/components/animate-ui/components/buttons/ripple";
import { Shine } from "@/components/animate-ui/primitives/effects/shine";
import * as XLSX from "xlsx";

const FIELDS = ["dia", "nombre", "inicio", "fin", "cantidad", "categoria", "horas"];
const LABELS = { dia: "Día", nombre: "Nombre / Posición", inicio: "Inicio", fin: "Fin", cantidad: "Nº", categoria: "Categoría", horas: "Horas" };

// Header patterns to detect columns dynamically
const HEADER_PATTERNS = {
    dia: /day|d[ií]a|jornada/i,
    nombre: /name.*pos|pos.*name|nombre|position|puesto/i,
    inicio: /start|inicio|entrada|hora.*ini/i,
    fin: /finish|fin|salida|hora.*fin|end/i,
    cantidad: /number|n[uú]mero|cantidad|n[°º]/i,
    categoria: /type.*guard|categor|tipo/i,
    horas: /total.*hour|hora.*total|total.*hora|horas/i,
};

function formatTime(val) {
    if (val == null || val === "") return "";
    if (typeof val === "number" && val >= 0 && val <= 1) {
        const totalMinutes = Math.round(val * 24 * 60);
        const h = Math.floor(totalMinutes / 60) % 24;
        const m = totalMinutes % 60;
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    // Already a string like "08:00" or Date
    const s = String(val);
    const timeMatch = s.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) return `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
    return s;
}

function parseExcel(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const wb = XLSX.read(e.target.result, { type: "array" });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

                // Step 1: Find header row by scanning for known column names
                let headerRowIdx = -1;
                let colMap = {};

                for (let r = 0; r < Math.min(20, raw.length); r++) {
                    const row = raw[r];
                    if (!row) continue;
                    const matched = {};
                    for (let c = 0; c < row.length; c++) {
                        const cellText = String(row[c] ?? "").trim();
                        if (!cellText) continue;
                        for (const [field, pattern] of Object.entries(HEADER_PATTERNS)) {
                            if (!matched[field] && pattern.test(cellText)) {
                                matched[field] = c;
                            }
                        }
                    }
                    // Need at least 3 matches to consider this the header row
                    if (Object.keys(matched).length >= 3) {
                        headerRowIdx = r;
                        colMap = matched;
                        break;
                    }
                }

                if (headerRowIdx === -1) {
                    // Fallback: try fixed positions
                    headerRowIdx = 6;
                    colMap = { dia: 5, nombre: 6, inicio: 8, fin: 10, cantidad: 12, categoria: 13, horas: 14 };
                }

                // Step 2: Parse data rows
                const rows = [];
                for (let i = headerRowIdx + 1; i < raw.length; i++) {
                    const row = raw[i];
                    if (!row || row.every((c) => c === "" || c == null)) continue;

                    const entry = {};
                    let hasData = false;
                    for (const field of FIELDS) {
                        const colIdx = colMap[field];
                        if (colIdx == null) { entry[field] = ""; continue; }
                        let val = row[colIdx] ?? "";
                        if (field === "inicio" || field === "fin") val = formatTime(val);
                        else val = val === "" || val === 0 ? "" : String(val);
                        entry[field] = val;
                        if (val !== "" && val !== "0") hasData = true;
                    }
                    if (hasData) rows.push(entry);
                }
                resolve(rows);
            } catch {
                resolve([]);
            }
        };
        reader.readAsArrayBuffer(file);
    });
}

function emptyRow() {
    return FIELDS.reduce((acc, f) => ({ ...acc, [f]: "" }), {});
}

export default function Seccion9({ plan, section, files = [] }) {
    const [rows, setRows] = useState(section.form_data?.filas ?? []);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef(null);

    const excelFiles = files.filter((f) => f.file_category === "excel");

    // Group rows by day
    const grouped = [];
    let currentDay = null;
    rows.forEach((row, idx) => {
        const day = row.dia || "";
        if (day && day !== currentDay) {
            currentDay = day;
            grouped.push({ type: "header", day, startIdx: idx });
        }
        grouped.push({ type: "row", row, idx });
    });

    const handleFile = async (file) => {
        if (!file) return;
        setUploading(true);
        const parsed = await parseExcel(file);
        if (parsed.length > 0) setRows(parsed);

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
        const fd = new FormData();
        fd.append("file", file);
        fd.append("file_category", "excel");
        try {
            await fetch(`/planes/${plan.uuid}/seccion/9/archivo`, {
                method: "POST",
                headers: { "X-CSRF-TOKEN": csrfToken },
                body: fd,
            });
            router.reload({ only: ["files"], preserveScroll: true });
        } catch {}
        setUploading(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    const handleInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        if (inputRef.current) inputRef.current.value = "";
    };

    const updateCell = (idx, field, value) => {
        setRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
    };
    const removeRow = (idx) => setRows((prev) => prev.filter((_, i) => i !== idx));
    const addRow = () => setRows((prev) => [...prev, emptyRow()]);

    const save = (status) => {
        setSaving(true);
        router.put(
            `/planes/${plan.uuid}/seccion/9`,
            { form_data: { filas: rows }, generated_text: section.generated_text, status },
            {
                preserveScroll: true,
                onSuccess: () => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500); },
                onError: () => setSaving(false),
            }
        );
    };

    const confirm = () => {
        save("listo");
        setTimeout(() => router.visit(`/planes/${plan.uuid}/seccion/10`), 400);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/40 uppercase tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#208DCA] animate-pulse" />
                            Sección 9
                        </span>
                        <AnimatePresence>
                            {saved && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.8, x: -8 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, x: -8 }}
                                    className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-lg"
                                >
                                    <CheckCircle2 size={11} /> Guardado
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                    <h2 className="text-2xl font-bold text-white leading-tight">{section.section_name}</h2>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 pt-1">
                    <Button variant="ghost" size="sm" onClick={() => save(section.status)} disabled={saving}
                        className="text-white/35 hover:text-white hover:bg-white/8 gap-1.5">
                        {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                        <span className="hidden sm:inline text-xs">{saving ? "..." : "Guardar"}</span>
                    </Button>
                    <RippleButton size="sm" onClick={confirm}
                        className="bg-gradient-to-r from-[#253C87] to-[#208DCA] text-white border-0 gap-1.5 shadow-md shadow-[#253C87]/25 text-xs">
                        Confirmar <ChevronRight size={13} />
                    </RippleButton>
                </div>
            </div>

            {/* Info banner */}
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 rounded-xl bg-green-500/8 border border-green-500/20 p-4">
                <div className="w-8 h-8 rounded-lg bg-green-500/15 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Table2 size={15} className="text-green-400" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-green-400 mb-0.5">Planificación del personal de seguridad</p>
                    <p className="text-sm text-white/45 leading-relaxed">
                        Importa tu Excel de planificación. Los datos se mostrarán en una tabla editable
                        que se incluirá en el PDF final.
                    </p>
                </div>
            </motion.div>

            {/* Upload zone */}
            <div className="rounded-2xl bg-white/3 border border-white/8 p-6 shadow-xl shadow-black/20">
                <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center gap-2.5 border-2 border-dashed rounded-2xl px-6 py-6 cursor-pointer transition-all group ${
                        dragOver ? "border-green-400/50 bg-green-400/6" : "border-white/10 hover:border-green-400/40 hover:bg-green-400/4"
                    }`}
                >
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                        dragOver ? "bg-green-400/15 border-green-400/30 scale-110" : "bg-white/5 border-white/10 group-hover:bg-green-400/10 group-hover:border-green-400/20"
                    }`}>
                        {uploading
                            ? <CloudUpload size={16} className="text-green-400 animate-bounce" />
                            : <Upload size={16} className="text-white/40 group-hover:text-green-400 transition-colors" />
                        }
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-white/60 group-hover:text-white/80 transition-colors">
                            {rows.length > 0 ? "Reimportar Excel" : "Importar Excel de planificación"}
                        </p>
                        <p className="text-xs text-white/20 mt-0.5">
                            {uploading ? "Procesando..." : "Formato .xlsx, .xls o .csv — Haz clic o arrastra"}
                        </p>
                    </div>
                </div>
                <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleInputChange} />

                {excelFiles.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-white/40">
                        <CheckCircle2 size={12} className="text-green-400" />
                        <span>Archivo: {excelFiles[0].original_name}</span>
                    </div>
                )}
            </div>

            {/* Editable table */}
            {rows.length > 0 && (
                <div className="rounded-2xl bg-white/3 border border-white/8 shadow-xl shadow-black/20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Table2 size={14} className="text-[#208DCA]" />
                            <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">
                                {rows.length} registros
                            </span>
                        </div>
                        <Shine enableOnHover color="white" opacity={0.4} duration={600} asChild>
                            <button onClick={addRow}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-[#208DCA]/15 text-[#208DCA] border border-[#208DCA]/25 hover:bg-[#208DCA]/25">
                                <Plus size={12} /> Añadir fila
                            </button>
                        </Shine>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-[11px] table-fixed min-w-[700px]">
                            <colgroup>
                                <col className="w-[28%]" /> {/* nombre */}
                                <col className="w-[10%]" /> {/* inicio */}
                                <col className="w-[10%]" /> {/* fin */}
                                <col className="w-[7%]" />  {/* cantidad */}
                                <col className="w-[22%]" /> {/* categoria */}
                                <col className="w-[10%]" /> {/* horas */}
                                <col className="w-[30px]" /> {/* delete */}
                            </colgroup>
                            <thead>
                                <tr className="border-b border-white/8">
                                    {FIELDS.filter((f) => f !== "dia").map((f) => (
                                        <th key={f} className="px-2 py-2 text-left text-white/40 font-medium uppercase tracking-wide text-[10px]">
                                            {LABELS[f]}
                                        </th>
                                    ))}
                                    <th className="w-[30px]" />
                                </tr>
                            </thead>
                            <tbody>
                                {grouped.map((item, gIdx) => {
                                    if (item.type === "header") {
                                        return (
                                            <tr key={`day-${gIdx}`} className="bg-[#208DCA]/10 border-b border-[#208DCA]/20">
                                                <td colSpan={7} className="px-2 py-1.5 text-[11px] font-bold text-[#208DCA] uppercase tracking-wide">
                                                    {item.day}
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return (
                                        <tr key={item.idx} className="border-b border-white/5 hover:bg-white/3 transition-colors group/row">
                                            {FIELDS.filter((f) => f !== "dia").map((f) => (
                                                <td key={f} className="px-1 py-0">
                                                    <input
                                                        type="text"
                                                        value={item.row[f] ?? ""}
                                                        onChange={(e) => updateCell(item.idx, f, e.target.value)}
                                                        className="w-full bg-transparent text-white/70 text-[11px] px-1 py-1 rounded focus:outline-none focus:bg-white/5 focus:ring-1 focus:ring-[#208DCA]/30 transition-colors truncate"
                                                    />
                                                </td>
                                            ))}
                                            <td className="px-0 py-0 w-[30px]">
                                                <button onClick={() => removeRow(item.idx)}
                                                    className="text-white/0 group-hover/row:text-white/20 hover:!text-red-400 transition-colors p-1">
                                                    <X size={11} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-4 py-2.5 border-t border-white/8 flex items-center justify-between text-[11px] text-white/40">
                        <span>{rows.length} filas</span>
                        <span className="font-medium">
                            Total: {rows.reduce((sum, r) => sum + (parseFloat(r.horas) || 0), 0).toFixed(1)}h
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
