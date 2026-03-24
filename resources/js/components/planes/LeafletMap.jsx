import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const SECON_MARKER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="40" height="40"><defs><style>.st0{fill:#273887}.st1{fill:#fff}</style></defs><path class="st0" d="M256,0C153.8,0,70.6,83.2,70.6,185.4s165.9,313.2,173,321c6.6,7.4,18.2,7.4,24.8,0,7.1-7.9,173-194.1,173-321C441.4,83.2,358.2,0,256,0Z"/><path class="st0" d="M398.5,184.9c0,78.7-63.8,142.5-142.5,142.5s-142.5-63.8-142.5-142.5S177.3,42.5,256,42.5s142.5,63.8,142.5,142.5"/><path class="st1" d="M256,22.9c-89.3,0-162,72.7-162,162s72.7,162,162,162,162-72.7,162-162S345.3,22.9,256,22.9ZM256,330.6c-25.9,0-50.2-6.8-71.3-18.7h45.4c1.9,0,3.9,0,5.8,0h1.7c2.8,0,5.6-.2,8.2-.4,16.9-1.3,29.9-3.1,38.9-5.7,22.2-6.4,37.2-17.2,44.9-32.4,7.6-15.1,9.3-29.9,5.1-44.6-4.3-14.9-13-25.3-26.1-31.1-13.6-6-34-9.2-61-9.6-20.7-.5-35.8-1.9-45.3-4.2-9.4-2.1-18.2-6.9-26.2-14.1-7.8-7-13.4-16.2-16.6-27.5-1.2-4.2-1.8-9.4-1.6-15.5-4.5,13.2-5.1,25.6-1.8,37.1,2.9,10.3,8.4,18.8,16.5,25.4,7.6,6.6,16.7,11,27.3,13.1,9.2,1.8,24,3.1,44.7,3.9,25.7.9,43.4,3.3,53.2,7.1,10.1,3.9,16.7,11.5,20,22.8,3.1,10.7,1.4,21.2-4.9,31.3-6.4,10.2-16.6,16.3-30,21.1-13.8,4.9-28.1,5.7-45.2,5.8h0s-77.8,0-77.8,0c-5.7-5.1-11.1-10.6-16-16.5,22.8,0,76.4.3,107.9,0,47.4-.5,52.8-29,52.8-29,0,0-11.4,10.2-47.6,10.2h-126.3c-12.8-21.7-20.2-47-20.2-73.9,0-80.3,65.3-145.7,145.7-145.7s51.7,7.2,73.2,19.8h-58.3c-12.1.3-22.9,1-33.6,3.1-25,5-43.6,16-54.3,29-10.6,13.2-13.6,28.2-8.8,44.7,4.1,14.3,11.5,23.7,22.2,28,10.6,4.2,31.6,6.9,62.9,8.1,20.8.8,36.2,2.7,46.2,5.8,9.8,3,18.9,8.3,27.1,15.8,8,7.5,13.6,17,16.9,28.6,3.5,12.3,3.8,22.6.9,30.9,10.4-14.2,13-30.3,7.8-48.4-3.4-11.9-9.5-21.8-18.5-29.8-8.8-7.7-18.5-12.7-29.1-15.2-9.9-2.2-26.6-3.9-50.2-5.1-25.3-1.3-42.8-3.8-52.3-7.4-9.1-3.2-15-9.5-17.6-18.7-2.5-8.7.1-17.6,7.9-26.6,7.7-8.9,18.8-15.5,33.4-19.7,15.4-4.4,34.7-5.2,49.9-5.3h3.7c1.7,0,3.3,0,4.9,0,.2,0,.4,0,.6,0h62.7c5.8,5.2,11.2,11,16.1,17.1h-110.2c-47.5,0-52.8,28.9-52.8,28.9,0,0,11.4-10.2,47.6-10.2h128.2c12.2,21.3,19.3,46,19.3,72.3,0,80.3-65.4,145.7-145.7,145.7Z"/></svg>`;

const seconIcon = L.divIcon({
    className: "",
    html: SECON_MARKER_SVG,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    tooltipAnchor: [0, -34],
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

export default function LeafletMap({ command, onStatus, onRouteData, onMarkerDrag, interactionDisabled, satellite = false }) {
    const containerRef   = useRef(null);
    const mapRef         = useRef(null);
    const tileLayerRef   = useRef(null);
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

        tileLayerRef.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
            maxZoom: 19,
            crossOrigin: "anonymous",
        }).addTo(map);

        return () => { mapRef.current?.remove(); mapRef.current = null; };
    }, []);

    // Switch tile layer when satellite prop changes
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !tileLayerRef.current) return;

        map.removeLayer(tileLayerRef.current);

        tileLayerRef.current = satellite
            ? L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
                attribution: "© Esri, Maxar, Earthstar Geographics",
                maxZoom: 19,
                crossOrigin: "anonymous",
            }).addTo(map)
            : L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
                maxZoom: 19,
                crossOrigin: "anonymous",
            }).addTo(map);

        // Ensure tile layer is behind everything
        tileLayerRef.current.bringToBack();
    }, [satellite]);

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
                    const marker = L.marker([lat, lng], { icon: seconIcon, draggable: true })
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
