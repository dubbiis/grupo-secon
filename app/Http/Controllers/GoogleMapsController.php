<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Services\GoogleMapsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

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
     * POIs for map overlay — uses cached backend Overpass queries
     */
    public function mapPOIs(Request $request)
    {
        $lat = (float) $request->input('lat');
        $lng = (float) $request->input('lng');
        $categories = $request->input('categories', []);

        if (!$lat || !$lng || empty($categories)) {
            return response()->json([]);
        }

        $pois = $this->maps->getMapPOIs($lat, $lng, $categories);
        return response()->json($pois);
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

        // Cache for 1 hour — same query = instant
        $cacheKey = 'geocode.' . md5($q . $lat . $lng);
        $cached = Cache::get($cacheKey);
        if ($cached) return response()->json($cached);

        // Try structured search first if query looks like "street number, city"
        if (preg_match('/^(.+?)\s+(\d+)\s*[,.]?\s*(.+)$/u', $q, $m)) {
            try {
                $structParams = [
                    'street' => trim($m[2] . ' ' . $m[1]),
                    'city' => trim($m[3]),
                    'country' => 'Spain',
                    'format' => 'json',
                    'limit' => 3,
                    'addressdetails' => 1,
                ];
                $structResponse = Http::withHeaders([
                    'User-Agent' => 'GrupoSecon/1.0',
                    'Accept-Language' => 'es',
                ])->timeout(4)->get('https://nominatim.openstreetmap.org/search', $structParams);

                if ($structResponse->successful()) {
                    $structData = $structResponse->json() ?? [];
                    if (!empty($structData)) {
                        $results = collect($structData)->map(fn($r) => [
                            'lat' => (float) $r['lat'],
                            'lng' => (float) $r['lon'],
                            'name' => explode(',', $r['display_name'])[0],
                            'subtitle' => trim(implode(', ', array_slice(explode(',', $r['display_name']), 1, 2))),
                            'displayName' => $r['display_name'],
                        ])->values()->toArray();
                        Cache::put($cacheKey, $results, 3600);
                        return response()->json($results);
                    }
                }
            } catch (\Throwable $e) {}
        }

        // Fallback: free-form Nominatim search
        try {
            $params = ['q' => $q, 'format' => 'json', 'limit' => 5, 'addressdetails' => 1];
            if ($lat && $lng) {
                $d = 0.5;
                $params['viewbox'] = ($lng - $d) . ',' . ($lat - $d) . ',' . ($lng + $d) . ',' . ($lat + $d);
                $params['bounded'] = 0;
            }

            $response = Http::withHeaders([
                'User-Agent' => 'GrupoSecon/1.0',
                'Accept-Language' => 'es',
            ])->timeout(5)->get('https://nominatim.openstreetmap.org/search', $params);

            if ($response->successful()) {
                $data = $response->json() ?? [];
                $results = collect($data)->map(fn($r) => [
                    'lat' => (float) $r['lat'],
                    'lng' => (float) $r['lon'],
                    'name' => explode(',', $r['display_name'])[0],
                    'subtitle' => trim(implode(', ', array_slice(explode(',', $r['display_name']), 1, 2))),
                    'displayName' => $r['display_name'],
                ])->values()->toArray();

                if (!empty($results)) {
                    Cache::put($cacheKey, $results, 3600);
                    return response()->json($results);
                }
            }
        } catch (\Throwable $e) {}

        // Fallback: Photon
        try {
            $params = ['q' => $q, 'limit' => 5, 'lang' => 'default'];
            if ($lat && $lng) {
                $params['lat'] = $lat;
                $params['lon'] = $lng;
            }

            $response = Http::withHeaders(['User-Agent' => 'GrupoSecon/1.0'])
                ->timeout(4)
                ->get('https://photon.komoot.io/api/', $params);

            if ($response->successful()) {
                $data = $response->json();
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
                ])->values()->toArray();

                if (!empty($results)) {
                    Cache::put($cacheKey, $results, 3600);
                    return response()->json($results);
                }
            }
        } catch (\Throwable $e) {}

        return response()->json([]);
    }
}
