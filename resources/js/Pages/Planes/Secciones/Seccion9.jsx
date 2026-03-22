import React, { useState, useRef } from "react";
import { router } from "@inertiajs/react";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import {
    Table2, Upload, Plus, X, ChevronRight, Save, CheckCircle2,
    RefreshCw, CloudUpload, Users, GripVertical, Copy, FolderPlus,
} from "lucide-react";
import { RippleButton } from "@/components/animate-ui/components/buttons/ripple";
import { Shine } from "@/components/animate-ui/primitives/effects/shine";
import * as XLSX from "xlsx";
import { useTranslation } from "@/i18n";

const FIELDS = ["dia", "nombre", "inicio", "fin", "cantidad", "categoria", "horas"];
const LABELS = { dia: "Día", nombre: "Nombre / Posición", inicio: "Inicio", fin: "Fin", cantidad: "Nº", categoria: "Categoría", horas: "Horas" };

const GUARD_TYPES = ["Guard", "Guard*", "CPO", "CPO*", "Team Leader", "Team Leader*", "SSIAP1", "SSIAP2", "SSIAP3", "Transport"];

/** Match imported category to GUARD_TYPES (case-insensitive) */
function matchCategory(val) {
    if (!val) return "";
    const lower = String(val).toLowerCase().trim();
    return GUARD_TYPES.find((g) => g.toLowerCase() === lower) ?? String(val);
}

