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

    private function formatPhotonResults(array $features): array
    {
        return collect($features)->map(function ($f) {
            $props = $f['properties'] ?? [];
            $street = $props['street'] ?? '';
            $number = $props['housenumber'] ?? '';
            $name   = $props['name'] ?? '';
            $city   = $props['city'] ?? $props['county'] ?? '';
            $state  = $props['state'] ?? '';

            // Build a readable display name like Google does
            $mainPart = $name ?: ($street ? trim("{$street} {$number}") : '');
            $locationParts = array_filter([$city, $state]);

            return [
                'lat' => $f['geometry']['coordinates'][1] ?? 0,
                'lng' => $f['geometry']['coordinates'][0] ?? 0,
                'name' => $mainPart ?: $city,
                'subtitle' => implode(', ', $locationParts),
                'displayName' => implode(', ', array_filter([$mainPart, ...$locationParts])),
            ];
        })->filter(fn($r) => $r['lat'] && $r['lng'] && $r['name'])
          ->values()
          ->toArray();
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

        // ── Strategy 1: Photon (Elasticsearch-based, best fuzzy matching) ──
        // Works like Google: handles any format, typos, abbreviations, house numbers
        try {
            $params = ['q' => $q, 'limit' => 6, 'lang' => 'es'];
            if ($lat && $lng) {
                $params['lat'] = $lat;
                $params['lon'] = $lng;
            }

            $response = Http::withHeaders(['User-Agent' => 'GrupoSecon/1.0'])
                ->timeout(4)
                ->get('https://photon.komoot.io/api/', $params);

            if ($response->successful()) {
                $features = $response->json()['features'] ?? [];
                $results = $this->formatPhotonResults($features);
                if (!empty($results)) {
                    Cache::put($cacheKey, $results, 3600);
                    return response()->json($results);
                }
            }
        } catch (\Throwable) {}

        // ── Strategy 2: Nominatim free-form (precise, good for exact addresses) ──
        try {
            $params = [
                'q' => $q,
                'format' => 'json',
                'limit' => 5,
                'addressdetails' => 1,
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

        return response()->json([]);
    }
}
