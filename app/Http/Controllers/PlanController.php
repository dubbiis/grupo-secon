<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlanController extends Controller
{
    public function index()
    {
        $plans = auth()->user()->plans()
            ->withCount(['sections as sections_done' => function ($q) {
                $q->whereIn('status', ['listo', 'editado']);
            }])
            ->latest()
            ->get()
            ->map(fn($plan) => [
                'id' => $plan->id,
                'uuid' => $plan->uuid,
                'title' => $plan->title,
                'status' => $plan->status,
                'progress' => (int) round(($plan->sections_done / 15) * 100),
                'created_at' => $plan->created_at->format('d/m/Y'),
            ]);

        return Inertia::render('Dashboard', [
            'plans' => $plans,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $plan = Plan::create([
            'title' => $data['title'],
            'user_id' => auth()->id(),
            'status' => 'borrador',
        ]);

        return redirect()->route('planes.seccion', [$plan->uuid, 1]);
    }

    public function destroy(Plan $plan)
    {
        $this->authorize('delete', $plan);
        $plan->delete();
        return back();
    }
}