// Generate time options every 30 min
const TIME_OPTIONS = [];
for (let h = 0; h < 24; h++) {
    for (const m of ["00", "30"]) {
        TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${m}`);
    }
}

const PLANNING_PATTERNS = {
    dia: /\bday\b|d[ií]a|jornada/i,
    nombre: /name.{0,5}pos|pos.{0,5}name|nombre|position|puesto/i,
    inicio: /start\s*time|inicio|entrada|hora.*ini/i,
    fin: /finish\s*time|fin.*time|salida|hora.*fin/i,
    cantidad: /\bnumber\b|n[uú]mero|cantidad/i,
    categoria: /type.*guard|categor[ií]|tipo.*guard/i,
    horas: /total.*hour|hora.*total|total.*hora|\bhoras\b|\bhours\b/i,
};

function formatTime(val) {
    if (val == null || val === "") return "";
    // Excel stores times as fractions of a day (0.0 = 00:00, 0.5 = 12:00)
    if (typeof val === "number" && val >= 0 && val <= 1) {
        const totalMinutes = Math.round(val * 24 * 60);
        const h = Math.floor(totalMinutes / 60) % 24;
        const m = totalMinutes % 60;
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    // Date object from SheetJS
    if (val instanceof Date) {
        const h = val.getHours();
        const m = val.getMinutes();
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    const s = String(val);
    const timeMatch = s.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) return `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
    return s;
}

/** Format Excel serial date or Date object to readable day string */
function formatDay(val) {
    if (val == null || val === "" || val === 0) return "";
    // Excel serial date number (days since 1899-12-30)
    if (typeof val === "number" && val > 1) {
        const date = new Date((val - 25569) * 86400000);
        if (!isNaN(date.getTime())) {
            const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            return `${days[date.getUTCDay()]} ${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`;
        }
    }
    // Date object
    if (val instanceof Date && !isNaN(val.getTime())) {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return `${days[val.getDay()]} ${String(val.getDate()).padStart(2, "0")}/${String(val.getMonth() + 1).padStart(2, "0")}/${val.getFullYear()}`;
    }
    return String(val);
}

/** Calculate total hours: (finish - start + overnight correction) * number */
function calcHoras(inicio, fin, cantidad) {
    if (!inicio || !fin) return "";
    const [sh, sm] = inicio.split(":").map(Number);
    const [eh, em] = fin.split(":").map(Number);
    if (isNaN(sh) || isNaN(em)) return "";
    let startMin = sh * 60 + sm;
    let endMin = eh * 60 + em;
    if (endMin <= startMin) endMin += 24 * 60; // overnight
    const hours = ((endMin - startMin) / 60) * (parseInt(cantidad) || 1);
    return hours.toFixed(1);
}

function parseExcel(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const wb = XLSX.read(e.target.result, { type: "array", cellDates: true });
                const ws = wb.Sheets["Overview Event"] ?? wb.Sheets[wb.SheetNames[0]];
                if (!ws) { resolve([]); return; }
                const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

                let headerRowIdx = -1;
                let colMap = {};
                for (let r = 0; r < Math.min(20, raw.length); r++) {
                    const row = raw[r];
                    if (!row) continue;
                    const matched = {};
                    for (let c = 0; c < row.length; c++) {
                        const cellText = String(row[c] ?? "").trim();
                        if (!cellText) continue;
                        for (const [field, pattern] of Object.entries(PLANNING_PATTERNS)) {
                            if (!matched[field] && pattern.test(cellText)) matched[field] = c;
                        }
                    }
                    if (Object.keys(matched).length >= 3) { headerRowIdx = r; colMap = matched; break; }
                }
                if (headerRowIdx === -1) { resolve([]); return; }

                // Summary section keywords — stop parsing when we hit these
                const STOP_WORDS = /^(expenses|gastos|total\b|amount|total of hours|guard\*?|cpo\*?|team leader\*?|ssiap\d|transport)/i;

                const rows = [];
                let emptyStreak = 0;
                for (let i = headerRowIdx + 1; i < raw.length; i++) {
                    const row = raw[i];
                    if (!row || row.every((c) => c === "" || c == null)) {
                        emptyStreak++;
                        if (emptyStreak >= 3) break; // 3+ consecutive empty rows = end of data
                        continue;
                    }
                    emptyStreak = 0;

                    // Check only the DAY column for summary keywords
                    // (categoria column has valid values like "Guard", "CPO" in data rows)
                    const dayVal = colMap.dia != null ? String(row[colMap.dia] ?? "").trim() : "";
                    const isSummary = dayVal && STOP_WORDS.test(dayVal);
                    if (isSummary) break;

                    const entry = {};
                    let hasData = false;
                    for (const field of FIELDS) {
                        const colIdx = colMap[field];
                        if (colIdx == null) { entry[field] = ""; continue; }
                        let val = row[colIdx] ?? "";
                        if (field === "dia") val = formatDay(val);
                        else if (field === "inicio" || field === "fin") val = formatTime(val);
                        else if (field === "categoria") val = matchCategory(val);
                        else if (field === "horas") val = (val === "" || val === 0) ? "" : String(Math.round(parseFloat(val) * 10) / 10);
                        else val = val === "" || val === 0 ? "" : String(val);
                        entry[field] = val;
                        if (val !== "" && val !== "0") hasData = true;
                    }
                    if (hasData) rows.push(entry);
                }
                resolve(rows);
            } catch { resolve([]); }
        };
        reader.readAsArrayBuffer(file);
    });
}

let rowIdCounter = 0;
function newId() { return `r-${Date.now()}-${rowIdCounter++}`; }
function emptyRow(dia = "") { return { _id: newId(), dia, nombre: "", inicio: "", fin: "", cantidad: "1", categoria: "", horas: "" }; }
function ensureIds(rows) { return rows.map((r) => r._id ? r : { ...r, _id: newId() }); }

/** Calculate staff summary from planning rows */
function calcStaff(rows) {
    const map = {};
    for (const r of rows) {
        const name = (r.nombre || "").trim();
        if (!name) continue;
        if (!map[name]) map[name] = { horas: 0, categoria: r.categoria || "" };
        map[name].horas += parseFloat(r.horas) || 0;
    }
    return Object.entries(map).map(([nombre, { horas, categoria }]) => ({ nombre, horas: horas.toFixed(1), categoria }));
}

