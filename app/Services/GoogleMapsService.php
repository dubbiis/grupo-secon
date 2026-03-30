<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class GoogleMapsService
{
    private string $apiKey;
    private string $language;
    private string $region;

    public function __construct()
    {
        $this->apiKey   = config('googlemaps.api_key');
        $this->language = config('googlemaps.language', 'es');
        $this->region   = config('googlemaps.region', 'ES');
    }

    // ── Geocoding (Google Geocoding API) ─────────────────────────

    public function geocode(string $address): ?array
    {
        $key = 'maps.geocode.' . md5($address);
        $cached = Cache::get($key);
        if ($cached !== null) return $cached;

        try {
            $response = Http::timeout(10)->get('https://maps.googleapis.com/maps/api/geocode/json', [
                'address'  => $address,
                'key'      => $this->apiKey,
                'language' => $this->language,
                'region'   => $this->region,
            ]);

            $data = $response->json();
            if (($data['status'] ?? '') !== 'OK' || empty($data['results'])) return null;

            $loc = $data['results'][0]['geometry']['location'];
            $result = [
                'lat'          => (float) $loc['lat'],
                'lng'          => (float) $loc['lng'],
                'display_name' => $data['results'][0]['formatted_address'] ?? $address,
            ];

            Cache::put($key, $result, 60 * 60 * 24 * 30);
            return $result;
        } catch (\Exception) {
            return null;
        }
    }

    // ── Autocomplete (Places API New) ─────────────────────────────

    public function autocomplete(string $input, ?float $biasLat = null, ?float $biasLng = null): array
    {
        try {
            $body = [
                'input'        => $input,
                'languageCode' => $this->language,
            ];

            if ($biasLat && $biasLng) {
                $body['locationBias'] = [
                    'circle' => [
                        'center' => ['latitude' => $biasLat, 'longitude' => $biasLng],
                        'radius' => 50000.0,
                    ],
                ];
            }

            $response = Http::timeout(5)
                ->withHeaders(['X-Goog-Api-Key' => $this->apiKey])
                ->post('https://places.googleapis.com/v1/places:autocomplete', $body);

            if ($response->failed()) return [];

            $suggestions = $response->json()['suggestions'] ?? [];
            $results = [];

            foreach ($suggestions as $s) {
                $p = $s['placePrediction'] ?? null;
                if (!$p) continue;

                $results[] = [
                    'placeId'     => $p['placeId'] ?? '',
                    'name'        => $p['structuredFormat']['mainText']['text'] ?? $p['text']['text'] ?? '',
                    'subtitle'    => $p['structuredFormat']['secondaryText']['text'] ?? '',
                    'displayName' => $p['text']['text'] ?? '',
                    'types'       => $p['types'] ?? [],
                ];
            }

            return $results;
        } catch (\Exception) {
            return [];
        }
    }

    public function placeDetails(string $placeId): ?array
    {
        try {
            $response = Http::timeout(5)
                ->withHeaders([
                    'X-Goog-Api-Key'   => $this->apiKey,
                    'X-Goog-FieldMask' => 'location,formattedAddress,displayName',
                    'Accept-Language'   => $this->language,
                ])
                ->get("https://places.googleapis.com/v1/places/{$placeId}");

            if ($response->failed()) return null;

            $data = $response->json();
            $loc  = $data['location'] ?? null;
            if (!$loc) return null;

            return [
                'lat'         => (float) $loc['latitude'],
                'lng'         => (float) $loc['longitude'],
                'displayName' => $data['formattedAddress'] ?? '',
                'name'        => $data['displayName']['text'] ?? '',
            ];
        } catch (\Exception) {
            return null;
        }
    }

    // ── Routes (Routes API) ─────────────────────────────────────

    public function computeRoute(array $origin, array $destination): array
    {
        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'X-Goog-Api-Key'   => $this->apiKey,
                    'X-Goog-FieldMask' => 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
                ])
                ->post('https://routes.googleapis.com/directions/v2:computeRoutes', [
                    'origin'      => ['location' => ['latLng' => ['latitude' => $origin['lat'], 'longitude' => $origin['lng']]]],
                    'destination' => ['location' => ['latLng' => ['latitude' => $destination['lat'], 'longitude' => $destination['lng']]]],
                    'travelMode'  => 'DRIVE',
                    'computeAlternativeRoutes' => true,
                ]);

            if ($response->failed()) return [];

            $routes = $response->json()['routes'] ?? [];
            return array_map(fn($r) => [
                'distanceMeters'  => $r['distanceMeters'] ?? 0,
                'duration'        => $r['duration'] ?? '0s',
                'encodedPolyline' => $r['polyline']['encodedPolyline'] ?? '',
            ], $routes);
        } catch (\Exception) {
            return [];
        }
    }

    // ── Places Nearby Search (Google Places API) ─────────────────

    /**
     * Search for places of given types near a location.
     * Uses the Google Places API (New) — Nearby Search endpoint.
     */
    private function nearbySearch(float $lat, float $lng, array $includedTypes, int $radius = 5000, int $maxResults = 20): array
    {
        try {
            $response = Http::timeout(15)
                ->withHeaders([
                    'X-Goog-Api-Key'   => $this->apiKey,
                    'X-Goog-FieldMask' => 'places.displayName,places.formattedAddress,places.location,places.internationalPhoneNumber,places.types',
                ])
                ->post('https://places.googleapis.com/v1/places:searchNearby', [
                    'includedTypes'       => $includedTypes,
                    'maxResultCount'      => $maxResults,
                    'languageCode'        => $this->language,
                    'locationRestriction' => [
                        'circle' => [
                            'center'  => ['latitude' => $lat, 'longitude' => $lng],
                            'radius'  => (float) $radius,
                        ],
                    ],
                ]);

            if ($response->failed()) return [];

            return $response->json()['places'] ?? [];
        } catch (\Exception) {
            return [];
        }
    }

    /**
     * Convert Google Places API result to our internal format.
     */
    private function mapPlaceToItem(array $place, float $originLat, float $originLng): array
    {
        $loc  = $place['location'] ?? [];
        $lat  = (float) ($loc['latitude'] ?? 0);
        $lng  = (float) ($loc['longitude'] ?? 0);
        $name = $place['displayName']['text'] ?? '';

        return [
            'name'          => $name,
            'address'       => $place['formattedAddress'] ?? '',
            'lat'           => $lat,
            'lng'           => $lng,
            'distance_text' => $this->formatDistanceKm($originLat, $originLng, $lat, $lng),
            'phone'         => $place['internationalPhoneNumber'] ?? null,
        ];
    }

    // ── Distance Matrix (Google Distance Matrix API) ─────────────

    /**
     * Get driving distances and times from origin to multiple destinations.
     * Google allows max 25 destinations per request, so we batch.
     */
    private function getDistances(array $origin, array $destinations): array
    {
        if (empty($destinations)) return [];

        $results = [];
        $chunks  = array_chunk($destinations, 25);

        foreach ($chunks as $chunk) {
            try {
                $destStrings = array_map(
                    fn($d) => $d['lat'] . ',' . $d['lng'],
                    $chunk
                );

                $response = Http::timeout(15)->get('https://maps.googleapis.com/maps/api/distancematrix/json', [
                    'origins'      => $origin['lat'] . ',' . $origin['lng'],
                    'destinations' => implode('|', $destStrings),
                    'mode'         => 'driving',
                    'language'     => $this->language,
                    'key'          => $this->apiKey,
                ]);

                $data = $response->json();
                $elements = $data['rows'][0]['elements'] ?? [];

                foreach ($elements as $el) {
                    if (($el['status'] ?? '') === 'OK') {
                        $results[] = [
                            'distance' => $el['distance']['value'] ?? 0,  // meters
                            'time'     => $el['duration']['value'] ?? 0,  // seconds
                        ];
                    } else {
                        $results[] = null;
                    }
                }
            } catch (\Exception) {
                $results = array_merge($results, array_fill(0, count($chunk), null));
            }
        }

        return $results;
    }

    // ── Helpers ──────────────────────────────────────────────────

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

    private function formatDistance(?array $result): ?string
    {
        if (!$result || !isset($result['distance'])) return null;
        $meters = (float) $result['distance'];
        $km     = round($meters / 1000, 1);
        $mins   = (int) round((float) ($result['time'] ?? 0) / 60);
        $distStr = $km < 1 ? round($meters) . ' m' : $km . ' km';
        return "{$distStr}, {$mins} min en coche";
    }

    /**
     * Build place list from Google Places results with Distance Matrix distances.
     */
    private function buildPlaceList(array $places, float $originLat, float $originLng, bool $useDistanceMatrix = true): array
    {
        // First, convert to internal format and sort by haversine
        $items = [];
        foreach ($places as $place) {
            $item = $this->mapPlaceToItem($place, $originLat, $originLng);
            if (!$item['name']) continue;
            $item['_haversine'] = $this->haversineKm($originLat, $originLng, $item['lat'], $item['lng']);
            $items[] = $item;
        }

        usort($items, fn($a, $b) => $a['_haversine'] <=> $b['_haversine']);

        // Optionally get real driving distances
        if ($useDistanceMatrix && count($items) > 0) {
            $origin = ['lat' => $originLat, 'lng' => $originLng];
            $coords = array_map(fn($i) => ['lat' => $i['lat'], 'lng' => $i['lng']], $items);
            $distances = $this->getDistances($origin, $coords);

            foreach ($items as $idx => &$item) {
                $formatted = $this->formatDistance($distances[$idx] ?? null);
                if ($formatted) {
                    $item['distance_text'] = $formatted;
                }
            }
            unset($item);
        }

        // Remove internal field
        return array_map(function ($item) {
            unset($item['_haversine']);
            return $item;
        }, $items);
    }

    // ── Public API ───────────────────────────────────────────────

    public function getTransitOnly(float $lat, float $lng, int $radius = 2000): array
    {
        $transitRaw = $this->nearbySearch($lat, $lng, ['subway_station', 'train_station', 'transit_station', 'light_rail_station'], $radius, 15);
        $busRaw     = $this->nearbySearch($lat, $lng, ['bus_station'], min($radius, 1000), 10);

        // Deduplicate transit by name
        $seen    = [];
        $transit = [];
        foreach ($transitRaw as $place) {
            $name = $place['displayName']['text'] ?? '';
            if ($name && !isset($seen[$name])) {
                $seen[$name] = true;
                $transit[]   = $place;
            }
        }
        $transit  = array_slice($transit, 0, 10);
        $busStops = array_slice($busRaw, 0, 8);

        return [
            'metro_tren' => $this->buildPlaceList($transit, $lat, $lng),
            'autobus'    => $this->buildPlaceList($busStops, $lat, $lng),
        ];
    }

    public function getParkingOnly(float $lat, float $lng, int $radius = 2000): array
    {
        $parkingRaw = $this->nearbySearch($lat, $lng, ['parking'], $radius, 10);
        $parkings   = array_slice($parkingRaw, 0, 8);

        return [
            'parking' => $this->buildPlaceList($parkings, $lat, $lng),
        ];
    }

    /**
     * POIs for map overlay — cached 30 days, single combined response.
     */
    public function getMapPOIs(float $lat, float $lng, array $categories): array
    {
        $gridLat = round($lat, 2);
        $gridLng = round($lng, 2);
        sort($categories);
        $key = 'maps.pois.' . md5("{$gridLat},{$gridLng}," . implode(',', $categories));

        return Cache::remember($key, 60 * 60 * 24 * 30, function () use ($lat, $lng, $categories) {
            $pois = [];
            $typeMap = [
                'hospital' => ['types' => ['hospital'], 'emoji' => '🏥', 'max' => 8],
                'police'   => ['types' => ['police'], 'emoji' => '👮', 'max' => 8],
                'parking'  => ['types' => ['parking'], 'emoji' => '🅿️', 'max' => 8],
                'metro'    => ['types' => ['subway_station', 'train_station', 'transit_station'], 'emoji' => '🚇', 'max' => 8],
            ];

            foreach ($categories as $cat) {
                if (!isset($typeMap[$cat])) continue;
                $conf = $typeMap[$cat];
                $radius = in_array($cat, ['hospital', 'police']) ? 5000 : 2000;
                $places = $this->nearbySearch($lat, $lng, $conf['types'], $radius, $conf['max']);

                foreach ($places as $place) {
                    $loc  = $place['location'] ?? [];
                    $name = $place['displayName']['text'] ?? '';
                    if (!$name) continue;
                    $pois[] = [
                        'lat'   => (float) ($loc['latitude'] ?? 0),
                        'lng'   => (float) ($loc['longitude'] ?? 0),
                        'name'  => $name,
                        'emoji' => $conf['emoji'],
                    ];
                }
            }

            return $pois;
        });
    }

    /**
     * Transport data for section 4: metro_tren, autobus, parking.
     */
    public function getTransportData(float $lat, float $lng, bool $skipCache = false, int $radius = 2000): array
    {
        $key = 'maps.transport.' . md5(round($lat, 2) . ',' . round($lng, 2) . ',' . $radius);
        if (!$skipCache && Cache::has($key)) return Cache::get($key);

        $transit = $this->getTransitOnly($lat, $lng, $radius);
        $parking = $this->getParkingOnly($lat, $lng, $radius);

        $result = array_merge($transit, $parking);

        $total = count($result['metro_tren'] ?? []) + count($result['autobus'] ?? []) + count($result['parking'] ?? []);
        if ($total > 0) Cache::put($key, $result, 60 * 60 * 24 * 7);
        return $result;
    }

    /**
     * Emergency data for section 5: hospitales, policia (unified).
     */
    public function getEmergencyData(float $lat, float $lng, bool $skipCache = false, int $radius = 5000): array
    {
        $key = 'maps.emergency.' . md5(round($lat, 2) . ',' . round($lng, 2) . ',' . $radius);
        if (!$skipCache && Cache::has($key)) return Cache::get($key);

        $hospitalPlaces = $this->nearbySearch($lat, $lng, ['hospital'], $radius, 10);
        $policePlaces   = $this->nearbySearch($lat, $lng, ['police'], $radius, 10);

        $hospitals = array_slice($hospitalPlaces, 0, 8);
        $policia   = array_slice($policePlaces, 0, 10);

        $result = [
            'hospitales' => $this->buildPlaceList($hospitals, $lat, $lng),
            'policia'    => $this->buildPlaceList($policia, $lat, $lng),
        ];

        $total = count($result['hospitales']) + count($result['policia']);
        if ($total > 0) Cache::put($key, $result, 60 * 60 * 24 * 7);
        return $result;
    }

    /** Hospitals only — for split requests */
    public function getHospitalsOnly(float $lat, float $lng, int $radius = 5000): array
    {
        $key = 'maps.hospitals_only.' . md5(round($lat, 2) . ',' . round($lng, 2) . ',' . $radius);
        if (Cache::has($key)) return Cache::get($key);

        $places   = $this->nearbySearch($lat, $lng, ['hospital'], $radius, 10);
        $hospitals = array_slice($places, 0, 8);
        $result = ['hospitales' => $this->buildPlaceList($hospitals, $lat, $lng)];

        if (count($result['hospitales']) > 0) {
            Cache::put($key, $result, 60 * 60 * 24 * 7);
        }
        return $result;
    }

    /** Police only — for split requests (unified, no guardia_civil separation) */
    public function getPoliceOnly(float $lat, float $lng, int $radius = 5000): array
    {
        $key = 'maps.police_only.' . md5(round($lat, 2) . ',' . round($lng, 2) . ',' . $radius);
        if (Cache::has($key)) return Cache::get($key);

        $places  = $this->nearbySearch($lat, $lng, ['police'], $radius, 10);
        $policia = array_slice($places, 0, 10);

        $result = [
            'policia' => $this->buildPlaceList($policia, $lat, $lng),
        ];

        if (count($result['policia']) > 0) {
            Cache::put($key, $result, 60 * 60 * 24 * 7);
        }
        return $result;
    }
}
