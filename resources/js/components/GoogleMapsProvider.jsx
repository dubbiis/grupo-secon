import { APIProvider } from "@vis.gl/react-google-maps";
import { usePage } from "@inertiajs/react";

export default function GoogleMapsProvider({ children }) {
    const { googleMapsApiKey } = usePage().props;
    const apiKey = googleMapsApiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

    if (!apiKey) {
        console.warn("GoogleMapsProvider: API key not available");
        return children;
    }

    return (
        <APIProvider apiKey={apiKey} language="es" region="ES">
            {children}
        </APIProvider>
    );
}
