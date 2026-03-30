import { APIProvider } from "@vis.gl/react-google-maps";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

export default function GoogleMapsProvider({ children }) {
    if (!API_KEY) {
        console.warn("GoogleMapsProvider: VITE_GOOGLE_MAPS_API_KEY not set");
        return children;
    }

    return (
        <APIProvider apiKey={API_KEY} language="es" region="ES">
            {children}
        </APIProvider>
    );
}
