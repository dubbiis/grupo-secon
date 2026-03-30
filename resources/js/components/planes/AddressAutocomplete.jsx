import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { MapPin, Building2, Train, TreePine, Search, Loader2 } from "lucide-react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

const TYPE_ICONS = {
    street_address: MapPin,
    route: MapPin,
    premise: MapPin,
    subpremise: MapPin,
    locality: Building2,
    administrative_area_level_1: Building2,
    administrative_area_level_2: Building2,
    country: Building2,
    transit_station: Train,
    train_station: Train,
    subway_station: Train,
    park: TreePine,
    point_of_interest: MapPin,
    establishment: MapPin,
};

function getIconForTypes(types = []) {
    for (const t of types) {
        if (TYPE_ICONS[t]) return TYPE_ICONS[t];
    }
    return MapPin;
}

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
    quickAddresses = [],
}) {
    const [results, setResults] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
    const timerRef = useRef(null);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const sessionTokenRef = useRef(null);
    const autocompleteServiceRef = useRef(null);
    const placesServiceRef = useRef(null);
    const hiddenDivRef = useRef(null);

    // Load the Places library via the official hook
    const placesLib = useMapsLibrary("places");

    // Create a hidden div for PlacesService (requires a DOM element)
    useEffect(() => {
        if (!hiddenDivRef.current) {
            hiddenDivRef.current = document.createElement("div");
            hiddenDivRef.current.style.display = "none";
            document.body.appendChild(hiddenDivRef.current);
        }
        return () => {
            if (hiddenDivRef.current?.parentNode) {
                hiddenDivRef.current.parentNode.removeChild(hiddenDivRef.current);
            }
        };
    }, []);

    // Initialize services once placesLib is loaded
    useEffect(() => {
        if (!placesLib) return;
        if (!autocompleteServiceRef.current) {
            autocompleteServiceRef.current = new placesLib.AutocompleteService();
        }
        if (!placesServiceRef.current && hiddenDivRef.current) {
            placesServiceRef.current = new placesLib.PlacesService(hiddenDivRef.current);
        }
    }, [placesLib]);

    const getSessionToken = useCallback(() => {
        if (!sessionTokenRef.current && placesLib?.AutocompleteSessionToken) {
            sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
        }
        return sessionTokenRef.current;
    }, [placesLib]);

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

            const service = autocompleteServiceRef.current;
            if (!service) {
                setResults([]);
                setOpen(false);
                return;
            }

            setLoading(true);
            try {
                const request = {
                    input: query,
                    sessionToken: getSessionToken(),
                    language: "es",
                };

                if (biasLat && biasLng && window.google?.maps?.LatLng) {
                    request.locationBias = new google.maps.Circle({
                        center: new google.maps.LatLng(biasLat, biasLng),
                        radius: 50000,
                    });
                }

                service.getPlacePredictions(request, (predictions, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                        const items = predictions.map((p) => ({
                            placeId: p.place_id,
                            name: p.structured_formatting?.main_text || p.description,
                            subtitle: p.structured_formatting?.secondary_text || "",
                            displayName: p.description,
                            types: p.types || [],
                        }));
                        setResults(items);
                        setOpen(items.length > 0);
                        setActiveIdx(-1);
                    } else {
                        setResults([]);
                        setOpen(false);
                    }
                    setLoading(false);
                });
            } catch {
                setResults([]);
                setOpen(false);
                setLoading(false);
            }
        },
        [biasLat, biasLng, placesLib, getSessionToken]
    );

    const resolvePlace = useCallback(
        (placeId, displayName) => {
            const service = placesServiceRef.current;
            if (!service) {
                onSelect?.({ lat: 0, lng: 0, displayName });
                return;
            }

            service.getDetails(
                {
                    placeId,
                    fields: ["geometry", "formatted_address", "name"],
                    sessionToken: getSessionToken(),
                },
                (place, status) => {
                    sessionTokenRef.current = null;

                    if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                        onSelect?.({
                            lat: place.geometry.location.lat(),
                            lng: place.geometry.location.lng(),
                            displayName: place.formatted_address || displayName,
                            name: place.name || displayName,
                        });
                    } else {
                        onSelect?.({ lat: 0, lng: 0, displayName });
                    }
                }
            );
        },
        [placesLib, getSessionToken, onSelect]
    );

    const handleChange = (e) => {
        const val = e.target.value;
        onChange?.(val);

        if (timerRef.current) clearTimeout(timerRef.current);
        const endsWithDigit = /\d$/.test(val.trim());
        timerRef.current = setTimeout(() => search(val), endsWithDigit ? 800 : 250);
    };

    const handleSelect = (item) => {
        onChange?.(item.displayName);
        setOpen(false);
        setResults([]);
        inputRef.current?.blur();

        if (item.placeId) {
            resolvePlace(item.placeId, item.displayName);
        } else if (item.lat && item.lng) {
            onSelect?.(item);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Escape") { setOpen(false); return; }

        if (e.key === "Enter") {
            e.preventDefault();
            if (open && activeIdx >= 0 && results[activeIdx]) {
                handleSelect(results[activeIdx]);
            } else if (open && results.length > 0) {
                handleSelect(results[0]);
            } else if (value.trim().length >= 3) {
                search(value.trim());
            }
            return;
        }

        if (!open || results.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((prev) => Math.min(prev + 1, results.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((prev) => Math.max(prev - 1, 0));
        }
    };

    // Close on click outside
    useEffect(() => {
        const handleClick = (e) => {
            if (
                wrapperRef.current && !wrapperRef.current.contains(e.target) &&
                dropdownRef.current && !dropdownRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
            if (wrapperRef.current && !wrapperRef.current.contains(e.target) && !dropdownRef.current) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
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

            {/* Quick address chips */}
            {quickAddresses.length > 0 && !value && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                    {quickAddresses.map((qa, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => {
                                onChange?.(qa.address);
                                search(qa.address);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#208DCA]/10 text-[#208DCA] border border-[#208DCA]/20 hover:bg-[#208DCA]/20 transition-colors"
                        >
                            <MapPin size={9} />
                            {qa.label}
                        </button>
                    ))}
                </div>
            )}

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
                        const Icon = getIconForTypes(item.types);
                        return (
                            <motion.button
                                key={item.placeId || `${i}`}
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
