import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix bundler icon resolution issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const OSRM      = "https://router.project-osrm.org/route/v1/driving";
const UA        = "GrupoSecon/1.0";

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
        html: `<div style="width:28px;height:28px;border-radius:50%;background:${bg};border:3px solid white;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,0.5);font-family:Arial,sans-serif">${letter}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    });
}

/**
 * command prop:
 *   { type: "search", query: "..." }
 *   { type: "route",  a: "...", b: "..." }
 *   null → do nothing
 */
export default function LeafletMap({ command, onStatus }) {
    const containerRef  = useRef(null);
    const mapRef        = useRef(null);
    const markersRef    = useRef([]);
    const routeRef      = useRef(null);
    const prevCommandRef = useRef(null);

    // Init Leaflet map once
    useEffect(() => {
        if (mapRef.current || !containerRef.current) return;

        mapRef.current = L.map(containerRef.current, { zoomControl: true })
            .setView([40.4168, -3.7038], 13);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
            maxZoom: 19,
        }).addTo(mapRef.current);

        return () => {
            mapRef.current?.remove();
            mapRef.current = null;
        };
    }, []);

    // React to commands
    useEffect(() => {
        if (!command || !mapRef.current) return;
        // Avoid re-running the same command
        if (prevCommandRef.current === command) return;
        prevCommandRef.current = command;

        const map = mapRef.current;

        const clearAll = () => {
            markersRef.current.forEach(m => m.remove());
            markersRef.current = [];
            if (routeRef.current) { routeRef.current.remove(); routeRef.current = null; }
        };

        if (command.type === "search") {
            onStatus?.("loading");
            geocode(command.query)
                .then(({ lat, lng }) => {
                    clearAll();
                    markersRef.current.push(L.marker([lat, lng]).addTo(map));
                    map.setView([lat, lng], 15);
                    onStatus?.(null);
                })
                .catch(() => onStatus?.("error"));
        }

        if (command.type === "route") {
            onStatus?.("loading");
            Promise.all([geocode(command.a), geocode(command.b)])
                .then(async ([locA, locB]) => {
                    const res  = await fetch(
                        `${OSRM}/${locA.lng},${locA.lat};${locB.lng},${locB.lat}?geometries=geojson&overview=full`
                    );
                    const data = await res.json();
                    if (data.code !== "Ok") throw new Error();

                    const route = data.routes[0];
                    const dist  = (route.legs[0].distance / 1000).toFixed(1);
                    const mins  = Math.round(route.legs[0].duration / 60);

                    clearAll();

                    routeRef.current = L.geoJSON(route.geometry, {
                        style: { color: "#208DCA", weight: 5, opacity: 0.85 },
                    }).addTo(map);

                    markersRef.current.push(
                        L.marker([locA.lat, locA.lng], { icon: labelIcon("A", "#253C87") }).addTo(map),
                        L.marker([locB.lat, locB.lng], { icon: labelIcon("B", "#208DCA") }).addTo(map),
                    );

                    map.fitBounds(routeRef.current.getBounds(), { padding: [24, 24] });
                    onStatus?.(`${dist} km · ${mins} min en coche`);
                })
                .catch(() => onStatus?.("error"));
        }
    }, [command, onStatus]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full rounded-xl overflow-hidden"
            style={{ minHeight: 480 }}
        />
    );
}
