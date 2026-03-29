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

        // Storage usage per plan
        $storagePlans = Plan::withCount('files')
            ->with('files:id,plan_id,file_path,mime_type,original_name')
            ->having('files_count', '>', 0)
            ->get()
            ->map(function ($plan) {
                $totalBytes = 0;
                $fileCount = 0;
                foreach ($plan->files as $file) {
                    $path = \Storage::disk('public')->path($file->file_path);
                    if (file_exists($path)) {
                        $totalBytes += filesize($path);
                        $fileCount++;
                    }
                }
                return [
                    'uuid'        => $plan->uuid,
                    'title'       => $plan->title,
                    'files_total' => $plan->files->count(),
                    'files_exist' => $fileCount,
                    'size_bytes'  => $totalBytes,
                ];
            })
            ->sortByDesc('size_bytes')
            ->values();

        $storageTotalBytes = $storagePlans->sum('size_bytes');
        $storageTotalFiles = $storagePlans->sum('files_exist');
        $storageDbFiles = $storagePlans->sum('files_total');

        return Inertia::render('Admin/Stats', [
            'totals'    => $totals,
            'byModel'   => $byModel,
            'bySection' => $bySection,
            'recent'    => $recent,
            'daily'     => $daily,
            'storage'   => [
                'total_bytes' => $storageTotalBytes,
                'total_files' => $storageTotalFiles,
                'db_files'    => $storageDbFiles,
                'plans'       => $storagePlans,
            ],
        ]);
    }
}