/** Draggable row component */
function DraggableRow({ row, onUpdate, onRemove, onInsert, onDuplicate }) {
    const dragControls = useDragControls();
    return (
        <Reorder.Item
            value={row}
            dragListener={false}
            dragControls={dragControls}
            className="list-none"
            whileDrag={{ scale: 1.02, zIndex: 50, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", backgroundColor: "rgba(32,141,202,0.08)" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
            <div className="grid border-b border-slate-200 hover:bg-white transition-colors group/row items-center px-1"
                style={{ gridTemplateColumns: "32px 1fr 80px 80px 40px 1fr 60px 56px" }}>
                {/* Drag handle */}
                <div className="flex flex-col items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                    <div onPointerDown={(e) => dragControls.start(e)}
                        className="cursor-grab active:cursor-grabbing text-slate-900 hover:text-[#208DCA] touch-none">
                        <GripVertical size={13} />
                    </div>
                </div>

                {/* Name */}
                <div className="px-0.5">
                    <input type="text" value={row.nombre ?? ""} onChange={(e) => onUpdate("nombre", e.target.value)}
                        className="w-full bg-transparent text-slate-900 text-[11px] px-1 py-1.5 rounded focus:outline-none focus:bg-slate-200 focus:ring-1 focus:ring-[#208DCA]/30 truncate" />
                </div>

                {/* Start time */}
                <div className="px-0.5">
                    <select value={row.inicio ?? ""} onChange={(e) => onUpdate("inicio", e.target.value)}
                        className="w-full bg-transparent text-slate-900 text-[11px] px-0.5 py-1.5 rounded focus:outline-none focus:bg-slate-200 focus:ring-1 focus:ring-[#208DCA]/30 appearance-none cursor-pointer">
                        <option value="" className="bg-white">--:--</option>
                        {TIME_OPTIONS.map((tm) => <option key={tm} value={tm} className="bg-white">{tm}</option>)}
                    </select>
                </div>

                {/* End time */}
                <div className="px-0.5">
                    <select value={row.fin ?? ""} onChange={(e) => onUpdate("fin", e.target.value)}
                        className="w-full bg-transparent text-slate-900 text-[11px] px-0.5 py-1.5 rounded focus:outline-none focus:bg-slate-200 focus:ring-1 focus:ring-[#208DCA]/30 appearance-none cursor-pointer">
                        <option value="" className="bg-white">--:--</option>
                        {TIME_OPTIONS.map((tm) => <option key={tm} value={tm} className="bg-white">{tm}</option>)}
                    </select>
                </div>

                {/* Number */}
                <div className="px-0.5">
                    <input type="number" min="1" value={row.cantidad ?? ""} onChange={(e) => onUpdate("cantidad", e.target.value)}
                        className="w-full bg-transparent text-slate-900 text-[11px] px-1 py-1.5 rounded focus:outline-none focus:bg-slate-200 focus:ring-1 focus:ring-[#208DCA]/30 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                </div>

                {/* Category */}
                <div className="px-0.5">
                    <select value={row.categoria ?? ""} onChange={(e) => onUpdate("categoria", e.target.value)}
                        className="w-full bg-transparent text-slate-900 text-[11px] px-0.5 py-1.5 rounded focus:outline-none focus:bg-slate-200 focus:ring-1 focus:ring-[#208DCA]/30 appearance-none cursor-pointer">
                        <option value="" className="bg-white">Seleccionar...</option>
                        {GUARD_TYPES.map((gt) => <option key={gt} value={gt} className="bg-white">{gt}</option>)}
                    </select>
                </div>

                {/* Total hours (auto-calculated) */}
                <div className="px-1 text-[11px] text-slate-900 text-right font-mono tabular-nums">
                    {row.horas ? `${row.horas}h` : "—"}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-0 opacity-0 group-hover/row:opacity-100 transition-opacity">
                    <button onClick={onDuplicate} title="Duplicar fila" className="text-slate-900 hover:text-[#208DCA] p-1"><Copy size={11} /></button>
                    <button onClick={onInsert} title="Insertar fila debajo" className="text-slate-900 hover:text-[#208DCA] p-1"><Plus size={11} /></button>
                    <button onClick={onRemove} className="text-slate-900 hover:text-red-400 p-1"><X size={11} /></button>
                </div>
            </div>
        </Reorder.Item>
    );
}

export default function Seccion9({ plan, section, files = [] }) {
    const { t } = useTranslation();
    const [rows, setRows] = useState(() => ensureIds(section.form_data?.filas ?? []));
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [newDayName, setNewDayName] = useState("");
    const inputRef = useRef(null);

    const excelFiles = files.filter((f) => f.file_category === "excel");
    const staff = calcStaff(rows);

    const handleFile = async (file) => {
        if (!file) return;
        setUploading(true);
        const planning = await parseExcel(file);
        if (planning.length > 0) setRows(ensureIds(planning));

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
        const fd = new FormData();
        fd.append("file", file);
        fd.append("file_category", "excel");
        try {
            await fetch(`/planes/${plan.uuid}/seccion/9/archivo`, {
                method: "POST", headers: { "X-CSRF-TOKEN": csrfToken }, body: fd,
            });
            router.reload({ only: ["files"], preserveScroll: true });
        } catch {}
        setUploading(false);
    };

    const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); };
    const handleInputChange = (e) => { handleFile(e.target.files?.[0]); if (inputRef.current) inputRef.current.value = ""; };

    // Row operations
    const updateCell = (id, field, value) => {
        setRows((prev) => prev.map((r) => {
            if (r._id !== id) return r;
            const updated = { ...r, [field]: value };
            // Auto-calc total hours when time/number changes
            if (field === "inicio" || field === "fin" || field === "cantidad") {
                updated.horas = calcHoras(
                    field === "inicio" ? value : r.inicio,
                    field === "fin" ? value : r.fin,
                    field === "cantidad" ? value : r.cantidad
                );
            }
            return updated;
        }));
    };
    const removeRow = (id) => setRows((prev) => prev.filter((r) => r._id !== id));
    const addRow = () => setRows((prev) => [...prev, emptyRow()]);
    const insertRowAfter = (id) => {
        setRows((prev) => {
            const idx = prev.findIndex((r) => r._id === id);
            const dia = idx >= 0 ? prev[idx].dia : "";
            return idx === -1 ? [...prev, emptyRow(dia)] : [...prev.slice(0, idx + 1), emptyRow(dia), ...prev.slice(idx + 1)];
        });
    };
    const duplicateRow = (id) => {
        setRows((prev) => {
            const idx = prev.findIndex((r) => r._id === id);
            if (idx === -1) return prev;
            const copy = { ...prev[idx], _id: newId() };
            return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
        });
    };
    const addDayHeader = () => {
        const name = newDayName.trim() || "Nuevo día";
        setRows((prev) => [...prev, emptyRow(name)]);
        setNewDayName("");
    };

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

    const confirm = () => { save("listo"); setTimeout(() => router.visit(`/planes/${plan.uuid}/seccion/10`), 400); };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-200 border border-slate-200 text-slate-900 uppercase tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#208DCA] animate-pulse" /> Sección 9
                        </span>
                        <AnimatePresence>
                            {saved && (
                                <motion.span initial={{ opacity: 0, scale: 0.8, x: -8 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8, x: -8 }}
                                    className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-lg">
                                    <CheckCircle2 size={11} /> Guardado
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">{section.section_name}</h2>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 pt-1">
                    {rows.length > 0 && (
                        <button onClick={() => setRows([])}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-red-500/10 text-red-400/70 border border-red-500/20 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30">
                            <X size={12} /> Limpiar
                        </button>
                    )}
                    <button onClick={() => save(section.status)} disabled={saving}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-slate-200 text-slate-900 border border-slate-200 hover:bg-slate-200 hover:text-slate-900 hover:border-slate-200 disabled:opacity-50">
                        {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                        <span className="hidden sm:inline">{saving ? "..." : t("common.save")}</span>
                    </button>
                    <RippleButton size="sm" onClick={confirm}
                        className="bg-gradient-to-r from-[#273887] to-[#208DCA] text-white border-0 gap-1.5 shadow-md shadow-[#273887]/25 text-xs">
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
                    <p className="text-sm font-semibold text-green-400 mb-0.5">{t("section9.title")}</p>
                    <p className="text-sm text-slate-900 leading-relaxed">
                        Importa un Excel o crea la planificación directamente. Arrastra filas para reordenar.
                        Las horas se calculan automáticamente.
                    </p>
                </div>
            </motion.div>

            {/* Upload zone + Create button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl px-4 py-5 cursor-pointer transition-all group ${
                        dragOver ? "border-green-400/50 bg-green-400/6" : "border-slate-200 hover:border-green-400/40 hover:bg-green-400/4"
                    }`}
                >
                    <CloudUpload size={20} className={`${dragOver ? "text-green-400" : "text-slate-900 group-hover:text-green-400"} transition-colors`} />
                    <div className="text-center">
                        <p className="text-xs font-medium text-slate-900 group-hover:text-slate-900">{rows.length > 0 ? "Reimportar Excel" : "Importar Excel"}</p>
                        <p className="text-[10px] text-slate-900 mt-0.5">{uploading ? "Procesando..." : ".xlsx, .xls o .csv"}</p>
                    </div>
                </div>
                <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleInputChange} />

                <button onClick={addRow}
                    className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-2xl px-4 py-5 hover:border-[#208DCA]/40 hover:bg-[#208DCA]/4 transition-all group cursor-pointer">
                    <Plus size={20} className="text-slate-900 group-hover:text-[#208DCA] transition-colors" />
                    <div className="text-center">
                        <p className="text-xs font-medium text-slate-900 group-hover:text-slate-900">{t("section9.create_manually")}</p>
                        <p className="text-[10px] text-slate-900 mt-0.5">Añadir filas una a una</p>
                    </div>
                </button>
            </div>

            {excelFiles.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-slate-900 -mt-3">
                    <CheckCircle2 size={12} className="text-green-400" />
                    <span>Archivo: {excelFiles[0].original_name}</span>
                </div>
            )}

            {/* Planning table */}
            {rows.length > 0 && (
                <div className="rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                    {/* Toolbar */}
                    <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <Table2 size={14} className="text-[#208DCA]" />
                            <span className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                                {rows.length} registros
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Add day header */}
                            <div className="flex items-center gap-1">
                                <input type="text" placeholder="Nombre del día..." value={newDayName} onChange={(e) => setNewDayName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && addDayHeader()}
                                    className="bg-slate-200 border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-900 placeholder:text-slate-400 w-32 focus:outline-none focus:border-[#208DCA]/40" />
                                <Shine enableOnHover color="white" opacity={0.4} duration={600} asChild>
                                    <button onClick={addDayHeader}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-purple-500/15 text-purple-400 border border-purple-500/25 hover:bg-purple-500/25">
                                        <FolderPlus size={11} /> Día
                                    </button>
                                </Shine>
                            </div>
                            <Shine enableOnHover color="white" opacity={0.4} duration={600} asChild>
                                <button onClick={addRow}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-[#208DCA]/15 text-[#208DCA] border border-[#208DCA]/25 hover:bg-[#208DCA]/25">
                                    <Plus size={11} /> Fila
                                </button>
                            </Shine>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {/* Column headers */}
                        <div className="grid min-w-[750px] text-[10px] font-medium uppercase tracking-wide text-slate-900 border-b border-slate-200 px-1"
                            style={{ gridTemplateColumns: "32px 1fr 80px 80px 40px 1fr 60px 56px" }}>
                            <div />
                            <div className="px-1.5 py-2">{t("section9.name_position")}</div>
                            <div className="px-1.5 py-2">Inicio</div>
                            <div className="px-1.5 py-2">Fin</div>
                            <div className="px-1.5 py-2 text-center">Nº</div>
                            <div className="px-1.5 py-2">Categoría</div>
                            <div className="px-1.5 py-2 text-right">Horas</div>
                            <div />
                        </div>

                        {/* Rows grouped by day — headers outside Reorder */}
                        {(() => {
                            const groups = [];
                            let currentDay = null;
                            let currentGroup = [];

                            rows.forEach((row) => {
                                if (row.dia && row.dia !== currentDay) {
                                    if (currentGroup.length > 0) groups.push({ day: currentDay, rows: currentGroup });
                                    currentDay = row.dia;
                                    currentGroup = [row];
                                } else {
                                    currentGroup.push(row);
                                }
                            });
                            if (currentGroup.length > 0) groups.push({ day: currentDay, rows: currentGroup });

                            // If no days at all, single group
                            if (groups.length === 0 && rows.length > 0) groups.push({ day: null, rows });

                            // Build a map of day → count from groups
                            const dayCounts = {};
                            groups.forEach((g) => { if (g.day) dayCounts[g.day] = g.rows.length; });

                            return (
                                <Reorder.Group axis="y" values={rows} onReorder={setRows} className="min-w-[750px]">
                                    {rows.map((row, i) => {
                                        const prevDay = i > 0 ? rows[i - 1].dia : null;
                                        const showDayHeader = row.dia && row.dia !== prevDay;
                                        return (
                                            <React.Fragment key={row._id}>
                                                {showDayHeader && (
                                                    <div className="bg-[#208DCA]/8 border-y border-[#208DCA]/15 px-3 py-1.5 text-[11px] font-bold text-[#208DCA] uppercase tracking-wide flex items-center justify-between pointer-events-none">
                                                        <span>{row.dia}</span>
                                                        <span className="text-[10px] font-normal text-[#208DCA]/50">
                                                            {dayCounts[row.dia] ?? 0} {t("common.rows")}
                                                        </span>
                                                    </div>
                                                )}
                                                <DraggableRow
                                                    row={row}
                                                    onUpdate={(field, val) => updateCell(row._id, field, val)}
                                                    onRemove={() => removeRow(row._id)}
                                                    onInsert={() => insertRowAfter(row._id)}
                                                    onDuplicate={() => duplicateRow(row._id)}
                                                />
                                            </React.Fragment>
                                        );
                                    })}
                                </Reorder.Group>
                            );
                        })()}
                    </div>

                    {/* Summary footer */}
                    <div className="px-4 py-2.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-900">
                        <span>{rows.length} filas</span>
                        <span className="font-medium font-mono">
                            Total: {rows.reduce((sum, r) => sum + (parseFloat(r.horas) || 0), 0).toFixed(1)}h
                        </span>
                    </div>
                </div>
            )}

            {/* Staff summary (auto-calculated) */}
            {staff.length > 0 && (
                <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users size={14} className="text-purple-500" />
                            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                                {t("section9.staff_summary")} — {staff.length} {t("section9.workers")}
                            </span>
                        </div>
                        <span className="text-xs font-mono font-semibold text-slate-700">
                            {staff.reduce((sum, s) => sum + (parseFloat(s.horas) || 0), 0).toFixed(1)}h
                        </span>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {staff.map((s, idx) => (
                            <div key={idx} className="flex items-center px-4 py-2 hover:bg-slate-50 transition-colors">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#273887]/15 to-[#208DCA]/15 flex items-center justify-center text-[10px] font-bold text-[#208DCA] flex-shrink-0 mr-3">
                                    {s.nombre.charAt(0)}
                                </div>
                                <span className="flex-1 text-sm font-medium text-slate-800 min-w-0 truncate">{s.nombre}</span>
                                <span className="text-xs text-slate-500 px-3 flex-shrink-0">{s.categoria}</span>
                                <span className="text-sm font-mono font-semibold text-slate-700 w-20 text-right flex-shrink-0">{s.horas}h</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
