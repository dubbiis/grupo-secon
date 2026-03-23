<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Services\GoogleMapsService;
use Illuminate\Http\Request;

class GoogleMapsController extends Controller
{
    public function __construct(private GoogleMapsService $maps) {}

    private function resolveCoords(Request $request, Plan $plan): ?array
    {
        // Priority: address from request body → section 1 form_data
        $address = trim($request->input('address', ''));

        if (!$address) {
            $sec1    = $plan->getSectionByNumber(1);
            $address = $sec1?->form_data['direccion_evento'] ?? '';
        }

        if (!$address) return null;

        $coords = $this->maps->geocode($address);
        if (!$coords) return null;

        return array_merge($coords, ['address_used' => $address]);
    }

    public function transporte(Request $request, string $uuid)
    {
        $plan   = Plan::where('uuid', $uuid)->with('sections')->firstOrFail();
        $coords = $this->resolveCoords($request, $plan);

        if (!$coords) {
            return response()->json([
                'error' => 'No se encontró la dirección del evento. Completa la sección 1 primero o escribe la dirección manualmente.',
            ], 422);
        }

        $data = $this->maps->getTransportData($coords['lat'], $coords['lng']);

        return response()->json(array_merge(['address_used' => $coords['address_used']], $data));
    }

    public function emergencia(Request $request, string $uuid)
    {
        $plan   = Plan::where('uuid', $uuid)->with('sections')->firstOrFail();
        $coords = $this->resolveCoords($request, $plan);

        if (!$coords) {
            return response()->json([
                'error' => 'No se encontró la dirección del evento. Completa la sección 1 primero o escribe la dirección manualmente.',
            ], 422);
        }

        $data = $this->maps->getEmergencyData($coords['lat'], $coords['lng']);

        return response()->json(array_merge(['address_used' => $coords['address_used']], $data));
    }

    /**
     * Proxy for Photon/Nominatim geocoding autocomplete (avoids CORS in production)
     */
    public function geocodeSearch(Request $request)
    {
        $q = trim($request->input('q', ''));
        if (strlen($q) < 2) return response()->json([]);

        $lat = $request->input('lat');
        $lng = $request->input('lng');

        // Try Photon first (faster for autocomplete)
        try {
            $params = ['q' => $q, 'limit' => 5, 'lang' => 'default'];
            if ($lat && $lng) {
                $params['lat'] = $lat;
                $params['lon'] = $lng;
            }
            $url = 'https://photon.komoot.io/api/?' . http_build_query($params);
            $response = @file_get_contents($url, false, stream_context_create([
                'http' => ['timeout' => 3, 'header' => "User-Agent: GrupoSecon/1.0\r\n"],
            ]));
            if ($response) {
                $data = json_decode($response, true);
                $results = collect($data['features'] ?? [])->map(fn($f) => [
                    'lat' => $f['geometry']['coordinates'][1] ?? 0,
                    'lng' => $f['geometry']['coordinates'][0] ?? 0,
                    'name' => $f['properties']['name'] ?? $f['properties']['street'] ?? '',
                    'subtitle' => implode(', ', array_filter([
                        $f['properties']['city'] ?? null,
                        $f['properties']['state'] ?? null,
                        $f['properties']['country'] ?? null,
                    ])),
                    'displayName' => implode(', ', array_filter([
                        $f['properties']['name'] ?? null,
                        $f['properties']['street'] ?? null,
                        $f['properties']['city'] ?? null,
                        $f['properties']['state'] ?? null,
                        $f['properties']['country'] ?? null,
                    ])),
                ])->values();

                if ($results->isNotEmpty()) return response()->json($results);
            }
        } catch (\Throwable $e) {}

        // Fallback: Nominatim
        try {
            $params = ['q' => $q, 'format' => 'json', 'limit' => 5, 'addressdetails' => 1];
            if ($lat && $lng) {
                $d = 0.5;
                $params['viewbox'] = ($lng - $d) . ',' . ($lat - $d) . ',' . ($lng + $d) . ',' . ($lat + $d);
                $params['bounded'] = 0;
            }
            $url = 'https://nominatim.openstreetmap.org/search?' . http_build_query($params);
            $response = file_get_contents($url, false, stream_context_create([
                'http' => ['timeout' => 5, 'header' => "User-Agent: GrupoSecon/1.0\r\nAccept-Language: es\r\n"],
            ]));
            $data = json_decode($response, true) ?? [];

            return response()->json(collect($data)->map(fn($r) => [
                'lat' => (float) $r['lat'],
                'lng' => (float) $r['lon'],
                'name' => explode(',', $r['display_name'])[0],
                'subtitle' => implode(', ', array_slice(explode(',', $r['display_name']), 1, 2)),
                'displayName' => $r['display_name'],
            ])->values());
        } catch (\Throwable $e) {
            return response()->json([]);
        }
    }
}
