<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\PlanSection;
use App\Models\PromptTemplate;
use App\Services\OpenAIService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlanSectionController extends Controller
{
    public function show(string $uuid, int $section)
    {
        $plan = Plan::where('uuid', $uuid)->with('sections', 'files')->firstOrFail();
        $currentSection = $plan->getSectionByNumber($section);

        return Inertia::render('Planes/Show', [
            'plan' => [
                'id' => $plan->id,
                'uuid' => $plan->uuid,
                'title' => $plan->title,
                'status' => $plan->status,
                'branding' => $plan->branding,
            ],
            'sections' => $plan->sections->map(fn($s) => [
                'section_number' => $s->section_number,
                'section_name' => $s->section_name,
                'status' => $s->status,
            ]),
            'currentSection' => $currentSection ? [
                'section_number' => $currentSection->section_number,
                'section_name' => $currentSection->section_name,
                'form_data' => $currentSection->form_data ?? [],
                'generated_text' => $currentSection->generated_text,
                'status' => $currentSection->status,
            ] : null,
            'files' => $plan->getFilesBySection($section)->map(fn($f) => [
                'id' => $f->id,
                'file_category' => $f->file_category,
                'original_name' => $f->original_name,
                'url' => $f->url,
                'metadata' => $f->metadata,
                'order' => $f->order,
            ]),
        ]);
    }

    public function update(Request $request, string $uuid, int $section)
    {
        $plan = Plan::where('uuid', $uuid)->firstOrFail();
        $planSection = $plan->getSectionByNumber($section);

        $planSection->update([
            'form_data' => $request->input('form_data', []),
            'generated_text' => $request->input('generated_text', $planSection->generated_text),
            'status' => $request->input('status', $planSection->status),
        ]);

        // Actualizar status del plan
        if ($plan->status === 'borrador') {
            $plan->update(['status' => 'en_progreso']);
        }

        return response()->json(['ok' => true, 'section' => [
            'status' => $planSection->fresh()->status,
        ]]);
    }

    public function generar(Request $request, string $uuid, int $section)
    {
        $plan = Plan::where('uuid', $uuid)->with('sections')->firstOrFail();
        $planSection = $plan->getSectionByNumber($section);
        $template = PromptTemplate::forSection($section);

        if (!$template) {
            return response()->json(['error' => 'No hay prompt configurado para esta sección'], 422);
        }

        // Marcar como generando
        $planSection->update(['status' => 'generando']);

        $openAI = new OpenAIService();
        $context = $openAI->buildContext($plan, $section);
        $variables = array_merge(
            $planSection->form_data ?? [],
            $context
        );

        return response()->stream(function () use ($openAI, $template, $variables, $planSection) {
            $fullText = '';

            $openAI->streamGenerate(
                $template,
                $variables,
                function (string $chunk) use (&$fullText) {
                    $fullText .= $chunk;
                    echo "data: " . json_encode(['text' => $chunk]) . "\n\n";
                    if (ob_get_level() > 0) ob_flush();
                    flush();
                }
            );

            // Guardar texto completo
            $planSection->update([
                'generated_text' => $fullText,
                'status' => 'listo',
            ]);

            echo "data: " . json_encode(['done' => true]) . "\n\n";
            if (ob_get_level() > 0) ob_flush();
            flush();
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
            'Connection' => 'keep-alive',
        ]);
    }

    public function cambios(Request $request, string $uuid, int $section)
    {
        $request->validate(['instrucciones' => 'required|string']);

        $plan = Plan::where('uuid', $uuid)->firstOrFail();
        $planSection = $plan->getSectionByNumber($section);
        $openAI = new OpenAIService();

        return response()->stream(function () use ($openAI, $planSection, $request) {
            $fullText = '';

            $openAI->streamCambios(
                $planSection->generated_text,
                $request->input('instrucciones'),
                function (string $chunk) use (&$fullText) {
                    $fullText .= $chunk;
                    echo "data: " . json_encode(['text' => $chunk]) . "\n\n";
                    if (ob_get_level() > 0) ob_flush();
                    flush();
                }
            );

            $planSection->update([
                'generated_text' => $fullText,
                'status' => 'editado',
            ]);

            echo "data: " . json_encode(['done' => true]) . "\n\n";
            if (ob_get_level() > 0) ob_flush();
            flush();
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
            'Connection' => 'keep-alive',
        ]);
    }
}
