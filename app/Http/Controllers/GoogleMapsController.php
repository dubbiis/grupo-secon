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
    // ── CartoCiudad (gobierno de España, portales exactos) ────────

    private const CARTO_BASE = 'https://www.cartociudad.es/geocoder/api/geocoder';

    /**
     * Autocomplete via CartoCiudad — returns candidates with portal-level precision.
     * Filters out municipalities/provinces/etc to focus on streets and portals.
     */
    private function searchCartoCiudad(string $query): array
    {
        $response = Http::withHeaders(['User-Agent' => 'GrupoSecon/1.0'])
            ->timeout(4)
            ->get(self::CARTO_BASE . '/candidatesJsonp', [
                'q' => $query,
                'limit' => 8,
                'countrycodes' => 'es',
                'no_process' => 'municipio,provincia,comunidad autonoma,poblacion,toponimo,expendeduria,punto_recarga_electrica,ngbe,carretera',
            ]);

        if (!$response->successful()) return [];

        // CartoCiudad may return JSONP — strip callback wrapper if present
        $body = $response->body();
        if (!str_starts_with(trim($body), '[') && !str_starts_with(trim($body), '{')) {
            if (preg_match('/\((.+)\)\s*;?\s*$/s', $body, $m)) {
                $body = $m[1];
            }
        }
        $items = json_decode($body, true);
        if (!is_array($items)) return [];

        // Score: portals > streets, with number > without
        usort($items, function ($a, $b) {
            $scoreA = ($a['type'] === 'portal' ? 100 : 0) + (($a['portalNumber'] ?? '') ? 50 : 0);
            $scoreB = ($b['type'] === 'portal' ? 100 : 0) + (($b['portalNumber'] ?? '') ? 50 : 0);
            return $scoreB - $scoreA;
        });

        return collect($items)
            ->filter(fn($item) => in_array($item['type'] ?? '', ['portal', 'callejero']))
            ->take(6)
            ->map(function ($item) {
                $address = $item['address'] ?? $item['nombre'] ?? $item['name'] ?? '';
                $muni = $item['muni'] ?? '';
                $province = $item['province'] ?? '';
                $portal = $item['portalNumber'] ?? '';
                $type = $item['type'] ?? '';

                $name = $address;
                $subtitle = implode(', ', array_filter([$muni, $province]));
                $displayName = $subtitle && !str_contains($address, $subtitle)
                    ? "{$address}, {$subtitle}"
                    : $address;

                // Portal candidates have lat/lng directly
                $lat = isset($item['lat']) ? (float) $item['lat'] : null;
                $lng = isset($item['lng']) ? (float) $item['lng'] : null;

                // If no direct coords, try findJsonp to resolve
                if (!$lat || !$lng) {
                    $resolved = $this->resolveCartoCiudad($item);
                    if ($resolved) {
                        $lat = $resolved['lat'];
                        $lng = $resolved['lng'];
                    }
                }

                if (!$lat || !$lng) return null;

                return [
                    'lat' => $lat,
                    'lng' => $lng,
                    'name' => $name,
                    'subtitle' => $subtitle,
                    'displayName' => $displayName,
                ];
            })
            ->filter()
            ->values()
            ->toArray();
    }

    /**
     * Resolve a CartoCiudad candidate to exact coordinates via findJsonp.
     */
    private function resolveCartoCiudad(array $item): ?array
    {
        $id = $item['id'] ?? null;
        $type = $item['type'] ?? null;
        if (!$id || !$type) return null;

        try {
            $params = ['id' => $id, 'type' => $type, 'outputformat' => 'geojson'];
            if ($type === 'callejero' && !empty($item['portalNumber'])) {
                $params['portal'] = $item['portalNumber'];
            }

            $response = Http::withHeaders(['User-Agent' => 'GrupoSecon/1.0'])
                ->timeout(4)
                ->get(self::CARTO_BASE . '/findJsonp', $params);

            if (!$response->successful()) return null;

            $body = $response->body();
            if (!str_starts_with(trim($body), '{') && !str_starts_with(trim($body), '[')) {
                if (preg_match('/\((.+)\)\s*;?\s*$/s', $body, $m)) {
                    $body = $m[1];
                }
            }
            $data = json_decode($body, true);
            if (!$data) return null;

            // GeoJSON FeatureCollection or Feature
            if (($data['type'] ?? '') === 'FeatureCollection') {
                $coords = $data['features'][0]['geometry']['coordinates'] ?? null;
            } elseif (($data['type'] ?? '') === 'Feature') {
                $coords = $data['geometry']['coordinates'] ?? null;
            } else {
                return null;
            }

            if (!$coords || !is_array($coords)) return null;

            // GeoJSON is [lng, lat]
            return ['lat' => (float) $coords[1], 'lng' => (float) $coords[0]];
        } catch (\Throwable) {
            return null;
        }
    }

    // ── Photon (Elasticsearch fuzzy, international) ────────

    private function searchPhoton(string $query, ?float $lat = null, ?float $lng = null): array
    {
        $params = ['q' => $query, 'limit' => 6, 'lang' => 'es'];
        if ($lat && $lng) {
            $params['lat'] = $lat;
            $params['lon'] = $lng;
        }

        $response = Http::withHeaders(['User-Agent' => 'GrupoSecon/1.0'])
            ->timeout(4)
            ->get('https://photon.komoot.io/api/', $params);

        if (!$response->successful()) return [];

        return collect($response->json()['features'] ?? [])->map(function ($f) {
            $props = $f['properties'] ?? [];
            $street = $props['street'] ?? '';
            $number = $props['housenumber'] ?? '';
            $name   = $props['name'] ?? '';
            $city   = $props['city'] ?? $props['county'] ?? '';
            $state  = $props['state'] ?? '';

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

    // ── geocodeSearch endpoint ────────

    public function geocodeSearch(Request $request)
    {
        $q = trim($request->input('q', ''));
        if (strlen($q) < 2) return response()->json([]);

        $lat = $request->input('lat') ? (float) $request->input('lat') : null;
        $lng = $request->input('lng') ? (float) $request->input('lng') : null;

        $cacheKey = 'geocode.' . md5($q . $lat . $lng);
        $cached = Cache::get($cacheKey);
        if ($cached) return response()->json($cached);

        // ── 1. CartoCiudad (Spain, portal-level precision) ──
        try {
            $results = $this->searchCartoCiudad($q);
            if (!empty($results)) {
                Cache::put($cacheKey, $results, 3600);
                return response()->json($results);
            }
        } catch (\Throwable $e) {
            \Log::debug('CartoCiudad failed', ['error' => $e->getMessage()]);
        }

        // ── 2. Photon (international, fuzzy matching) ──
        try {
            $results = $this->searchPhoton($q, $lat, $lng);
            if (!empty($results)) {
                Cache::put($cacheKey, $results, 3600);
                return response()->json($results);
            }
        } catch (\Throwable) {}

        return response()->json([]);
    }
}
