<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Services\GoogleMapsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class GoogleMapsController extends Controller
{
    public function __construct(private GoogleMapsService $maps) {}

    private function resolveCoords(Request $request, Plan $plan): ?array
    {
        $address = trim($request->input('address', ''));

        if (!$address) {
            $sec1    = $plan->getSectionByNumber(1);
            $address = $sec1?->form_data['direccion_evento'] ?? '';
        }

        if (!$address) return null;

        $coords = $this->maps->geocode($address);

        // If not found, try simplified versions (remove s/n, postal code, etc.)
        if (!$coords) {
            $simplified = preg_replace('/\b(s\/n|S\/N)\b/', '', $address);
            $simplified = preg_replace('/\b\d{5}\b/', '', $simplified);
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

        $skipCache = $request->boolean('skip_cache');
        $radius    = $request->integer('radius', 2000);
        $data = $this->maps->getTransportData($coords['lat'], $coords['lng'], $skipCache, $radius);

        return response()->json(array_merge(['address_used' => $coords['address_used']], $data));
    }

    public function transit(Request $request, string $uuid)
    {
        $plan = Plan::where('uuid', $uuid)->with('sections')->firstOrFail();
        $coords = $this->resolveCoords($request, $plan);
        if (!$coords) return response()->json(['error' => 'Dirección no encontrada'], 422);

        $lat    = $coords['lat'];
        $lng    = $coords['lng'];
        $radius = $request->integer('radius', 2000);
        $key    = 'maps.transit.' . md5(round($lat, 2) . ',' . round($lng, 2) . ',' . $radius);

        $data = Cache::remember($key, 60 * 60 * 24 * 7, function () use ($lat, $lng, $radius) {
            return $this->maps->getTransitOnly($lat, $lng, $radius);
        });

        return response()->json(array_merge(['address_used' => $coords['address_used']], $data));
    }

    public function parking(Request $request, string $uuid)
    {
        $plan = Plan::where('uuid', $uuid)->with('sections')->firstOrFail();
        $coords = $this->resolveCoords($request, $plan);
        if (!$coords) return response()->json(['error' => 'Dirección no encontrada'], 422);

        $lat    = $coords['lat'];
        $lng    = $coords['lng'];
        $radius = $request->integer('radius', 2000);
        $key    = 'maps.parking_only.' . md5(round($lat, 2) . ',' . round($lng, 2) . ',' . $radius);

        $data = Cache::remember($key, 60 * 60 * 24 * 7, function () use ($lat, $lng, $radius) {
            return $this->maps->getParkingOnly($lat, $lng, $radius);
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

        $skipCache = $request->boolean('skip_cache');
        $radius    = $request->integer('radius', 5000);
        $data = $this->maps->getEmergencyData($coords['lat'], $coords['lng'], $skipCache, $radius);

        return response()->json(array_merge(['address_used' => $coords['address_used']], $data));
    }

    public function hospitales(Request $request, string $uuid)
    {
        $plan   = Plan::where('uuid', $uuid)->with('sections')->firstOrFail();
        $coords = $this->resolveCoords($request, $plan);
        if (!$coords) return response()->json(['error' => 'Dirección no encontrada.'], 422);

        $radius = $request->integer('radius', 5000);
        $data = $this->maps->getHospitalsOnly($coords['lat'], $coords['lng'], $radius);
        return response()->json(array_merge(['address_used' => $coords['address_used']], $data));
    }

    public function policia(Request $request, string $uuid)
    {
        $plan   = Plan::where('uuid', $uuid)->with('sections')->firstOrFail();
        $coords = $this->resolveCoords($request, $plan);
        if (!$coords) return response()->json(['error' => 'Dirección no encontrada.'], 422);

        $radius = $request->integer('radius', 5000);
        $data = $this->maps->getPoliceOnly($coords['lat'], $coords['lng'], $radius);
        return response()->json(array_merge(['address_used' => $coords['address_used']], $data));
    }

    /**
     * POIs for map overlay — uses cached backend Google Places queries.
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
}
