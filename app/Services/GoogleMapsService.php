<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class GoogleMapsService
{
    private string $userAgent = 'GrupoSecon/1.0 (planes-seguridad)';

    // ── Geocoding (Nominatim) ─────────────────────────────────────

    public function geocode(string $address): ?array
    {
        $key = 'maps.geocode.' . md5($address);
        $cached = Cache::get($key);
        if ($cached !== null) return $cached;

        try {
            $response = Http::withHeaders([
                'User-Agent'      => $this->userAgent,
                'Accept-Language' => 'es',
            ])->timeout(10)->get('https://nominatim.openstreetmap.org/search', [
                'q'      => $address,
                'format' => 'json',
                'limit'  => 1,
            ]);

            $data = $response->json();
            if (empty($data)) return null;

            $result = [
                'lat'          => (float) $data[0]['lat'],
                'lng'          => (float) $data[0]['lon'],
                'display_name' => $data[0]['display_name'],
            ];

            Cache::put($key, $result, 60 * 60 * 24 * 30);
            return $result;
        } catch (\Exception) {
            return null;
        }
    }

    // ── Overpass API (places nearby) ─────────────────────────────

    private const OVERPASS_MIRRORS = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://overpass.private.coffee/api/interpreter',
    ];

    private function overpassRequest(string $query): array
    {
        foreach (self::OVERPASS_MIRRORS as $mirror) {
            try {
                $response = Http::withHeaders(['User-Agent' => $this->userAgent])
                    ->timeout(12)
                    ->asForm()
                    ->post($mirror, ['data' => $query]);

                if ($response->successful()) {
                    return $response->json()['elements'] ?? [];
                }
            } catch (\Exception) {
                // Try next mirror
            }
        }
        return [];
    }

    private function haversineKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $r = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        return $r * 2 * asin(sqrt($a));
    }

    private function formatDistanceKm(float $lat1, float $lng1, float $lat2, float $lng2): string
    {
        $km = $this->haversineKm($lat1, $lng1, $lat2, $lng2);
        return $km < 1 ? round($km * 1000) . ' m aprox.' : round($km, 1) . ' km aprox.';
    }

    private function queryHospitals(float $lat, float $lng): array
    {
        return $this->overpassRequest(
            "[out:json][timeout:10];(" .
            "node[\"amenity\"~\"hospital|clinic\"](around:5000,{$lat},{$lng});" .
            "way[\"amenity\"~\"hospital|clinic\"](around:5000,{$lat},{$lng});" .
            ");out center tags;"
        );
    }

    private function queryPolice(float $lat, float $lng): array
    {
        return $this->overpassRequest(
            "[out:json][timeout:10];(" .
            "node[\"amenity\"=\"police\"](around:5000,{$lat},{$lng});" .
            "way[\"amenity\"=\"police\"](around:5000,{$lat},{$lng});" .
            ");out center tags;"
        );
    }

    private function queryTransit(float $lat, float $lng): array
    {
        return $this->overpassRequest(
            "[out:json][timeout:10];(" .
            "node[\"public_transport\"=\"station\"](around:1000,{$lat},{$lng});" .
            "node[\"railway\"~\"station|subway_entrance\"](around:1000,{$lat},{$lng});" .
            "node[\"railway\"=\"tram_stop\"](around:800,{$lat},{$lng});" .
            ");out center tags;"
        );
    }

    private function queryBus(float $lat, float $lng): array
    {
        return $this->overpassRequest(
            "[out:json][timeout:10];(" .
            "node[\"highway\"=\"bus_stop\"](around:400,{$lat},{$lng});" .
            ");out center tags;"
        );
    }

    private function queryParking(float $lat, float $lng): array
    {
        return $this->overpassRequest(
            "[out:json][timeout:10];(" .
            "node[\"amenity\"=\"parking\"](around:1000,{$lat},{$lng});" .
            "way[\"amenity\"=\"parking\"](around:1000,{$lat},{$lng});" .
            ");out center tags;"
        );
    }

    // ── Valhalla (real road distances + travel times) ─────────────

    private function getDistances(array $origin, array $destinations): array
    {
        if (empty($destinations)) return [];

        try {
            $targets = array_values(array_map(
                fn($d) => ['lon' => $d['lng'], 'lat' => $d['lat']],
                $destinations
            ));

            $response = Http::withHeaders(['User-Agent' => $this->userAgent])
                ->timeout(20)
                ->post('https://valhalla1.openstreetmap.de/sources_to_targets', [
                    'sources' => [['lon' => $origin['lng'], 'lat' => $origin['lat']]],
                    'targets' => $targets,
                    'costing' => 'auto',
                ]);

            if ($response->failed()) {
                return array_fill(0, count($destinations), null);
            }

            return $response->json()['sources_to_targets'][0]
                ?? array_fill(0, count($destinations), null);
        } catch (\Exception) {
            return array_fill(0, count($destinations), null);
        }
    }

    private function formatDistance(?array $result): ?string
    {
        if (!$result || !isset($result['distance'])) return null;
        $km   = round((float) $result['distance'], 1);
        $mins = (int) round((float) ($result['time'] ?? 0) / 60);
        $distStr = $km < 1 ? round($km * 1000) . ' m' : $km . ' km';
        return "{$distStr}, {$mins} min en coche";
    }

    // ── Helpers ──────────────────────────────────────────────────

    private function getCoords(array $element): array
    {
        if ($element['type'] === 'way') {
            return [
                'lat' => $element['center']['lat'],
                'lng' => $element['center']['lon'],
            ];
        }
        return ['lat' => $element['lat'], 'lng' => $element['lon']];
    }

    private function buildAddress(array $tags): string
    {
        $parts = [];
        if (!empty($tags['addr:street'])) {
            $parts[] = trim($tags['addr:street'] . ' ' . ($tags['addr:housenumber'] ?? ''));
        }
        if (!empty($tags['addr:city'])) {
            $parts[] = $tags['addr:city'];
        }
        if (empty($parts) && !empty($tags['addr:full'])) {
            return $tags['addr:full'];
        }
        return implode(', ', array_filter($parts));
    }

    private function buildPlaceList(array $elements, int $offset, array $distances): array
    {
        $result = [];
        foreach ($elements as $i => $el) {
            $tags    = $el['tags'] ?? [];
            $name    = $tags['name'] ?? null;
            if (!$name) continue;

            $coords  = $this->getCoords($el);
            $dist    = $distances[$offset + $i] ?? null;

            $result[] = [
                'name'          => $name,
                'address'       => $this->buildAddress($tags),
                'lat'           => $coords['lat'],
                'lng'           => $coords['lng'],
                'distance_text' => $this->formatDistance($dist),
                'phone'         => $tags['phone'] ?? $tags['contact:phone'] ?? $tags['emergency:phone'] ?? null,
            ];
        }
        return $result;
    }

    // ── Public API ───────────────────────────────────────────────

    public function getTransitOnly(float $lat, float $lng): array
    {
        $origin = ['lat' => $lat, 'lng' => $lng];
        $transitRaw = $this->queryTransit($lat, $lng);
        $busRaw = $this->queryBus($lat, $lng);

        $seen = [];
        $transit = [];
        foreach ($transitRaw as $el) {
            $name = $el['tags']['name'] ?? null;
            if ($name && !isset($seen[$name])) { $seen[$name] = true; $transit[] = $el; }
        }
        $transit = array_slice($transit, 0, 10);
        $busStops = array_slice($busRaw, 0, 8);

        $all = array_merge($transit, $busStops);
        $coords = array_map([$this, 'getCoords'], $all);
        $distances = $this->getDistances($origin, $coords);

        return [
            'metro_tren' => $this->buildPlaceList($transit, 0, $distances),
            'autobus' => $this->buildPlaceList($busStops, count($transit), $distances),
        ];
    }

    public function getParkingOnly(float $lat, float $lng): array
    {
        $origin = ['lat' => $lat, 'lng' => $lng];
        $parkingRaw = $this->queryParking($lat, $lng);
        $parkings = array_slice($parkingRaw, 0, 8);
        $coords = array_map([$this, 'getCoords'], $parkings);
        $distances = $this->getDistances($origin, $coords);

        return [
            'parking' => $this->buildPlaceList($parkings, 0, $distances),
        ];
    }

    /**
     * Transport data for section 4:
     * metro_tren, autobus, parking
     */
    /**
     * POIs for map overlay — cached 7 days, single combined response
     */
    public function getMapPOIs(float $lat, float $lng, array $categories): array
    {
        // Round to 2 decimals (~1km grid) so nearby addresses share cache
        $gridLat = round($lat, 2);
        $gridLng = round($lng, 2);
        sort($categories);
        $key = 'maps.pois.' . md5("{$gridLat},{$gridLng}," . implode(',', $categories));
        return Cache::remember($key, 60 * 60 * 24 * 30, function () use ($lat, $lng, $categories) {
            $pois = [];

            if (in_array('hospital', $categories)) {
                foreach (array_slice($this->queryHospitals($lat, $lng), 0, 8) as $el) {
                    $tags = $el['tags'] ?? [];
                    $name = $tags['name'] ?? null;
                    if (!$name) continue;
                    $coords = $this->getCoords($el);
                    $pois[] = ['lat' => $coords['lat'], 'lng' => $coords['lng'], 'name' => $name, 'emoji' => '🏥'];
                }
            }

            if (in_array('police', $categories)) {
                foreach (array_slice($this->queryPolice($lat, $lng), 0, 8) as $el) {
                    $tags = $el['tags'] ?? [];
                    $name = $tags['name'] ?? ($tags['description'] ?? 'Policía');
                    $coords = $this->getCoords($el);
                    $pois[] = ['lat' => $coords['lat'], 'lng' => $coords['lng'], 'name' => $name, 'emoji' => '👮'];
                }
            }

            if (in_array('parking', $categories)) {
                foreach (array_slice($this->queryParking($lat, $lng), 0, 8) as $el) {
                    $tags = $el['tags'] ?? [];
                    $name = $tags['name'] ?? 'Parking';
                    $coords = $this->getCoords($el);
                    $pois[] = ['lat' => $coords['lat'], 'lng' => $coords['lng'], 'name' => $name, 'emoji' => '🅿️'];
                }
            }

            if (in_array('metro', $categories)) {
                foreach (array_slice($this->queryTransit($lat, $lng), 0, 8) as $el) {
                    $tags = $el['tags'] ?? [];
                    $name = $tags['name'] ?? null;
                    if (!$name) continue;
                    $coords = $this->getCoords($el);
                    $pois[] = ['lat' => $coords['lat'], 'lng' => $coords['lng'], 'name' => $name, 'emoji' => '🚇'];
                }
            }

            return $pois;
        });
    }

    public function getTransportData(float $lat, float $lng, bool $skipCache = false): array
    {
        $key = 'maps.transport.' . md5(round($lat, 2) . ',' . round($lng, 2));
        if (!$skipCache && Cache::has($key)) return Cache::get($key);

        $compute = function () use ($lat, $lng) {
            $origin = ['lat' => $lat, 'lng' => $lng];

            $transitRaw = $this->queryTransit($lat, $lng);
            $busRaw     = $this->queryBus($lat, $lng);
            $parkingRaw = $this->queryParking($lat, $lng);

            // Deduplicate transit by name
            $seen    = [];
            $transit = [];
            foreach ($transitRaw as $el) {
                $name = $el['tags']['name'] ?? null;
                if ($name && !isset($seen[$name])) {
                    $seen[$name] = true;
                    $transit[]   = $el;
                }
            }
            $transit    = array_slice($transit, 0, 10);
            $busStops   = array_slice($busRaw, 0, 8);
            $parkings   = array_slice($parkingRaw, 0, 8);

            // Batch distance request
            $allElements = array_merge($transit, $busStops, $parkings);
            $coords      = array_map([$this, 'getCoords'], $allElements);
            $distances   = $this->getDistances($origin, $coords);

            $tCount = count($transit);
            $bCount = count($busStops);

            return [
                'metro_tren' => $this->buildPlaceList($transit, 0, $distances),
                'autobus'    => $this->buildPlaceList($busStops, $tCount, $distances),
                'parking'    => $this->buildPlaceList($parkings, $tCount + $bCount, $distances),
            ];
        };

        $result = $compute();
        $total = count($result['metro_tren'] ?? []) + count($result['autobus'] ?? []) + count($result['parking'] ?? []);
        if ($total > 0) Cache::put($key, $result, 60 * 60 * 24 * 7);
        return $result;
    }

    /**
     * Emergency data for section 5:
     * hospitales, policia (Nacional/Local), guardia_civil
     */
    public function getEmergencyData(float $lat, float $lng, bool $skipCache = false): array
    {
        $key = 'maps.emergency.' . md5(round($lat, 2) . ',' . round($lng, 2));
        if (!$skipCache && Cache::has($key)) return Cache::get($key);

        $compute = function () use ($lat, $lng) {
            $origin = ['lat' => $lat, 'lng' => $lng];

            $hospitalRaw = $this->queryHospitals($lat, $lng);
            $policeRaw   = $this->queryPolice($lat, $lng);

            $policia  = [];
            $guardias = [];
            foreach ($policeRaw as $el) {
                $tags = $el['tags'] ?? [];
                $isGC = str_contains(strtolower($tags['name'] ?? ''), 'guardia civil')
                     || str_contains(strtolower($tags['operator'] ?? ''), 'guardia civil');
                if ($isGC) $guardias[] = $el; else $policia[] = $el;
            }

            $hospitals = array_slice($hospitalRaw, 0, 8);
            $policia   = array_slice($policia, 0, 6);
            $guardias  = array_slice($guardias, 0, 4);

            $allElements = array_merge($hospitals, $policia, $guardias);
            $coords      = array_map([$this, 'getCoords'], $allElements);
            $distances   = $this->getDistances($origin, $coords);

            $hCount = count($hospitals);
            $pCount = count($policia);

            return [
                'hospitales'    => $this->buildPlaceList($hospitals, 0, $distances),
                'policia'       => $this->buildPlaceList($policia, $hCount, $distances),
                'guardia_civil' => $this->buildPlaceList($guardias, $hCount + $pCount, $distances),
            ];
        };

        $result = $compute();
        $total = count($result['hospitales'] ?? []) + count($result['policia'] ?? []) + count($result['guardia_civil'] ?? []);
        if ($total > 0) Cache::put($key, $result, 60 * 60 * 24 * 7);
        return $result;
    }

    private function buildPlaceListHaversine(array $elements, float $originLat, float $originLng): array
    {
        $result = [];
        foreach ($elements as $el) {
            $tags = $el['tags'] ?? [];
            $name = $tags['name'] ?? null;
            if (!$name) continue;
            $coords = $this->getCoords($el);
            $result[] = [
                'name'          => $name,
                'address'       => $this->buildAddress($tags),
                'lat'           => $coords['lat'],
                'lng'           => $coords['lng'],
                'distance_text' => $this->formatDistanceKm($originLat, $originLng, $coords['lat'], $coords['lng']),
                'phone'         => $tags['phone'] ?? $tags['contact:phone'] ?? $tags['emergency:phone'] ?? null,
            ];
        }
        usort($result, fn($a, $b) =>
            $this->haversineKm($originLat, $originLng, $a['lat'], $a['lng']) <=>
            $this->haversineKm($originLat, $originLng, $b['lat'], $b['lng'])
        );
        return $result;
    }

    /** Hospitals only — for split requests */
    public function getHospitalsOnly(float $lat, float $lng): array
    {
        $key = 'maps.hospitals_only.' . md5(round($lat, 2) . ',' . round($lng, 2));
        if (Cache::has($key)) return Cache::get($key);

        $raw = $this->queryHospitals($lat, $lng);
        $hospitals = array_slice($raw, 0, 8);
        $result = ['hospitales' => $this->buildPlaceListHaversine($hospitals, $lat, $lng)];

        if (count($result['hospitales']) > 0) {
            Cache::put($key, $result, 60 * 60 * 24 * 7);
        }
        return $result;
    }

    /** Police only — for split requests */
    public function getPoliceOnly(float $lat, float $lng): array
    {
        $key = 'maps.police_only.' . md5(round($lat, 2) . ',' . round($lng, 2));
        if (Cache::has($key)) return Cache::get($key);

        $raw = $this->queryPolice($lat, $lng);
        $policia = [];
        $guardias = [];
        foreach ($raw as $el) {
            $tags = $el['tags'] ?? [];
            $isGC = str_contains(strtolower($tags['name'] ?? ''), 'guardia civil')
                 || str_contains(strtolower($tags['operator'] ?? ''), 'guardia civil');
            if ($isGC) $guardias[] = $el; else $policia[] = $el;
        }
        $policia  = array_slice($policia, 0, 6);
        $guardias = array_slice($guardias, 0, 4);

        $result = [
            'policia'       => $this->buildPlaceListHaversine($policia, $lat, $lng),
            'guardia_civil' => $this->buildPlaceListHaversine($guardias, $lat, $lng),
        ];

        if (count($result['policia']) > 0 || count($result['guardia_civil']) > 0) {
            Cache::put($key, $result, 60 * 60 * 24 * 7);
        }
        return $result;
    }
}
