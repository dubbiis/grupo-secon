import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const OSRM      = "https://router.project-osrm.org/route/v1/driving";
const OVERPASS   = "https://overpass-api.de/api/interpreter";
const UA         = "GrupoSecon/1.0";

async function geocode(query) {
    const res  = await fetch(
        `${NOMINATIM}?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { "User-Agent": UA, "Accept-Language": "es" } }
    );
    const data = await res.json();
    if (!data.length) throw new Error("No encontrado");
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

function labelIcon(letter, bg) {
    return L.divIcon({
        className: "",
        html: `<div style="width:28px;height:28px;border-radius:50%;background:${bg};border:3px solid white;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-family:system-ui,sans-serif">${letter}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    });
}

function routeLabel(text, isPrimary) {
    const bg = isPrimary ? "#208DCA" : "#64748B";
    return L.divIcon({
        className: "",
        html: `<div style="background:${bg};color:white;font-size:13px;font-weight:700;padding:6px 14px;border-radius:24px;white-space:nowrap;box-shadow:0 3px 12px rgba(0,0,0,0.3);font-family:system-ui,sans-serif;cursor:pointer;border:2px solid white;display:flex;align-items:center;gap:6px"><span style="font-size:15px">🚗</span>${text}</div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
    });
}

function poiIcon(emoji) {
    return L.divIcon({
        className: "",
        html: `<div style="font-size:18px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.2);border:2px solid #e2e8f0">${emoji}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
    });
}

function getMidpoint(coords) {
    const mid = Math.floor(coords.length / 2);
    return coords[mid] || coords[0];
}

const POI_QUERIES = {
    hospital: { query: '["amenity"~"hospital|clinic"]', emoji: "🏥", radius: 5000 },
    police:   { query: '["amenity"~"police"]', emoji: "👮", radius: 5000 },
    parking:  { query: '["amenity"="parking"]', emoji: "🅿️", radius: 2000 },
    metro:    { query: '["railway"="station"]', emoji: "🚇", radius: 3000 },
};

/**
 * command prop:
 *   { type: "search", query: "..." }
 *   { type: "route",  a: { lat, lng }, b: { lat, lng } }    — coords from autocomplete
 *   { type: "route",  a: "address", b: "address" }          — legacy text mode
 *   { type: "poi",    lat, lng, categories: ["hospital", "police", ...] }
 *   { type: "clear" }
 */
