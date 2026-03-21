<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PlanUsageLog;
use App\Models\Plan;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StatsController extends Controller
{
    public function index()
    {
        // Totales globales
        $totals = PlanUsageLog::selectRaw('
            COUNT(*) as total_calls,
            SUM(prompt_tokens) as total_prompt_tokens,
            SUM(completion_tokens) as total_completion_tokens,
            SUM(total_tokens) as total_tokens,
            SUM(cost_usd) as total_cost
        ')->first();

        // Por modelo
        $byModel = PlanUsageLog::selectRaw('
            model,
            COUNT(*) as calls,
            SUM(prompt_tokens) as prompt_tokens,
            SUM(completion_tokens) as completion_tokens,
            SUM(total_tokens) as total_tokens,
            SUM(cost_usd) as cost
        ')->groupBy('model')->orderByDesc('cost')->get();

        // Por sección
        $bySection = PlanUsageLog::selectRaw('
            section_number,
            COUNT(*) as calls,
            SUM(total_tokens) as total_tokens,
            SUM(cost_usd) as cost
        ')->groupBy('section_number')->orderBy('section_number')->get();

        // Últimas 20 generaciones
        $recent = PlanUsageLog::with('plan:id,title,uuid')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(fn($log) => [
                'id'                => $log->id,
                'plan_title'        => $log->plan?->title ?? '—',
                'plan_uuid'         => $log->plan?->uuid ?? '',
                'section_number'    => $log->section_number,
                'model'             => $log->model,
                'type'              => $log->type,
                'prompt_tokens'     => $log->prompt_tokens,
                'completion_tokens' => $log->completion_tokens,
                'total_tokens'      => $log->total_tokens,
                'cost_usd'          => $log->cost_usd,
                'created_at'        => $log->created_at->format('d/m/Y H:i'),
            ]);

        // Evolución diaria (últimos 30 días)
        $daily = PlanUsageLog::selectRaw('
            DATE(created_at) as date,
            SUM(total_tokens) as tokens,
            SUM(cost_usd) as cost,
            COUNT(*) as calls
        ')
        ->where('created_at', '>=', now()->subDays(30))
        ->groupBy('date')
        ->orderBy('date')
        ->get();

        return Inertia::render('Admin/Stats', [
            'totals'    => $totals,
            'byModel'   => $byModel,
            'bySection' => $bySection,
            'recent'    => $recent,
            'daily'     => $daily,
        ]);
    }
}
