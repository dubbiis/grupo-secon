import { useState } from "react";
import { Search, Loader2, AlertCircle, CheckSquare, Square, CheckCheck, MapPin, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const GROUPS = {
    transporte: [
        { key: "metro_tren", label: "Metro / Tren / Tranvía", emoji: "🚇" },
        { key: "autobus",    label: "Autobús",                emoji: "🚌" },
        { key: "parking",    label: "Parkings",               emoji: "🅿️" },
    ],
    emergencia: [
        { key: "hospitales",    label: "Hospitales / Urgencias",  emoji: "🏥" },
        { key: "policia",       label: "Policía Nacional / Local", emoji: "👮" },
        { key: "guardia_civil", label: "Guardia Civil",            emoji: "🛡️" },
    ],
};

function formatPlace(item) {
    let text = item.name;
    if (item.distance_text) text += ` (${item.distance_text})`;
    if (item.address) text += `: ${item.address}`;
    if (item.phone) text += `. Tel: ${item.phone}`;
    return text;
}

function buildOutputFields(type, data, checked) {
    if (type === "transporte") {
        const transitLines = [];
        const parkingLines = [];
        ["metro_tren", "autobus"].forEach((key) => {
            (data[key] || []).forEach((item, i) => {
                if (checked[`${key}_${i}`]) transitLines.push(formatPlace(item));
            });
        });
        (data.parking || []).forEach((item, i) => {
            if (checked[`parking_${i}`]) parkingLines.push(formatPlace(item));
        });
        return {
            datos_transporte_googlemaps: transitLines.join("\n"),
            datos_parkings_googlemaps:   parkingLines.join("\n"),
        };
    }

    const hospitalLines = [];
    const fuerzasLines  = [];
    (data.hospitales || []).forEach((item, i) => {
        if (checked[`hospitales_${i}`]) hospitalLines.push(formatPlace(item));
    });
    ["policia", "guardia_civil"].forEach((key) => {
        (data[key] || []).forEach((item, i) => {
            if (checked[`${key}_${i}`]) fuerzasLines.push(formatPlace(item));
        });
    });
    return {
        hospitales_reales:  hospitalLines.join("\n"),
        comisarias_reales:  fuerzasLines.join("\n"),
    };
}

export default function PlacesPanel({ uuid, type, onResult }) {
    const [status,      setStatus]      = useState("idle"); // idle | loading | results | error
    const [data,        setData]        = useState(null);
    const [checked,     setChecked]     = useState({});
    const [addressUsed, setAddressUsed] = useState("");
    const [errorMsg,    setErrorMsg]    = useState("");

    const groups = GROUPS[type] ?? [];

    const search = async () => {
        setStatus("loading");
        setErrorMsg("");
        try {
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
            const res  = await fetch(`/planes/${uuid}/maps/${type}`, {
                method:  "POST",
                headers: {
                    "X-CSRF-TOKEN":  csrf,
                    "Content-Type":  "application/json",
                    "Accept":        "application/json",
                },
                body: JSON.stringify({}),
            });

            const json = await res.json();
            if (!res.ok) {
                setErrorMsg(json.error || "Error al buscar datos.");
                setStatus("error");
                return;
            }

            setData(json);
            setAddressUsed(json.address_used ?? "");

            // Check all items by default
            const allChecked = {};
            groups.forEach(({ key }) => {
                (json[key] ?? []).forEach((_, i) => {
                    allChecked[`${key}_${i}`] = true;
                });
            });
            setChecked(allChecked);
            setStatus("results");
        } catch {
            setErrorMsg("No se pudo conectar. Los campos manuales siguen disponibles.");
            setStatus("error");
        }
    };

    const toggleItem = (groupKey, idx) => {
        setChecked((prev) => ({ ...prev, [`${groupKey}_${idx}`]: !prev[`${groupKey}_${idx}`] }));
    };

    const confirm = () => {
        if (!data) return;
        onResult(buildOutputFields(type, data, checked));
    };

    const totalItems = groups.reduce((sum, { key }) => sum + (data?.[key]?.length ?? 0), 0);

    return (
        <div className="rounded-xl border border-slate-200 bg-slate-200 overflow-hidden">
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                <div className="flex items-center gap-2 min-w-0">
                    <MapPin size={13} className="text-[#208DCA] flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-900">Búsqueda automática</span>
                    {addressUsed && (
                        <span className="text-xs text-slate-900 truncate hidden sm:block">· {addressUsed}</span>
                    )}
                </div>

                {status === "idle" || status === "error" ? (
                    <button
                        onClick={search}
                        className="flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-[#208DCA]/15 border border-[#208DCA]/30 text-[#208DCA] hover:bg-[#208DCA]/25 transition-all"
                    >
                        <Search size={11} />
                        Buscar cerca del evento
                    </button>
                ) : status === "loading" ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-900">
                        <Loader2 size={12} className="animate-spin" />
                        Buscando…
                    </div>
                ) : (
                    <button
                        onClick={search}
                        className="flex items-center gap-1 text-xs text-slate-900 hover:text-slate-900 transition-colors"
                    >
                        <RefreshCw size={11} />
                        Volver a buscar
                    </button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {/* ── Error ── */}
                {status === "error" && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 py-3 flex items-start gap-2 text-xs text-amber-400/70"
                    >
                        <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                        {errorMsg}
                    </motion.div>
                )}

                {/* ── Results ── */}
                {status === "results" && data && (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="divide-y divide-white/4"
                    >
                        {groups.map(({ key, label, emoji }) => {
                            const items = data[key] ?? [];
                            if (items.length === 0) return null;
                            return (
                                <div key={key} className="p-3">
                                    <p className="text-[10px] font-semibold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <span>{emoji}</span>
                                        {label}
                                        <span className="text-slate-900 font-normal">{items.length} encontrados</span>
                                    </p>
                                    <div className="space-y-0.5">
                                        {items.map((item, i) => {
                                            const isChecked = !!checked[`${key}_${i}`];
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => toggleItem(key, i)}
                                                    className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-200 transition-colors text-left group"
                                                >
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        {isChecked
                                                            ? <CheckSquare size={13} className="text-[#208DCA]" />
                                                            : <Square size={13} className="text-white/15 group-hover:text-slate-900 transition-colors" />
                                                        }
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-xs font-medium leading-tight transition-colors ${isChecked ? "text-white" : "text-slate-900"}`}>
                                                            {item.name}
                                                            {item.distance_text && (
                                                                <span className="ml-1.5 text-[#208DCA]/60 font-normal text-[11px]">
                                                                    {item.distance_text}
                                                                </span>
                                                            )}
                                                        </p>
                                                        {item.address && (
                                                            <p className="text-[10px] text-white/22 mt-0.5 truncate">{item.address}</p>
                                                        )}
                                                        {item.phone && (
                                                            <p className="text-[10px] text-white/22">Tel: {item.phone}</p>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {totalItems === 0 && (
                            <p className="px-4 py-3 text-xs text-slate-900 text-center">
                                No se encontraron lugares en este radio. Introduce los datos manualmente.
                            </p>
                        )}

                        {/* ── Confirm ── */}
                        {totalItems > 0 && (
                            <div className="px-4 py-3 bg-black/10">
                                <button
                                    onClick={confirm}
                                    className="w-full flex items-center justify-center gap-2 text-xs py-2 rounded-xl bg-[#208DCA]/15 border border-[#208DCA]/30 text-[#208DCA] hover:bg-[#208DCA]/25 transition-all font-medium"
                                >
                                    <CheckCheck size={13} />
                                    Usar datos seleccionados
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