export default function LeafletMap({ command, onStatus, onRouteData }) {
    const containerRef   = useRef(null);
    const mapRef         = useRef(null);
    const markersRef     = useRef([]);
    const routeLayersRef = useRef([]);
    const routeLabelsRef = useRef([]);
    const poiLayerRef    = useRef([]);
    const prevCommandRef = useRef(null);
    const cachedRoutesRef = useRef(null); // { routes, locA, locB }

    // Init map
    useEffect(() => {
        if (mapRef.current || !containerRef.current) return;
        mapRef.current = L.map(containerRef.current, { zoomControl: true })
            .setView([40.4168, -3.7038], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
            maxZoom: 19,
        }).addTo(mapRef.current);
        return () => { mapRef.current?.remove(); mapRef.current = null; };
    }, []);

    const clearRoutes = useCallback(() => {
        routeLayersRef.current.forEach((l) => l.remove());
        routeLayersRef.current = [];
        routeLabelsRef.current.forEach((l) => l.remove());
        routeLabelsRef.current = [];
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];
    }, []);

    const clearPOIs = useCallback(() => {
        poiLayerRef.current.forEach((m) => m.remove());
        poiLayerRef.current = [];
    }, []);

    const renderRoutes = useCallback((routes, locA, locB, selectedIdx = 0) => {
        const map = mapRef.current;
        if (!map) return;

        cachedRoutesRef.current = { routes, locA, locB };
        clearRoutes();

        // Render alternatives first (behind), then primary (on top)
        const ordered = routes.map((r, i) => ({ ...r, idx: i }));
        ordered.sort((a, b) => (a.idx === selectedIdx ? 1 : -1) - (b.idx === selectedIdx ? 1 : -1));

        let primaryBounds = null;

        ordered.forEach((route) => {
            const isPrimary = route.idx === selectedIdx;
            const layer = L.geoJSON(route.geometry, {
                style: {
                    color: isPrimary ? "#208DCA" : "#94A3B8",
                    weight: isPrimary ? 6 : 4,
                    opacity: isPrimary ? 0.9 : 0.45,
                    dashArray: isPrimary ? null : "8,6",
                },
            }).addTo(map);

            if (isPrimary) primaryBounds = layer.getBounds();

            // Click alternative to select it
            layer.on("click", () => {
                if (!isPrimary) {
                    renderRoutes(routes, locA, locB, route.idx);
                    onRouteData?.({ routes, selectedIndex: route.idx });
                }
            });

            routeLayersRef.current.push(layer);

            // Route label at midpoint
            const coords = route.geometry.coordinates;
            const mid = getMidpoint(coords);
            const dist = (route.distance / 1000).toFixed(1);
            const mins = Math.round(route.duration / 60);
            const text = `${mins} min · ${dist} km`;

            const marker = L.marker([mid[1], mid[0]], {
                icon: routeLabel(text, isPrimary),
                interactive: true,
                zIndexOffset: isPrimary ? 1000 : 0,
            }).addTo(map);

            marker.on("click", () => {
                if (!isPrimary) {
                    renderRoutes(routes, locA, locB, route.idx);
                    onRouteData?.({ routes, selectedIndex: route.idx });
                }
            });

            routeLabelsRef.current.push(marker);
        });

        // Endpoint markers
        markersRef.current.push(
            L.marker([locA.lat, locA.lng], { icon: labelIcon("A", "#253C87"), zIndexOffset: 2000 }).addTo(map),
            L.marker([locB.lat, locB.lng], { icon: labelIcon("B", "#208DCA"), zIndexOffset: 2000 }).addTo(map),
        );

        if (primaryBounds) map.fitBounds(primaryBounds, { padding: [40, 40] });

        // Notify parent
        const selected = routes[selectedIdx];
        const dist = (selected.distance / 1000).toFixed(1);
        const mins = Math.round(selected.duration / 60);
        onStatus?.(`${dist} km · ${mins} min en coche`);
        onRouteData?.({ routes, selectedIndex: selectedIdx });
    }, [clearRoutes, onStatus, onRouteData]);

    // React to commands
    useEffect(() => {
        if (!command || !mapRef.current) return;
        if (prevCommandRef.current === command) return;
        prevCommandRef.current = command;

        const map = mapRef.current;

        // Select a different route alternative (no new API call)
        if (command.type === "route" && command._selectIdx != null && cachedRoutesRef.current) {
            const { routes, locA, locB } = cachedRoutesRef.current;
            if (routes[command._selectIdx]) {
                renderRoutes(routes, locA, locB, command._selectIdx);
            }
            return;
        }

        if (command.type === "clear") {
            clearRoutes();
            clearPOIs();
            onStatus?.(null);
            return;
        }

        if (command.type === "search") {
            onStatus?.("loading");
            const doSearch = typeof command.query === "string"
                ? geocode(command.query)
                : Promise.resolve(command.query);

            doSearch
                .then(({ lat, lng }) => {
                    clearRoutes();
                    markersRef.current.push(L.marker([lat, lng]).addTo(map));
                    map.setView([lat, lng], 15);
                    onStatus?.(null);
                })
                .catch(() => onStatus?.("error"));
        }

        if (command.type === "route") {
            onStatus?.("loading");

            // Resolve A and B — either coords object or string address
            const resolveA = typeof command.a === "string" ? geocode(command.a) : Promise.resolve(command.a);
            const resolveB = typeof command.b === "string" ? geocode(command.b) : Promise.resolve(command.b);

            Promise.all([resolveA, resolveB])
                .then(async ([locA, locB]) => {
                    const res = await fetch(
                        `${OSRM}/${locA.lng},${locA.lat};${locB.lng},${locB.lat}?geometries=geojson&overview=full&alternatives=3`
                    );
                    const data = await res.json();
                    if (data.code !== "Ok" || !data.routes?.length) throw new Error("No route");

                    renderRoutes(data.routes, locA, locB, 0);
                })
                .catch(() => onStatus?.("error"));
        }

        if (command.type === "poi") {
            clearPOIs();
            const { lat, lng, categories } = command;
            if (!lat || !lng || !categories?.length) return;

            categories.forEach(async (cat) => {
                const cfg = POI_QUERIES[cat];
                if (!cfg) return;

                try {
                    const query = `[out:json][timeout:10];(node${cfg.query}(around:${cfg.radius},${lat},${lng}););out center 5;`;
                    const res = await fetch(OVERPASS, {
                        method: "POST",
                        body: `data=${encodeURIComponent(query)}`,
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    });
                    const data = await res.json();
                    (data.elements || []).slice(0, 5).forEach((el) => {
                        const elLat = el.lat || el.center?.lat;
                        const elLng = el.lon || el.center?.lon;
                        if (!elLat || !elLng) return;

                        const name = el.tags?.name || cat;
                        const m = L.marker([elLat, elLng], { icon: poiIcon(cfg.emoji) })
                            .bindTooltip(name, { direction: "top", offset: [0, -10] })
                            .addTo(map);
                        poiLayerRef.current.push(m);
                    });
                } catch {
                    // Silently ignore POI failures
                }
            });
        }
    }, [command, onStatus, onRouteData, renderRoutes, clearRoutes, clearPOIs]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full rounded-xl overflow-hidden"
            style={{ minHeight: 480 }}
        />
    );
}
