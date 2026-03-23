import { useState } from "react";
import { Search, Loader2, AlertCircle, CheckSquare, Square, CheckCheck, MapPin, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/i18n";

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
    const { t } = useTranslation();
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
                    <span className="text-sm font-medium text-slate-900">{t("places.auto_search")}</span>
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
                        className="px-4 py-3 flex items-start gap-2 text-sm text-red-500 font-medium"
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
                                <div key={key} className="p-4">
                                    <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <span className="text-base">{emoji}</span>
                                        {label}
                                        <span className="text-[#208DCA] font-semibold bg-[#208DCA]/10 px-2 py-0.5 rounded-full text-[10px]">{items.length}</span>
                                    </p>
                                    <div className="space-y-2">
                                        {items.map((item, i) => {
                                            const isChecked = !!checked[`${key}_${i}`];
                                            return (
                                                <motion.button
                                                    key={i}
                                                    onClick={() => toggleItem(key, i)}
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.04 }}
                                                    whileHover={{ scale: 1.01 }}
                                                    whileTap={{ scale: 0.99 }}
                                                    className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${
                                                        isChecked
                                                            ? "bg-[#208DCA]/8 border-[#208DCA]/25 shadow-sm"
                                                            : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                                                    }`}
                                                >
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        <motion.div animate={{ scale: isChecked ? [1, 1.2, 1] : 1 }} transition={{ duration: 0.2 }}>
                                                            {isChecked
                                                                ? <CheckSquare size={16} className="text-[#208DCA]" />
                                                                : <Square size={16} className="text-slate-300" />
                                                            }
                                                        </motion.div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-medium leading-tight ${isChecked ? "text-[#208DCA]" : "text-slate-800"}`}>
                                                            {item.name}
                                                        </p>
                                                        {item.distance_text && (
                                                            <span className="text-xs text-slate-500 font-medium">
                                                                {item.distance_text}
                                                            </span>
                                                        )}
                                                        {item.address && (
                                                            <p className="text-xs text-slate-400 mt-0.5 truncate">{item.address}</p>
                                                        )}
                                                        {item.phone && (
                                                            <p className="text-xs text-slate-400">Tel: {item.phone}</p>
                                                        )}
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {totalItems === 0 && (
                            <p className="px-4 py-4 text-sm text-slate-500 text-center">
                                No se encontraron lugares en este radio. Introduce los datos manualmente.
                            </p>
                        )}

                        {/* ── Confirm ── */}
                        {totalItems > 0 && (
                            <div className="px-4 py-3">
                                <motion.button
                                    onClick={confirm}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full flex items-center justify-center gap-2 text-sm py-3 rounded-xl bg-gradient-to-r from-[#253C87] to-[#208DCA] text-white font-semibold shadow-lg shadow-[#208DCA]/25 hover:shadow-xl transition-all"
                                >
                                    <CheckCheck size={16} />
                                    Usar datos seleccionados
                                </motion.button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
