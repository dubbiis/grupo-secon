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

        // Try original address first
        $coords = $this->maps->geocode($address);

        // If not found, try simplified versions (remove s/n, postal code, etc.)
        if (!$coords) {
            $simplified = preg_replace('/\b(s\/n|S\/N)\b/', '', $address);
            $simplified = preg_replace('/\b\d{5}\b/', '', $simplified); // postal code
            $simplified = preg_replace('/[,.\-]+\s*$/', '', trim($simplified));
            $simplified = preg_replace('/\s+/', ' ', trim($simplified));
            if ($simplified !== $address) {
                $coords = $this->maps->geocode($simplified);
            }
        }

        // Last resort: try just city name (last part after comma)
        if (!$coords) {
            $parts = array_map('trim', explode(',', $address));
            if (count($parts) > 1) {
                $coords = $this->maps->geocode(end($parts));
            }
        }

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

    public function transit(Request $request, string $uuid)
    {
        $plan = Plan::where('uuid', $uuid)->with('sections')->firstOrFail();
        $coords = $this->resolveCoords($request, $plan);
        if (!$coords) return response()->json(['error' => 'Dirección no encontrada'], 422);

        $lat = $coords['lat'];
        $lng = $coords['lng'];
        $key = 'maps.transit.' . md5(round($lat, 2) . ',' . round($lng, 2));

        $data = Cache::remember($key, 60 * 60 * 24 * 7, function () use ($lat, $lng) {
            return $this->maps->getTransitOnly($lat, $lng);
        });

        return response()->json(array_merge(['address_used' => $coords['address_used']], $data));
    }

    public function parking(Request $request, string $uuid)
    {
        $plan = Plan::where('uuid', $uuid)->with('sections')->firstOrFail();
        $coords = $this->resolveCoords($request, $plan);
        if (!$coords) return response()->json(['error' => 'Dirección no encontrada'], 422);

        $lat = $coords['lat'];
        $lng = $coords['lng'];
        $key = 'maps.parking_only.' . md5(round($lat, 2) . ',' . round($lng, 2));

        $data = Cache::remember($key, 60 * 60 * 24 * 7, function () use ($lat, $lng) {
            return $this->maps->getParkingOnly($lat, $lng);
        });

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
    /**
     * Parse Spanish address formats to extract street, number, and city.
     * Handles: "Gran Vía 28, Madrid", "C/ Serrano 45", "Paseo de la Castellana, 200, Madrid",
     *          "Calle Alcalá nº 50", "Av. de América 12 28028 Madrid", etc.
     */
    private function parseSpanishAddress(string $q): ?array
    {
        // Normalize: remove nº, n°, num, etc.
        $clean = preg_replace('/\b(n[ºo°]\.?|num\.?|número)\s*/iu', '', $q);
        // Normalize C/, Av/, Pº etc.
        $clean = preg_replace('/\bC\/\s*/iu', 'Calle ', $clean);
        $clean = preg_replace('/\bAv\.?\s*/iu', 'Avenida ', $clean);
        $clean = preg_replace('/\bPº\.?\s*/iu', 'Paseo ', $clean);
        $clean = preg_replace('/\bPl\.?\s*/iu', 'Plaza ', $clean);
        // Remove s/n
        $clean = preg_replace('/\bs\/n\b/iu', '', $clean);
        // Remove postal codes (5 digits alone)
        $clean = preg_replace('/\b\d{5}\b/', '', $clean);
        $clean = preg_replace('/\s+/', ' ', trim($clean));

        // Pattern 1: "Street Name 123, City" or "Street Name 123 City"
        if (preg_match('/^(.+?)\s*[,.]?\s*(\d{1,5})\s*[,.]?\s*(.+)$/u', $clean, $m)) {
            return [
                'street' => trim($m[1]),
                'number' => trim($m[2]),
                'city' => trim($m[3]),
            ];
        }

        // Pattern 2: "Street Name 123" (no city)
        if (preg_match('/^(.+?)\s*[,.]?\s*(\d{1,5})\s*$/u', $clean, $m)) {
            return [
                'street' => trim($m[1]),
                'number' => trim($m[2]),
                'city' => null,
            ];
        }

        return null;
    }

    private function nominatimHeaders(): array
    {
        return ['User-Agent' => 'GrupoSecon/1.0', 'Accept-Language' => 'es'];
    }

    private function formatNominatimResults(array $data): array
    {
        return collect($data)->map(fn($r) => [
            'lat' => (float) $r['lat'],
            'lng' => (float) $r['lon'],
            'name' => explode(',', $r['display_name'])[0],
            'subtitle' => trim(implode(', ', array_slice(explode(',', $r['display_name']), 1, 2))),
            'displayName' => $r['display_name'],
        ])->values()->toArray();
    }

    public function geocodeSearch(Request $request)
    {
        $q = trim($request->input('q', ''));
        if (strlen($q) < 2) return response()->json([]);

        $lat = $request->input('lat');
        $lng = $request->input('lng');

        $cacheKey = 'geocode.' . md5($q . $lat . $lng);
        $cached = Cache::get($cacheKey);
        if ($cached) return response()->json($cached);

        // ── Strategy 1: Structured search if address has a number ──
        $parsed = $this->parseSpanishAddress($q);
        if ($parsed) {
            // Nominatim structured: street expects "number streetname"
            $streetParam = $parsed['number'] . ' ' . $parsed['street'];

            $structParams = [
                'street' => $streetParam,
                'format' => 'json',
                'limit' => 5,
                'addressdetails' => 1,
                'countrycodes' => 'es',
            ];
            if ($parsed['city']) {
                $structParams['city'] = $parsed['city'];
            }
            if ($lat && $lng) {
                $d = 0.5;
                $structParams['viewbox'] = ($lng - $d) . ',' . ($lat - $d) . ',' . ($lng + $d) . ',' . ($lat + $d);
                $structParams['bounded'] = 0;
            }

            try {
                $response = Http::withHeaders($this->nominatimHeaders())
                    ->timeout(4)
                    ->get('https://nominatim.openstreetmap.org/search', $structParams);

                if ($response->successful()) {
                    $data = $response->json() ?? [];
                    if (!empty($data)) {
                        $results = $this->formatNominatimResults($data);
                        Cache::put($cacheKey, $results, 3600);
                        return response()->json($results);
                    }
                }
            } catch (\Throwable) {}

            // Retry without number (find the street, then the user can pin)
            try {
                $fallbackParams = [
                    'street' => $parsed['street'],
                    'format' => 'json',
                    'limit' => 3,
                    'addressdetails' => 1,
                    'countrycodes' => 'es',
                ];
                if ($parsed['city']) $fallbackParams['city'] = $parsed['city'];
                if ($lat && $lng) {
                    $d = 0.5;
                    $fallbackParams['viewbox'] = ($lng - $d) . ',' . ($lat - $d) . ',' . ($lng + $d) . ',' . ($lat + $d);
                    $fallbackParams['bounded'] = 0;
                }

                $response = Http::withHeaders($this->nominatimHeaders())
                    ->timeout(4)
                    ->get('https://nominatim.openstreetmap.org/search', $fallbackParams);

                if ($response->successful()) {
                    $data = $response->json() ?? [];
                    if (!empty($data)) {
                        $results = $this->formatNominatimResults($data);
                        Cache::put($cacheKey, $results, 3600);
                        return response()->json($results);
                    }
                }
            } catch (\Throwable) {}
        }

        // ── Strategy 2: Free-form Nominatim search ──
        try {
            $params = [
                'q' => $q,
                'format' => 'json',
                'limit' => 5,
                'addressdetails' => 1,
                'countrycodes' => 'es',
            ];
            if ($lat && $lng) {
                $d = 0.5;
                $params['viewbox'] = ($lng - $d) . ',' . ($lat - $d) . ',' . ($lng + $d) . ',' . ($lat + $d);
                $params['bounded'] = 0;
            }

            $response = Http::withHeaders($this->nominatimHeaders())
                ->timeout(5)
                ->get('https://nominatim.openstreetmap.org/search', $params);

            if ($response->successful()) {
                $data = $response->json() ?? [];
                if (!empty($data)) {
                    $results = $this->formatNominatimResults($data);
                    Cache::put($cacheKey, $results, 3600);
                    return response()->json($results);
                }
            }
        } catch (\Throwable) {}

        // ── Strategy 3: Free-form WITHOUT countrycodes (international) ──
        try {
            $params = ['q' => $q, 'format' => 'json', 'limit' => 5, 'addressdetails' => 1];
            if ($lat && $lng) {
                $d = 0.5;
                $params['viewbox'] = ($lng - $d) . ',' . ($lat - $d) . ',' . ($lng + $d) . ',' . ($lat + $d);
                $params['bounded'] = 0;
            }

            $response = Http::withHeaders($this->nominatimHeaders())
                ->timeout(5)
                ->get('https://nominatim.openstreetmap.org/search', $params);

            if ($response->successful()) {
                $data = $response->json() ?? [];
                if (!empty($data)) {
                    $results = $this->formatNominatimResults($data);
                    Cache::put($cacheKey, $results, 3600);
                    return response()->json($results);
                }
            }
        } catch (\Throwable) {}

        // ── Strategy 4: Photon (komoot) — better fuzzy matching ──
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
                        $f['properties']['housenumber'] ?? null,
                        $f['properties']['city'] ?? null,
                        $f['properties']['state'] ?? null,
                    ])),
                ])->values()->toArray();

                if (!empty($results)) {
                    Cache::put($cacheKey, $results, 3600);
                    return response()->json($results);
                }
            }
        } catch (\Throwable) {}

        return response()->json([]);
    }
}
