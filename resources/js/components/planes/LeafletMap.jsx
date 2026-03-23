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


function poiIcon(emoji) {
    return L.divIcon({
        className: "",
        html: `<div style="font-size:18px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.2);border:2px solid #e2e8f0">${emoji}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
    });
}



/**
 * command prop:
 *   { type: "search", query: "..." }
 *   { type: "route",  a: { lat, lng }, b: { lat, lng } }    — coords from autocomplete
 *   { type: "route",  a: "address", b: "address" }          — legacy text mode
 *   { type: "poi",    lat, lng, categories: ["hospital", "police", ...] }
 *   { type: "clear" }
 */
const NOMINATIM_REVERSE = "https://nominatim.openstreetmap.org/reverse";

export default function LeafletMap({ command, onStatus, onRouteData, onMarkerDrag, interactionDisabled }) {
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
        const map = L.map(containerRef.current, {
            zoomControl: true,
            scrollWheelZoom: false,
            zoomSnap: 0.25,
            zoomDelta: 0.5,
        }).setView([40.4168, -3.7038], 13);

        // Ctrl + scroll to zoom
        containerRef.current.addEventListener("wheel", (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.4 : 0.4;
                map.setZoom(map.getZoom() + delta);
            }
        }, { passive: false });

        mapRef.current = map;
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
            maxZoom: 19,
        }).addTo(mapRef.current);
        return () => { mapRef.current?.remove(); mapRef.current = null; };
    }, []);

    // Disable/enable map interactions (for capture mode)
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        if (interactionDisabled) {
            map.dragging.disable();
            map.doubleClickZoom.disable();
            map.boxZoom.disable();
            map.keyboard.disable();
            if (map.tap) map.tap.disable();
        } else {
            map.dragging.enable();
            map.doubleClickZoom.enable();
            map.boxZoom.enable();
            map.keyboard.enable();
            if (map.tap) map.tap.enable();
        }
    }, [interactionDisabled]);

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

    // React to commands — retry if map not ready yet
    useEffect(() => {
        if (!command) return;
        if (prevCommandRef.current === command) return;
        if (!mapRef.current) {
            // Map not ready, retry in 100ms
            const t = setTimeout(() => { prevCommandRef.current = null; }, 100);
            return () => clearTimeout(t);
        }
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
                    const marker = L.marker([lat, lng], { draggable: true })
                        .addTo(map)
                        .bindTooltip("Mueve la chincheta hacia el lugar exacto", {
                            direction: "top", offset: [0, -10], permanent: false,
                        });

                    marker.on("dragend", async () => {
                        const pos = marker.getLatLng();
                        marker.unbindTooltip();
                        marker.bindTooltip("Buscando dirección...", { direction: "top", offset: [0, -10], permanent: true }).openTooltip();

                        try {
                            const res = await fetch(
                                `${NOMINATIM_REVERSE}?lat=${pos.lat}&lon=${pos.lng}&format=json`,
                                { headers: { "User-Agent": UA, "Accept-Language": "es" } }
                            );
                            const data = await res.json();
                            const newAddress = data.display_name || `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;

                            marker.unbindTooltip();
                            const popup = L.popup({ closeButton: false, className: "marker-drag-popup" })
                                .setLatLng(pos)
                                .setContent(`
                                    <div style="font-family:system-ui;font-size:12px;max-width:260px">
                                        <div style="font-weight:600;margin-bottom:6px;color:#1e293b">${newAddress}</div>
                                        <div style="display:flex;gap:6px">
                                            <button onclick="window.__markerUseNew__()" style="flex:1;padding:5px 8px;border-radius:8px;border:none;background:#208DCA;color:white;font-size:11px;font-weight:600;cursor:pointer">Usar esta dirección</button>
                                            <button onclick="window.__markerKeep__()" style="flex:1;padding:5px 8px;border-radius:8px;border:1px solid #e2e8f0;background:white;color:#64748b;font-size:11px;cursor:pointer">Mantener actual</button>
                                        </div>
                                    </div>
                                `)
                                .openOn(map);

                            window.__markerUseNew__ = () => {
                                map.closePopup(popup);
                                onMarkerDrag?.({ lat: pos.lat, lng: pos.lng, displayName: newAddress });
                            };
                            window.__markerKeep__ = () => {
                                map.closePopup(popup);
                                marker.setLatLng([lat, lng]);
                            };
                        } catch {
                            marker.unbindTooltip();
                            marker.bindTooltip("No se pudo obtener la dirección", { direction: "top", offset: [0, -10] });
                        }
                    });

                    markersRef.current.push(marker);
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

            // Use backend proxy (cached 7 days, no CORS/rate issues)
            const params = new URLSearchParams({ lat, lng });
            categories.forEach((c) => params.append("categories[]", c));

            (async () => {
                try {
                    const res = await fetch(`/api/map-pois?${params}`);
                    const pois = await res.json();

                    (pois || []).forEach((poi) => {
                        const m = L.marker([poi.lat, poi.lng], { icon: poiIcon(poi.emoji) })
                            .bindTooltip(poi.name, { direction: "top", offset: [0, -10] })
                            .addTo(map);
                        poiLayerRef.current.push(m);
                    });
                } catch {
                    // Silently ignore failures
                }
            })();
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
