import { useEffect, useRef, useCallback, useState } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";

const LIBRARIES = ["places", "routes", "geocoding"];
const DEFAULT_CENTER = { lat: 40.4168, lng: -3.7038 };
const DEFAULT_ZOOM = 13;

function labelIcon(letter, bg) {
    const svg = encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">` +
        `<circle cx="16" cy="16" r="14" fill="${bg}" stroke="white" stroke-width="3"/>` +
        `<text x="16" y="21" text-anchor="middle" fill="white" font-size="13" font-weight="bold" font-family="system-ui,sans-serif">${letter}</text>` +
        `</svg>`
    );
    return {
        url: `data:image/svg+xml,${svg}`,
        scaledSize: { width: 32, height: 32 },
        anchor: { x: 16, y: 16 },
    };
}

function poiIconUrl(emoji) {
    const canvas = document.createElement("canvas");
    canvas.width = 36;
    canvas.height = 36;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.arc(18, 18, 16, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = "18px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emoji, 18, 19);
    return canvas.toDataURL();
}

/**
 * Google Maps replacement for LeafletMap.
 * Same command interface: search, route, poi, clear
 */
export default function GoogleMapView({ command, onStatus, onRouteData, onMarkerDrag, interactionDisabled }) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: apiKey,
        libraries: LIBRARIES,
    });

    const mapRef = useRef(null);
    const markersRef = useRef([]);
    const routeRenderersRef = useRef([]);
    const poiMarkersRef = useRef([]);
    const prevCommandRef = useRef(null);
    const cachedRoutesRef = useRef(null);
    const directionsServiceRef = useRef(null);
    const geocoderRef = useRef(null);
    const infoWindowRef = useRef(null);

    const onLoad = useCallback((map) => {
        mapRef.current = map;
        directionsServiceRef.current = new google.maps.DirectionsService();
        geocoderRef.current = new google.maps.Geocoder();
        infoWindowRef.current = new google.maps.InfoWindow();
    }, []);

    // ── Helpers ──

    const clearMarkers = useCallback(() => {
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];
    }, []);

    const clearRoutes = useCallback(() => {
        routeRenderersRef.current.forEach((r) => r.setMap(null));
        routeRenderersRef.current = [];
        clearMarkers();
    }, [clearMarkers]);

    const clearPOIs = useCallback(() => {
        poiMarkersRef.current.forEach((m) => m.setMap(null));
        poiMarkersRef.current = [];
    }, []);

    const reverseGeocode = useCallback(async (latLng) => {
        if (!geocoderRef.current) return null;
        try {
            const result = await geocoderRef.current.geocode({ location: latLng });
            return result.results?.[0]?.formatted_address || null;
        } catch {
            return null;
        }
    }, []);

    const geocodeAddress = useCallback(async (address) => {
        if (!geocoderRef.current) throw new Error("Geocoder not ready");
        const result = await geocoderRef.current.geocode({ address });
        const loc = result.results?.[0]?.geometry?.location;
        if (!loc) throw new Error("No encontrado");
        return { lat: loc.lat(), lng: loc.lng() };
    }, []);

    // ── Route rendering ──

    const renderRoutes = useCallback((routes, locA, locB, selectedIdx = 0) => {
        const map = mapRef.current;
        if (!map) return;

        cachedRoutesRef.current = { routes, locA, locB };
        clearRoutes();

        const bounds = new google.maps.LatLngBounds();

        routes.forEach((route, i) => {
            const isPrimary = i === selectedIdx;
            const renderer = new google.maps.DirectionsRenderer({
                map,
                directions: route._directionsResult,
                routeIndex: route._routeIndex ?? 0,
                suppressMarkers: true,
                preserveViewport: true,
                polylineOptions: {
                    strokeColor: isPrimary ? "#208DCA" : "#94A3B8",
                    strokeWeight: isPrimary ? 6 : 4,
                    strokeOpacity: isPrimary ? 0.9 : 0.45,
                    zIndex: isPrimary ? 10 : 1,
                },
            });

            // Click alternative to select it
            google.maps.event.addListener(renderer, "click", () => {
                if (!isPrimary) {
                    renderRoutes(routes, locA, locB, i);
                    onRouteData?.({ routes, selectedIndex: i });
                }
            });

            routeRenderersRef.current.push(renderer);

            if (isPrimary && route._directionsResult?.routes?.[route._routeIndex ?? 0]) {
                const legs = route._directionsResult.routes[route._routeIndex ?? 0].legs;
                legs.forEach((leg) => {
                    leg.steps.forEach((step) => {
                        bounds.extend(step.start_location);
                        bounds.extend(step.end_location);
                    });
                });
            }
        });

        // Endpoint markers
        const markerA = new google.maps.Marker({
            position: locA,
            map,
            icon: labelIcon("A", "#253C87"),
            zIndex: 2000,
        });
        const markerB = new google.maps.Marker({
            position: locB,
            map,
            icon: labelIcon("B", "#208DCA"),
            zIndex: 2000,
        });
        markersRef.current.push(markerA, markerB);

        if (!bounds.isEmpty()) map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });

        // Status
        const selected = routes[selectedIdx];
        const dist = (selected.distance / 1000).toFixed(1);
        const mins = Math.round(selected.duration / 60);
        onStatus?.(`${dist} km · ${mins} min en coche`);
        onRouteData?.({ routes, selectedIndex: selectedIdx });
    }, [clearRoutes, onStatus, onRouteData]);

    // ── Command handler ──

    useEffect(() => {
        if (!command || !mapRef.current || !isLoaded) return;
        if (prevCommandRef.current === command) return;
        prevCommandRef.current = command;

        const map = mapRef.current;

        // Select different route (cached)
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
                ? geocodeAddress(command.query)
                : Promise.resolve(command.query);

            doSearch.then(({ lat, lng }) => {
                clearRoutes();
                const position = { lat, lng };

                const marker = new google.maps.Marker({
                    position,
                    map,
                    draggable: true,
                    zIndex: 2000,
                });

                // Tooltip on hover
                const tooltip = new google.maps.InfoWindow({
                    content: `<span style="font-size:12px;font-family:system-ui">Arrastra la chincheta al lugar exacto</span>`,
                });
                tooltip.open(map, marker);
                setTimeout(() => tooltip.close(), 3000);

                marker.addListener("dragend", async () => {
                    const pos = marker.getPosition();
                    const newLat = pos.lat();
                    const newLng = pos.lng();

                    const address = await reverseGeocode({ lat: newLat, lng: newLng });
                    const displayAddress = address || `${newLat.toFixed(5)}, ${newLng.toFixed(5)}`;

                    const infoWindow = infoWindowRef.current;
                    infoWindow.setContent(`
                        <div style="font-family:system-ui;font-size:12px;max-width:260px">
                            <div style="font-weight:600;margin-bottom:6px;color:#1e293b">${displayAddress}</div>
                            <div style="display:flex;gap:6px">
                                <button id="gmv-use-new" style="flex:1;padding:5px 8px;border-radius:8px;border:none;background:#208DCA;color:white;font-size:11px;font-weight:600;cursor:pointer">Usar esta dirección</button>
                                <button id="gmv-keep" style="flex:1;padding:5px 8px;border-radius:8px;border:1px solid #e2e8f0;background:white;color:#64748b;font-size:11px;cursor:pointer">Mantener actual</button>
                            </div>
                        </div>
                    `);
                    infoWindow.open(map, marker);

                    google.maps.event.addListenerOnce(infoWindow, "domready", () => {
                        document.getElementById("gmv-use-new")?.addEventListener("click", () => {
                            infoWindow.close();
                            onMarkerDrag?.({ lat: newLat, lng: newLng, displayName: displayAddress });
                        });
                        document.getElementById("gmv-keep")?.addEventListener("click", () => {
                            infoWindow.close();
                            marker.setPosition(position);
                        });
                    });
                });

                markersRef.current.push(marker);
                map.setCenter(position);
                map.setZoom(15);
                onStatus?.(null);
            }).catch(() => onStatus?.("error"));
        }

        if (command.type === "route") {
            onStatus?.("loading");

            const resolveA = typeof command.a === "string" ? geocodeAddress(command.a) : Promise.resolve(command.a);
            const resolveB = typeof command.b === "string" ? geocodeAddress(command.b) : Promise.resolve(command.b);

            Promise.all([resolveA, resolveB]).then(([locA, locB]) => {
                directionsServiceRef.current.route(
                    {
                        origin: locA,
                        destination: locB,
                        travelMode: google.maps.TravelMode.DRIVING,
                        provideRouteAlternatives: true,
                    },
                    (result, status) => {
                        if (status !== "OK" || !result.routes?.length) {
                            onStatus?.("error");
                            return;
                        }

                        const routes = result.routes.map((r, idx) => ({
                            distance: r.legs.reduce((sum, l) => sum + l.distance.value, 0),
                            duration: r.legs.reduce((sum, l) => sum + l.duration.value, 0),
                            geometry: {
                                type: "LineString",
                                coordinates: r.overview_path.map((p) => [p.lng(), p.lat()]),
                            },
                            _directionsResult: result,
                            _routeIndex: idx,
                        }));

                        renderRoutes(routes, locA, locB, 0);
                    }
                );
            }).catch(() => onStatus?.("error"));
        }

        if (command.type === "poi") {
            clearPOIs();
            const { lat, lng, categories } = command;
            if (!lat || !lng || !categories?.length) return;

            // Use existing backend endpoint (Overpass cached)
            const params = new URLSearchParams({ lat, lng });
            categories.forEach((c) => params.append("categories[]", c));

            fetch(`/api/map-pois?${params}`)
                .then((r) => r.json())
                .then((pois) => {
                    (pois || []).forEach((poi) => {
                        const m = new google.maps.Marker({
                            position: { lat: poi.lat, lng: poi.lng },
                            map,
                            icon: {
                                url: poiIconUrl(poi.emoji),
                                scaledSize: new google.maps.Size(32, 32),
                                anchor: new google.maps.Point(16, 16),
                            },
                            title: poi.name,
                        });
                        poiMarkersRef.current.push(m);
                    });
                })
                .catch(() => {});
        }
    }, [command, isLoaded, onStatus, onRouteData, onMarkerDrag, renderRoutes, clearRoutes, clearPOIs, geocodeAddress, reverseGeocode]);

    // Disable interactions when capturing
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        map.setOptions({
            draggable: !interactionDisabled,
            zoomControl: !interactionDisabled,
            scrollwheel: !interactionDisabled,
            disableDoubleClickZoom: interactionDisabled,
        });
    }, [interactionDisabled]);

    if (!isLoaded) {
        return (
            <div className="w-full h-full rounded-xl overflow-hidden flex items-center justify-center bg-slate-100" style={{ minHeight: 480 }}>
                <span className="text-sm text-slate-400 animate-pulse">Cargando Google Maps...</span>
            </div>
        );
    }

    return (
        <GoogleMap
            mapContainerClassName="w-full h-full rounded-xl overflow-hidden"
            mapContainerStyle={{ minHeight: 480 }}
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            onLoad={onLoad}
            options={{
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: true,
                mapTypeControlOptions: {
                    position: google.maps.ControlPosition.TOP_RIGHT,
                    style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                },
                fullscreenControl: false,
                scrollwheel: false,
                gestureHandling: "cooperative",
                styles: [
                    { featureType: "poi.business", stylers: [{ visibility: "off" }] },
                ],
            }}
        />
    );
}
