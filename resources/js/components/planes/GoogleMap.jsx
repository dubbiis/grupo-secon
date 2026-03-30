import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react";
import { usePage } from "@inertiajs/react";

const SECON_MARKER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="40" height="40"><defs><style>.st0{fill:#273887}.st1{fill:#fff}</style></defs><path class="st0" d="M256,0C153.8,0,70.6,83.2,70.6,185.4s165.9,313.2,173,321c6.6,7.4,18.2,7.4,24.8,0,7.1-7.9,173-194.1,173-321C441.4,83.2,358.2,0,256,0Z"/><path class="st0" d="M398.5,184.9c0,78.7-63.8,142.5-142.5,142.5s-142.5-63.8-142.5-142.5S177.3,42.5,256,42.5s142.5,63.8,142.5,142.5"/><path class="st1" d="M256,42.5c-78.6,0-142.5,63.9-142.5,142.5s63.9,142.5,142.5,142.5,142.5-63.9,142.5-142.5S334.6,42.5,256,42.5ZM256,313.1c-22.8,0-44.1-6-62.7-16.5h39.9c1.7,0,3.4,0,5.1,0h1.5c2.5,0,4.9-.2,7.2-.3,14.9-1.1,26.3-2.8,34.2-5,19.5-5.6,32.7-15.1,39.5-28.5,6.7-13.2,8.2-26.3,4.5-39.2-3.8-13.1-11.4-22.3-23-27.4-12-5.3-29.9-8.1-53.6-8.5-18.2-.4-31.5-1.7-39.8-3.7-8.3-1.9-16-6-23-12.4-6.9-6.2-11.8-14.2-14.6-24.2-1.1-3.7-1.5-8.3-1.4-13.7-4,11.6-4.5,22.5-1.6,32.6,2.6,9.1,7.4,16.5,14.5,22.4,6.6,5.8,14.7,9.7,24,11.5,8,1.6,21.1,2.7,39.3,3.4,22.6.8,38.2,2.9,46.8,6.2,8.9,3.4,14.7,10.1,17.6,20,2.7,9.4,1.3,18.6-4.3,27.6-5.6,8.9-14.6,14.4-26.4,18.5-12.1,4.3-24.7,5-39.8,5.1h0s-68.4,0-68.4,0c-5.1-4.5-9.8-9.3-14.1-14.5,20.1,0,67.2.2,94.9,0,41.7-.4,46.4-25.5,46.4-25.5,0,0-10,8.9-41.9,8.9h-111.1c-11.3-19.1-17.8-41.3-17.8-65,0-70.6,57.5-128.1,128.1-128.1s45.4,6.4,64.4,17.4h-51.3c-10.7.3-20.1.8-29.5,2.7-22,4.4-38.3,14-47.8,25.5-9.4,11.7-11.9,24.8-7.8,39.3,3.6,12.6,10.1,20.8,19.5,24.6,9.4,3.7,27.8,6.1,55.3,7.1,18.3.7,31.8,2.4,40.6,5.1,8.6,2.6,16.6,7.3,23.9,13.9,7,6.6,12,14.9,14.9,25.2,3.1,10.8,3.4,19.9.8,27.1,9.1-12.5,11.4-26.6,6.8-42.6-3-10.5-8.4-19.2-16.2-26.2-7.7-6.8-16.3-11.2-25.6-13.4-8.7-1.9-23.4-3.4-44.2-4.5-22.3-1.2-37.6-3.3-46-6.5-8-2.8-13.2-8.3-15.5-16.5-2.2-7.7.1-15.5,7-23.4,6.7-7.9,16.5-13.6,29.4-17.4,13.5-3.9,30.5-4.6,43.9-4.6h3.3c1.5,0,2.9,0,4.3,0,.2,0,.3,0,.5,0h55.1c5.1,4.6,9.8,9.7,14.2,15h-96.9c-41.7,0-46.4,25.5-46.4,25.5,0,0,10-8.9,41.9-8.9h112.8c10.8,18.7,17,40.4,17,63.6,0,70.7-57.5,128.1-128.1,128.1Z"/></svg>`;

/**
 * GoogleMap — drop-in replacement for LeafletMap using Google Maps JS API (new APIs).
 *
 * command prop:
 *   { type: "search", query: "..." | { lat, lng } }
 *   { type: "route",  a: { lat, lng }, b: { lat, lng }, _selectIdx?: number }
 *   { type: "poi",    lat, lng, categories: ["hospital", "police", ...] }
 *   { type: "clear" }
 */
const GoogleMap = forwardRef(function GoogleMap(
    { command, onStatus, onRouteData, onMarkerDrag, interactionDisabled, satellite = false },
    ref
) {
    const containerRef     = useRef(null);
    const mapRef           = useRef(null);
    const markersRef       = useRef([]);
    const polylinesRef     = useRef([]);
    const routeLabelsRef   = useRef([]);
    const poiMarkersRef    = useRef([]);
    const prevCommandRef   = useRef(null);
    const cachedRoutesRef  = useRef(null);
    const geocoderRef      = useRef(null);
    const infoWindowRef    = useRef(null);

    const { googleMapsMapId, googleMapsApiKey } = usePage().props;
    const apiKey = googleMapsApiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

    // Expose map instance and state for MapEditor screenshot
    useImperativeHandle(ref, () => ({
        getMap: () => mapRef.current,
        getContainer: () => containerRef.current,
        getMapState: () => {
            const map = mapRef.current;
            if (!map) return null;
            const center = map.getCenter();
            const cached = cachedRoutesRef.current;
            const selectedRoute = cached?.routes?.[cached?.selectedIdx ?? 0];
            return {
                center: { lat: center.lat(), lng: center.lng() },
                zoom: map.getZoom(),
                mapTypeId: map.getMapTypeId(),
                selectedRoutePolyline: selectedRoute?.encodedPolyline || null,
                routeOrigin: cached?.locA || null,
                routeDestination: cached?.locB || null,
                apiKey,
            };
        },
    }));

    // Init map
    useEffect(() => {
        if (mapRef.current || !containerRef.current) return;
        if (!window.google?.maps?.Map) {
            const interval = setInterval(() => {
                if (window.google?.maps?.Map) {
                    clearInterval(interval);
                    initMap();
                }
            }, 100);
            return () => clearInterval(interval);
        }
        initMap();

        function initMap() {
            if (mapRef.current) return;

            // Force preserveDrawingBuffer so we can capture the WebGL canvas
            const origGetContext = HTMLCanvasElement.prototype.getContext;
            HTMLCanvasElement.prototype.getContext = function(type, attrs) {
                if (type === "webgl" || type === "webgl2") {
                    attrs = { ...attrs, preserveDrawingBuffer: true };
                }
                return origGetContext.call(this, type, attrs);
            };

            const map = new google.maps.Map(containerRef.current, {
                center: { lat: 40.4168, lng: -3.7038 },
                zoom: 13,
                mapTypeId: satellite ? "satellite" : "roadmap",
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                zoomControl: true,
                gestureHandling: interactionDisabled ? "none" : "cooperative",
                mapId: googleMapsMapId || import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || undefined,
            });

            // Restore original getContext
            HTMLCanvasElement.prototype.getContext = origGetContext;

            mapRef.current = map;
            geocoderRef.current = new google.maps.Geocoder();
            infoWindowRef.current = new google.maps.InfoWindow();

            // Load geometry library for polyline decoding
            google.maps.importLibrary("geometry").catch(() => {});
            google.maps.importLibrary("marker").catch(() => {});
        }
    }, []);

    // Switch map type
    useEffect(() => {
        if (!mapRef.current) return;
        mapRef.current.setMapTypeId(satellite ? "satellite" : "roadmap");
    }, [satellite]);

    // Disable/enable interactions
    useEffect(() => {
        if (!mapRef.current) return;
        mapRef.current.setOptions({
            gestureHandling: interactionDisabled ? "none" : "cooperative",
            draggable: !interactionDisabled,
            zoomControl: !interactionDisabled,
            scrollwheel: !interactionDisabled,
            disableDoubleClickZoom: interactionDisabled,
        });
    }, [interactionDisabled]);

    // ── Helpers ──────────────────────────────────────────────────

    const clearMarkers = useCallback(() => {
        markersRef.current.forEach((m) => {
            if (m.setMap) m.setMap(null);
            else if (m.map) m.map = null;
        });
        markersRef.current = [];
    }, []);

    const clearPolylines = useCallback(() => {
        polylinesRef.current.forEach((p) => p.setMap(null));
        polylinesRef.current = [];
        routeLabelsRef.current.forEach((o) => o.setMap(null));
        routeLabelsRef.current = [];
    }, []);

    const clearPOIs = useCallback(() => {
        poiMarkersRef.current.forEach((m) => {
            if (m.setMap) m.setMap(null);
            else if (m.map) m.map = null;
        });
        poiMarkersRef.current = [];
    }, []);

    const clearAll = useCallback(() => {
        clearMarkers();
        clearPolylines();
        infoWindowRef.current?.close();
    }, [clearMarkers, clearPolylines]);

    function createLabelMarkerContent(letter, bg) {
        const div = document.createElement("div");
        div.style.cssText = `width:28px;height:28px;border-radius:50%;background:${bg};border:3px solid white;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-family:system-ui,sans-serif;`;
        div.textContent = letter;
        return div;
    }

    function createSeconMarkerContent() {
        const div = document.createElement("div");
        div.innerHTML = SECON_MARKER_SVG;
        div.style.cursor = "grab";
        return div;
    }

    function createPoiMarkerContent(emoji) {
        const div = document.createElement("div");
        div.style.cssText = "font-size:18px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.2);border:2px solid #e2e8f0;";
        div.textContent = emoji;
        return div;
    }

    function addMarker(map, position, content, opts = {}) {
        if (google.maps.marker?.AdvancedMarkerElement) {
            return new google.maps.marker.AdvancedMarkerElement({
                map, position, content, ...opts,
            });
        }
        return new google.maps.Marker({ map, position, ...opts });
    }

    // ── Geocoding ────────────────────────────────────────────────

    async function geocodeQuery(query) {
        if (typeof query === "object" && query.lat && query.lng) {
            return { lat: query.lat, lng: query.lng };
        }
        return new Promise((resolve, reject) => {
            geocoderRef.current?.geocode(
                { address: query, language: "es", region: "ES" },
                (results, status) => {
                    if (status === "OK" && results?.[0]) {
                        const loc = results[0].geometry.location;
                        resolve({ lat: loc.lat(), lng: loc.lng() });
                    } else {
                        reject(new Error("Geocode failed"));
                    }
                }
            );
        });
    }

    async function reverseGeocode(lat, lng) {
        return new Promise((resolve) => {
            geocoderRef.current?.geocode(
                { location: { lat, lng }, language: "es" },
                (results, status) => {
                    if (status === "OK" && results?.[0]) {
                        resolve(results[0].formatted_address);
                    } else {
                        resolve(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
                    }
                }
            );
        });
    }

    // ── Route rendering ──────────────────────────────────────────

    const renderRoutes = useCallback((routes, locA, locB, selectedIdx = 0) => {
        const map = mapRef.current;
        if (!map) return;

        cachedRoutesRef.current = { routes, locA, locB, selectedIdx };
        clearAll();

        const bounds = new google.maps.LatLngBounds();

        const ordered = routes.map((r, i) => ({ ...r, idx: i }));
        ordered.sort((a, b) => (a.idx === selectedIdx ? 1 : -1) - (b.idx === selectedIdx ? 1 : -1));

        ordered.forEach((route) => {
            const isPrimary = route.idx === selectedIdx;
            const path = route.decodedPath || [];

            const polyline = new google.maps.Polyline({
                path,
                strokeColor: isPrimary ? "#208DCA" : "#94A3B8",
                strokeWeight: isPrimary ? 6 : 4,
                strokeOpacity: isPrimary ? 0.9 : 0.45,
                zIndex: isPrimary ? 2 : 1,
                map,
            });

            if (!isPrimary) {
                polyline.setOptions({
                    icons: [{
                        icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 },
                        offset: "0",
                        repeat: "14px",
                    }],
                    strokeOpacity: 0,
                });
            }

            polyline.addListener("click", () => {
                if (!isPrimary) {
                    renderRoutes(routes, locA, locB, route.idx);
                    onRouteData?.({ routes, selectedIndex: route.idx });
                }
            });

            polylinesRef.current.push(polyline);

            if (isPrimary) {
                path.forEach((p) => bounds.extend(p));
            }

            // Route label at midpoint
            if (path.length > 0 && route.distanceMeters) {
                const midIdx = Math.floor(path.length / 2);
                const midPoint = path[midIdx];
                const km = (route.distanceMeters / 1000).toFixed(0);
                const mins = Math.round((route.durationSeconds || 0) / 60);
                const hours = Math.floor(mins / 60);
                const timeStr = hours > 0 ? `${hours}h ${mins % 60}min` : `${mins} min`;
                const color = isPrimary ? "#208DCA" : "#94A3B8";

                const labelDiv = document.createElement("div");
                labelDiv.style.cssText = `
                    display:flex;align-items:center;gap:4px;
                    padding:4px 8px;border-radius:12px;
                    background:white;border:2px solid ${color};
                    box-shadow:0 2px 8px rgba(0,0,0,0.15);
                    font-family:system-ui,sans-serif;font-size:11px;font-weight:600;
                    color:${isPrimary ? "#1e293b" : "#64748b"};
                    white-space:nowrap;cursor:pointer;
                    ${!isPrimary ? "opacity:0.8;" : ""}
                `;
                labelDiv.innerHTML = `🚗 ${km} km · ${timeStr}`;

                if (!isPrimary) {
                    labelDiv.addEventListener("click", () => {
                        renderRoutes(routes, locA, locB, route.idx);
                        onRouteData?.({ routes, selectedIndex: route.idx });
                    });
                }

                if (google.maps.marker?.AdvancedMarkerElement) {
                    const label = new google.maps.marker.AdvancedMarkerElement({
                        map,
                        position: midPoint,
                        content: labelDiv,
                        zIndex: isPrimary ? 1500 : 1000,
                    });
                    routeLabelsRef.current.push(label);
                }
            }
        });

        // A/B markers
        markersRef.current.push(
            addMarker(map, locA, createLabelMarkerContent("A", "#253C87"), { zIndex: 2000 }),
            addMarker(map, locB, createLabelMarkerContent("B", "#208DCA"), { zIndex: 2000 }),
        );

        bounds.extend(locA);
        bounds.extend(locB);
        map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });

        // Notify parent with distance/time
        const selected = routes[selectedIdx];
        if (selected.distanceMeters && selected.durationSeconds) {
            const dist = (selected.distanceMeters / 1000).toFixed(1);
            const mins = Math.round(selected.durationSeconds / 60);
            onStatus?.(`${dist} km · ${mins} min en coche`);
        }
        onRouteData?.({ routes, selectedIndex: selectedIdx });
    }, [clearAll, onStatus, onRouteData]);

    // ── Command handler ──────────────────────────────────────────

    useEffect(() => {
        if (!command) return;
        if (prevCommandRef.current === command) return;
        if (!mapRef.current) {
            const t = setTimeout(() => { prevCommandRef.current = null; }, 100);
            return () => clearTimeout(t);
        }
        prevCommandRef.current = command;

        const map = mapRef.current;

        // Select a different route alternative
        if (command.type === "route" && command._selectIdx != null && cachedRoutesRef.current) {
            const { routes, locA, locB } = cachedRoutesRef.current;
            if (routes[command._selectIdx]) {
                renderRoutes(routes, locA, locB, command._selectIdx);
            }
            return;
        }

        if (command.type === "clear") {
            clearAll();
            clearPOIs();
            onStatus?.(null);
            return;
        }

        if (command.type === "search") {
            onStatus?.("loading");

            geocodeQuery(command.query)
                .then(({ lat, lng }) => {
                    clearAll();

                    if (google.maps.marker?.AdvancedMarkerElement) {
                        const content = createSeconMarkerContent();
                        const marker = new google.maps.marker.AdvancedMarkerElement({
                            map,
                            position: { lat, lng },
                            content,
                            gmpDraggable: true,
                            zIndex: 1000,
                        });

                        marker.addListener("dragend", async () => {
                            const pos = marker.position;
                            const newAddress = await reverseGeocode(pos.lat, pos.lng);

                            const infoContent = document.createElement("div");
                            infoContent.style.cssText = "font-family:system-ui;font-size:12px;max-width:260px;";
                            infoContent.innerHTML = `
                                <div style="font-weight:600;margin-bottom:6px;color:#1e293b">${newAddress}</div>
                                <div style="display:flex;gap:6px">
                                    <button id="__gm_use_new" style="flex:1;padding:5px 8px;border-radius:8px;border:none;background:#208DCA;color:white;font-size:11px;font-weight:600;cursor:pointer">Usar esta dirección</button>
                                    <button id="__gm_keep" style="flex:1;padding:5px 8px;border-radius:8px;border:1px solid #e2e8f0;background:white;color:#64748b;font-size:11px;cursor:pointer">Mantener actual</button>
                                </div>
                            `;

                            infoWindowRef.current.setContent(infoContent);
                            infoWindowRef.current.open(map, marker);

                            setTimeout(() => {
                                document.getElementById("__gm_use_new")?.addEventListener("click", () => {
                                    infoWindowRef.current.close();
                                    onMarkerDrag?.({ lat: pos.lat, lng: pos.lng, displayName: newAddress });
                                });
                                document.getElementById("__gm_keep")?.addEventListener("click", () => {
                                    infoWindowRef.current.close();
                                    marker.position = { lat, lng };
                                });
                            }, 50);
                        });

                        markersRef.current.push(marker);
                    } else {
                        const marker = new google.maps.Marker({
                            map, position: { lat, lng }, draggable: true, zIndex: 1000,
                        });
                        markersRef.current.push(marker);
                    }

                    map.setCenter({ lat, lng });
                    map.setZoom(15);
                    onStatus?.(null);
                })
                .catch(() => onStatus?.("error"));
        }

        if (command.type === "route") {
            onStatus?.("loading");

            const resolveA = geocodeQuery(command.a);
            const resolveB = geocodeQuery(command.b);

            Promise.all([resolveA, resolveB])
                .then(async ([locA, locB]) => {
                    try {
                        const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
                        const res = await fetch("/api/route", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Accept": "application/json",
                                "X-CSRF-TOKEN": csrf,
                            },
                            body: JSON.stringify({
                                origin: { lat: locA.lat, lng: locA.lng },
                                destination: { lat: locB.lat, lng: locB.lng },
                            }),
                        });
                        const data = await res.json();
                        const rawRoutes = data.routes || [];

                        if (!rawRoutes.length) {
                            onStatus?.("error");
                            return;
                        }

                        // Decode polylines using google.maps.geometry
                        const decodePolyline = (encoded) => {
                            if (!encoded) return [];
                            try {
                                return google.maps.geometry.encoding.decodePath(encoded);
                            } catch {
                                return [];
                            }
                        };

                        const routes = rawRoutes.map((r) => ({
                            distanceMeters: r.distanceMeters || 0,
                            durationSeconds: parseInt(String(r.duration || "0").replace("s", ""), 10),
                            decodedPath: decodePolyline(r.encodedPolyline),
                            encodedPolyline: r.encodedPolyline || "",
                        }));

                        renderRoutes(routes, locA, locB, 0);
                    } catch (err) {
                        console.error("Route error:", err);
                        onStatus?.("error");
                    }
                })
                .catch(() => onStatus?.("error"));
        }

        if (command.type === "poi") {
            clearPOIs();
            const { lat, lng, categories } = command;
            if (!lat || !lng || !categories?.length) return;

            const params = new URLSearchParams({ lat, lng });
            categories.forEach((c) => params.append("categories[]", c));

            (async () => {
                try {
                    const res = await fetch(`/api/map-pois?${params}`);
                    const pois = await res.json();

                    (pois || []).forEach((poi) => {
                        const marker = addMarker(
                            map,
                            { lat: poi.lat, lng: poi.lng },
                            createPoiMarkerContent(poi.emoji),
                            { title: poi.name }
                        );
                        poiMarkersRef.current.push(marker);
                    });
                } catch {
                    // Silently ignore
                }
            })();
        }
    }, [command, onStatus, onRouteData, onMarkerDrag, renderRoutes, clearAll, clearPOIs, apiKey]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full rounded-xl overflow-hidden"
            style={{ minHeight: 480 }}
        />
    );
});

export default GoogleMap;
