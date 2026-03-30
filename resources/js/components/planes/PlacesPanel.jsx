import { useState } from "react";
import { Search, Loader2, AlertCircle, Check, MapPin, RefreshCw, Navigation, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Shine } from "@/components/animate-ui/primitives/effects/shine";
import { useTranslation } from "@/i18n";

const GROUPS = {
    transporte: [
        { key: "metro_tren", label: "Metro / Tren / Tranvía", emoji: "🚇" },
        { key: "autobus",    label: "Autobús",                emoji: "🚌" },
        { key: "parking",    label: "Parkings",               emoji: "🅿️" },
    ],
    emergencia: [
        { key: "hospitales", label: "Hospitales / Urgencias", emoji: "🏥" },
        { key: "policia",    label: "Policía",                emoji: "👮" },
    ],
};

const RADIUS_OPTIONS = [
    { value: 1000,  label: "1 km" },
    { value: 2000,  label: "2 km" },
    { value: 5000,  label: "5 km" },
    { value: 10000, label: "10 km" },
    { value: 15000, label: "15 km" },
];

const DEFAULT_RADIUS = {
    transporte: 2000,
    emergencia: 5000,
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
    (data.policia || []).forEach((item, i) => {
        if (checked[`policia_${i}`]) fuerzasLines.push(formatPlace(item));
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
    const [radius,      setRadius]      = useState(DEFAULT_RADIUS[type] ?? 5000);

    const groups = GROUPS[type] ?? [];

    const search = async (skipCache = false) => {
        setStatus("loading");
        setErrorMsg("");
        setData(null);
        setChecked({});

        const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
        const headers = { "X-CSRF-TOKEN": csrf, "Content-Type": "application/json", "Accept": "application/json" };
        const body = JSON.stringify({ skip_cache: skipCache, radius });

        const autoCheck = (merged) => {
            const c = {};
            groups.forEach(({ key }) => { (merged[key] ?? []).forEach((_, i) => { c[`${key}_${i}`] = true; }); });
            return c;
        };

        try {
            if (type === "transporte") {
                let merged = {};
                let addr = "";

                // 1. Transit (metro + bus)
                try {
                    const r1 = await fetch(`/planes/${uuid}/maps/transit`, { method: "POST", headers, body });
                    if (r1.ok) {
                        const j1 = await r1.json();
                        addr = j1.address_used ?? "";
                        merged = { ...j1 };
                        setData({ ...merged });
                        setAddressUsed(addr);
                        setChecked(autoCheck(merged));
                        setStatus("results");
                    }
                } catch {}

                // 2. Parking
                try {
                    const r2 = await fetch(`/planes/${uuid}/maps/parking`, { method: "POST", headers, body });
                    if (r2.ok) {
                        const j2 = await r2.json();
                        merged = { ...merged, ...j2 };
                        setData({ ...merged, address_used: addr });
                        setChecked(autoCheck(merged));
                        setStatus("results");
                    }
                } catch {}

                if (!merged.metro_tren?.length && !merged.autobus?.length && !merged.parking?.length) {
                    setErrorMsg("No se encontraron datos de transporte en esta zona. Prueba a ampliar el radio.");
                    setStatus("error");
                }
            } else {
                // Emergencia — split into 2 requests
                let merged = {};
                let addr = "";

                // 1. Hospitales
                try {
                    const r1 = await fetch(`/planes/${uuid}/maps/hospitales`, { method: "POST", headers, body });
                    if (r1.ok) {
                        const j1 = await r1.json();
                        addr = j1.address_used ?? "";
                        merged = { ...j1 };
                        setData({ ...merged });
                        setAddressUsed(addr);
                        setChecked(autoCheck(merged));
                        setStatus("results");
                    }
                } catch {}

                // 2. Policía
                try {
                    const r2 = await fetch(`/planes/${uuid}/maps/policia`, { method: "POST", headers, body });
                    if (r2.ok) {
                        const j2 = await r2.json();
                        merged = { ...merged, ...j2 };
                        setData({ ...merged });
                        setChecked(autoCheck(merged));
                        setStatus("results");
                    }
                } catch {}

                if (!merged.hospitales?.length && !merged.policia?.length) {
                    setErrorMsg("No se encontraron recursos de emergencia en esta zona. Prueba a ampliar el radio.");
                    setStatus("error");
                }
            }
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

                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Radio selector */}
                    <div className="relative">
                        <select
                            value={radius}
                            onChange={(e) => setRadius(Number(e.target.value))}
                            className="appearance-none text-[11px] pl-2 pr-6 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#208DCA]/30"
                        >
                            {RADIUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    {status === "idle" || status === "error" ? (
                        <button
                            onClick={() => search()}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-[#208DCA]/15 border border-[#208DCA]/30 text-[#208DCA] hover:bg-[#208DCA]/25 transition-all"
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
                            onClick={() => search(true)}
                            className="flex items-center gap-1 text-xs text-slate-900 hover:text-slate-900 transition-colors"
                        >
                            <RefreshCw size={11} />
                            Volver a buscar
                        </button>
                    )}
                </div>
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
                        {groups.map(({ key, label, emoji }, gi) => {
                            const items = data[key] ?? [];
                            if (items.length === 0) return null;
                            return (
                                <motion.div
                                    key={key}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: gi * 0.1, type: "spring", stiffness: 200 }}
                                    className="p-4"
                                >
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#253C87]/10 to-[#208DCA]/10 flex items-center justify-center text-lg">
                                            {emoji}
                                        </div>
                                        <span className="text-sm font-bold text-slate-800">{label}</span>
                                        <span className="text-[#208DCA] font-bold bg-[#208DCA]/10 px-2.5 py-0.5 rounded-full text-[11px]">{items.length}</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {items.map((item, i) => {
                                            const isChecked = !!checked[`${key}_${i}`];
                                            return (
                                                <Shine key={i} enableOnHover color="#208DCA" opacity={0.08} duration={400} asChild>
                                                    <motion.button
                                                        onClick={() => toggleItem(key, i)}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: i * 0.05, type: "spring", stiffness: 300 }}
                                                        whileHover={{ y: -2, shadow: "0 8px 24px rgba(0,0,0,0.1)" }}
                                                        whileTap={{ scale: 0.97 }}
                                                        className={`relative w-full flex items-start gap-3 p-3.5 rounded-2xl border-2 transition-all text-left overflow-hidden ${
                                                            isChecked
                                                                ? "bg-gradient-to-br from-[#208DCA]/8 to-[#253C87]/5 border-[#208DCA]/30 shadow-md shadow-[#208DCA]/10"
                                                                : "bg-white border-slate-200/80 hover:border-slate-300"
                                                        }`}
                                                    >
                                                        {/* Check indicator */}
                                                        <motion.div
                                                            className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                                                                isChecked
                                                                    ? "bg-[#208DCA] shadow-sm shadow-[#208DCA]/30"
                                                                    : "bg-slate-100 border border-slate-200"
                                                            }`}
                                                            animate={{ scale: isChecked ? [1, 1.2, 1] : 1 }}
                                                            transition={{ duration: 0.25 }}
                                                        >
                                                            {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                                                        </motion.div>

                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-[13px] font-semibold leading-tight ${isChecked ? "text-[#208DCA]" : "text-slate-800"}`}>
                                                                {item.name}
                                                            </p>
                                                            {item.distance_text && (
                                                                <div className="flex items-center gap-1 mt-1">
                                                                    <Navigation size={10} className="text-[#208DCA]/50" />
                                                                    <span className="text-[11px] text-[#208DCA]/70 font-medium">
                                                                        {item.distance_text}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {item.address && (
                                                                <p className="text-[11px] text-slate-400 mt-0.5 truncate">{item.address}</p>
                                                            )}
                                                            {item.phone && (
                                                                <p className="text-[11px] text-slate-400">📞 {item.phone}</p>
                                                            )}
                                                        </div>

                                                        {/* Selected glow */}
                                                        {isChecked && (
                                                            <motion.div
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                className="absolute top-0 right-0 w-16 h-16 bg-[#208DCA]/5 rounded-full blur-2xl -mr-4 -mt-4 pointer-events-none"
                                                            />
                                                        )}
                                                    </motion.button>
                                                </Shine>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            );
                        })}

                        {totalItems === 0 && (
                            <p className="px-4 py-6 text-sm text-slate-400 text-center">
                                No se encontraron lugares en este radio. Prueba a ampliarlo.
                            </p>
                        )}

                        {/* ── Confirm ── */}
                        {totalItems > 0 && (
                            <div className="px-4 py-4">
                                <Shine enableOnHover color="white" opacity={0.3} duration={500} asChild>
                                    <motion.button
                                        onClick={confirm}
                                        whileHover={{ scale: 1.02, y: -1 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full flex items-center justify-center gap-2.5 text-sm py-3.5 rounded-2xl bg-gradient-to-r from-[#253C87] to-[#208DCA] text-white font-bold shadow-xl shadow-[#208DCA]/30 hover:shadow-2xl transition-all"
                                    >
                                        <Check size={16} strokeWidth={3} />
                                        Usar datos seleccionados
                                    </motion.button>
                                </Shine>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
