import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Building2, Train, TreePine, Search, Loader2 } from "lucide-react";

const GEOCODE_URL = "/api/geocode";

const TYPE_ICONS = {
    house: MapPin,
    street: MapPin,
    city: Building2,
    locality: Building2,
    district: Building2,
    county: Building2,
    state: Building2,
    country: Building2,
    railway: Train,
    park: TreePine,
};

export default function AddressAutocomplete({
    value = "",
    onChange,
    onSelect,
    label,
    labelColor = "#208DCA",
    biasLat,
    biasLng,
    placeholder = "Buscar dirección...",
    className = "",
}) {
    const [results, setResults] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
    const abortRef = useRef(null);
    const timerRef = useRef(null);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Update dropdown position when opening
    useEffect(() => {
        if (open && inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setDropPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
        }
    }, [open]);

    const search = useCallback(
        async (query) => {
            if (query.length < 2) {
                setResults([]);
                setOpen(false);
                return;
            }

            if (abortRef.current) abortRef.current.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            setLoading(true);
            try {
                const params = new URLSearchParams({ q: query });
                if (biasLat && biasLng) {
                    params.set("lat", String(biasLat));
                    params.set("lng", String(biasLng));
                }

                const res = await fetch(`${GEOCODE_URL}?${params}`, { signal: controller.signal });
                const items = await res.json();

                setResults(items);
                setOpen(items.length > 0);
                setActiveIdx(-1);
            } catch (err) {
                if (err.name !== "AbortError") {
                    setResults([]);
                    setOpen(false);
                }
            } finally {
                setLoading(false);
            }
        },
        [biasLat, biasLng]
    );

    const handleChange = (e) => {
        const val = e.target.value;
        onChange?.(val);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => search(val), 150);
    };

    const handleSelect = (item) => {
        onChange?.(item.displayName);
        onSelect?.(item);
        setOpen(false);
        setResults([]);
        inputRef.current?.blur();
    };

    const handleKeyDown = (e) => {
        if (!open || results.length === 0) {
            if (e.key === "Enter") {
                e.preventDefault();
                // Force search with current value
                search(value);
            }
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((prev) => Math.min(prev + 1, results.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((prev) => Math.max(prev - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (activeIdx >= 0 && results[activeIdx]) {
                handleSelect(results[activeIdx]);
            } else if (results.length > 0) {
                handleSelect(results[0]);
            }
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };

    // Close on click outside (check both wrapper and portal dropdown)
    useEffect(() => {
        const handleClick = (e) => {
            if (
                wrapperRef.current && !wrapperRef.current.contains(e.target) &&
                dropdownRef.current && !dropdownRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
            // If dropdown not mounted yet, only check wrapper
            if (wrapperRef.current && !wrapperRef.current.contains(e.target) && !dropdownRef.current) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (abortRef.current) abortRef.current.abort();
        };
    }, []);

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <div className="flex items-center gap-2">
                {label && (
                    <div
                        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
                        style={{ background: labelColor }}
                    >
                        {label}
                    </div>
                )}
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => results.length > 0 && setOpen(true)}
                        placeholder={placeholder}
                        className="w-full pl-8 pr-8 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#208DCA]/40 focus:border-[#208DCA]/30 transition-all"
                    />
                    {loading && (
                        <Loader2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#208DCA] animate-spin" />
                    )}
                </div>
            </div>

            {open && results.length > 0 && createPortal(
                <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="fixed bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden"
                    style={{ zIndex: 99999, top: dropPos.top, left: dropPos.left, width: dropPos.width, minWidth: 280 }}
                >
                    {results.map((item, i) => {
                        const Icon = TYPE_ICONS[item.type] || MapPin;
                        return (
                            <motion.button
                                key={`${item.lat}-${item.lng}-${i}`}
                                type="button"
                                onClick={() => handleSelect(item)}
                                onMouseEnter={() => setActiveIdx(i)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                                    i === activeIdx ? "bg-[#208DCA]/8" : "hover:bg-slate-50"
                                }`}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03 }}
                            >
                                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                                    <Icon size={14} className="text-[#208DCA]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-slate-900 truncate">{item.name}</div>
                                    {item.subtitle && (
                                        <div className="text-[10px] text-slate-500 truncate">{item.subtitle}</div>
                                    )}
                                </div>
                            </motion.button>
                        );
                    })}
                </motion.div>,
                document.body
            )}
        </div>
    );
}
