<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\PlanFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class PlanFileController extends Controller
{
    public function store(Request $request, string $uuid, int $section)
    {
        $request->validate([
            'file' => 'required|file|max:20480',
            'file_category' => 'required|string',
            'metadata' => 'nullable|array',
            'order' => 'nullable|integer',
        ]);

        $plan = Plan::where('uuid', $uuid)->firstOrFail();

        $file = $request->file('file');
        $category = $request->input('file_category');
        $dir = "planes/{$uuid}/sec{$section}";
        $path = $file->store($dir, 'public');

        $planFile = PlanFile::create([
            'plan_id' => $plan->id,
            'section_number' => $section,
            'file_category' => $category,
            'file_path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'order' => $request->input('order', 0),
            'metadata' => $request->input('metadata'),
        ]);

        return response()->json([
            'id' => $planFile->id,
            'file_category' => $planFile->file_category,
            'original_name' => $planFile->original_name,
            'mime_type' => $planFile->mime_type,
            'url' => $planFile->url,
            'metadata' => $planFile->metadata,
            'order' => $planFile->order,
        ]);
    }

    public function destroy(PlanFile $file)
    {
        Gate::authorize('delete', $file->plan);
        $file->delete();
        return response()->json(['ok' => true]);
    }
}
