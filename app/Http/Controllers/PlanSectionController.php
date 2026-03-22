<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\PlanSection;
use App\Models\PlanUsageLog;
use App\Models\PromptTemplate;
use App\Services\OpenAIService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use OpenAI;

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

        return back();
    }

    public function generar(Request $request, string $uuid, int $section)
    {
        $plan = Plan::where('uuid', $uuid)->with('sections')->firstOrFail();
        $planSection = $plan->getSectionByNumber($section);
        $template = PromptTemplate::forSection($section);

        if (!$template) {
            return response()->json(['error' => 'No hay prompt configurado para esta sección'], 422);
        }

        // Guardar form_data del request (datos actuales, aunque no se haya pulsado Guardar)
        $requestFormData = $request->input('form_data');
        if (is_array($requestFormData) && !empty($requestFormData)) {
            $planSection->update(['form_data' => $requestFormData]);
            $planSection->refresh();
        }

        // Marcar como generando
        $planSection->update(['status' => 'generando']);

        $openAI = new OpenAIService();
        $context = $openAI->buildContext($plan, $section);
        $variables = array_merge(
            $planSection->form_data ?? [],
            $context
        );

        return response()->stream(function () use ($openAI, $template, $variables, $planSection, $plan) {
            $fullText = '';

            $usage = $openAI->streamGenerate(
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

            // Registrar uso
            if ($usage) {
                PlanUsageLog::create([
                    'plan_id'           => $plan->id,
                    'section_number'    => $planSection->section_number,
                    'model'             => $template->model,
                    'type'              => 'generate',
                    'prompt_tokens'     => $usage['prompt_tokens'],
                    'completion_tokens' => $usage['completion_tokens'],
                    'total_tokens'      => $usage['total_tokens'],
                    'cost_usd'          => PlanUsageLog::calculateCost($template->model, $usage['prompt_tokens'], $usage['completion_tokens']),
                ]);
            }

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

    public function vipDescribir(Request $request, string $uuid)
    {
        $request->validate(['nombre' => 'required|string|max:200']);

        $plan      = Plan::where('uuid', $uuid)->with('sections')->firstOrFail();
        $sec1      = $plan->getSectionByNumber(1);
        $eventName = $sec1?->form_data['nombre_evento'] ?? $plan->title;
        $nombre    = $request->input('nombre');

        $client = OpenAI::client(config('openai.api_key'));

        return response()->stream(function () use ($client, $nombre, $eventName) {
            $stream = $client->chat()->createStreamed([
                'model'      => config('openai.model', 'gpt-4o-mini'),
                'max_tokens' => 350,
                'messages'   => [
                    [
                        'role'    => 'system',
                        'content' => 'Eres un experto en seguridad privada de eventos. Redacta perfiles de seguridad para VIPs de forma concisa y profesional en español. No uses markdown, solo texto plano. No incluyas título, encabezado ni frase introductoria. Empieza directamente con el contenido del perfil.',
                    ],
                    [
                        'role'    => 'user',
                        'content' => "Escribe el perfil de seguridad para el siguiente VIP/artista que asiste al evento \"{$eventName}\":\n\nNombre: {$nombre}\n\nRedacta en 4-5 líneas concisas e incluye: perfil público y nivel de exposición mediática, atención de fans o paparazzi esperada, protocolo de llegada y salida recomendado, zonas de acceso restringido necesarias y cualquier consideración especial de seguridad.",
                    ],
                ],
            ]);

            foreach ($stream as $chunk) {
                $text = $chunk->choices[0]->delta->content ?? '';
                if ($text !== '') {
                    echo "data: " . json_encode(['text' => $text]) . "\n\n";
                    if (ob_get_level() > 0) ob_flush();
                    flush();
                }
            }
            echo "data: " . json_encode(['done' => true]) . "\n\n";
            if (ob_get_level() > 0) ob_flush();
            flush();
        }, 200, [
            'Content-Type'     => 'text/event-stream',
            'Cache-Control'    => 'no-cache',
            'X-Accel-Buffering' => 'no',
            'Connection'       => 'keep-alive',
        ]);
    }

    public function cambios(Request $request, string $uuid, int $section)
    {
        $request->validate([
            'instrucciones' => 'required|string',
            'texto_actual'  => 'nullable|string',
        ]);

        $plan = Plan::where('uuid', $uuid)->firstOrFail();
        $planSection = $plan->getSectionByNumber($section);
        $openAI = new OpenAIService();

        $model = config('openai.model', 'gpt-4o-mini');

        $currentText = $request->input('texto_actual', $planSection->generated_text);

        return response()->stream(function () use ($openAI, $planSection, $plan, $section, $request, $model, $currentText) {
            $fullText = '';

            $usage = $openAI->streamCambios(
                $currentText,
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

            if ($usage) {
                PlanUsageLog::create([
                    'plan_id'           => $plan->id,
                    'section_number'    => $section,
                    'model'             => $model,
                    'type'              => 'cambios',
                    'prompt_tokens'     => $usage['prompt_tokens'],
                    'completion_tokens' => $usage['completion_tokens'],
                    'total_tokens'      => $usage['total_tokens'],
                    'cost_usd'          => PlanUsageLog::calculateCost($model, $usage['prompt_tokens'], $usage['completion_tokens']),
                ]);
            }

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

    /**
     * Paso 1 de sección 7: identificar 5 riesgos relevantes para el evento.
     */
    public function identificarRiesgos(Request $request, string $uuid)
    {
        $plan = Plan::where('uuid', $uuid)->with('sections')->firstOrFail();
        $openAI = new OpenAIService();
        $context = $openAI->buildContext($plan, 7);

        $contextText = '';
        foreach ($context as $key => $value) {
            if (is_string($value) && $value !== '') {
                $contextText .= "{$key}: {$value}\n";
            }
        }

        $client = OpenAI::client(config('openai.api_key'));
        $model = config('openai.model', 'gpt-4o-mini');

        $response = $client->chat()->create([
            'model' => $model,
            'max_tokens' => 1000,
            'response_format' => ['type' => 'json_object'],
            'messages' => [
                [
                    'role' => 'system',
                    'content' => "Eres un experto en análisis de riesgos para eventos.\n\nTu tarea es identificar EXACTAMENTE 5 riesgos relevantes para el evento dado.\n\nRIESGOS COMUNES: Aglomeraciones, Incendio, Fallo eléctrico, Accidentes del público, Meteorológicos, Altercados, Intrusión, Emergencias médicas, Evacuación ineficaz, Sobreaforo.\n\nDevuelve SOLO un JSON con este formato:\n{\"riesgos\": [{\"nombre\": \"NOMBRE EN MAYÚSCULAS\", \"contexto\": \"Breve descripción del escenario de riesgo\"}]}\n\nElige los 5 riesgos más relevantes para este evento concreto.",
                ],
                [
                    'role' => 'user',
                    'content' => "Contexto del evento:\n{$contextText}",
                ],
            ],
        ]);

        $content = $response->choices[0]->message->content;
        $parsed = json_decode($content, true);

        // Log usage
        if ($response->usage) {
            PlanUsageLog::create([
                'plan_id'           => $plan->id,
                'section_number'    => 7,
                'model'             => $model,
                'type'              => 'generate',
                'prompt_tokens'     => $response->usage->promptTokens ?? 0,
                'completion_tokens' => $response->usage->completionTokens ?? 0,
                'total_tokens'      => $response->usage->totalTokens ?? 0,
                'cost_usd'          => PlanUsageLog::calculateCost($model, $response->usage->promptTokens ?? 0, $response->usage->completionTokens ?? 0),
            ]);
        }

        return response()->json($parsed ?? ['riesgos' => []]);
    }

    /**
     * Paso 2 de sección 7: analizar cada riesgo con streaming secuencial.
     * Hace 1 llamada OpenAI por riesgo (5 llamadas totales en la misma conexión SSE).
     */
    public function analizarRiesgos(Request $request, string $uuid)
    {
        $request->validate(['riesgos' => 'required|array|min:1']);

        $plan = Plan::where('uuid', $uuid)->with('sections')->firstOrFail();
        $planSection = $plan->getSectionByNumber(7);
        $planSection->update(['status' => 'generando']);

        $openAI = new OpenAIService();
        $context = $openAI->buildContext($plan, 7);
        $riesgos = $request->input('riesgos');
        $model = config('openai.model', 'gpt-4o-mini');

        $contextText = '';
        foreach ($context as $key => $value) {
            if (is_string($value) && $value !== '') {
                $contextText .= "{$key}: {$value}\n";
            }
        }

        $systemPrompt = "Eres un experto en análisis de riesgos para eventos. Genera un análisis completo del riesgo asignado siguiendo este formato EXACTO:\n\nRIESGO: [NOMBRE EN MAYÚSCULAS]\n\nDescripción:\n[Escribe 2-3 párrafos explicando: cuándo/cómo se manifiesta el riesgo, qué factores lo desencadenan, y por qué es relevante para este evento específico. Usa datos concretos del evento: aforo, horarios, infraestructura.]\n\nEvaluación Cuantitativa:\n- Función (F): [valor 1-5] - [Justificación específica basada en el evento]\n- Sustitución (S): [valor 1-5] - [Justificación específica basada en el evento]\n- Profundidad (P): [valor 1-5] - [Justificación específica basada en el evento]\n- Extensión (E): [valor 1-5] - [Justificación específica basada en el evento]\n- Probabilidad (A): [valor 1-5] - [Justificación específica basada en el evento]\n- Vulnerabilidad (V): [valor 1-5] - [Justificación específica basada en el evento]\n\nCálculos:\n- I = F × S = [F] × [S] = [resultado]\n- D = P × E = [P] × [E] = [resultado]\n- C = I + D = [I] + [D] = [resultado]\n- PR = A × V = [A] × [V] = [resultado]\n- ER = C × PR = [C] × [PR] = [resultado]\n\nClasificación Final: [Según valor ER]\n\nMedidas Preventivas y de Mitigación:\n1. [Medida específica con números, responsables y recursos]\n2. [Medida específica con números, responsables y recursos]\n3. [Medida específica con números, responsables y recursos]\n4. [Medida específica con números, responsables y recursos]\n5. [Medida específica con números, responsables y recursos]\n6. [Medida específica con números, responsables y recursos]\n7. [Protocolo de actuación en caso de materialización del riesgo]\n\nESCALAS DE EVALUACIÓN (1-5):\nF: 5=Paraliza evento, 4=Afecta gravemente, 3=Moderado, 2=Leve, 1=Mínimo\nS: 5=Insustituible, 4=Muy difícil, 3=Con dificultad, 2=Fácil, 1=Inmediato\nP: 5=Muy graves/múltiples víctimas, 4=Graves/varias víctimas, 3=Moderado, 2=Leve, 1=Mínimo\nE: 5=Todo el recinto, 4=Múltiples zonas, 3=Considerable, 2=Reducida, 1=Localizado\nA: 5=Muy alta, 4=Alta, 3=Normal, 2=Baja, 1=Muy baja\nV: 5=Desprotegido, 4=Insuficiente, 3=Estándar, 2=Bien protegido, 1=Máxima\n\nCLASIFICACIÓN POR ER:\n2-250: MUY BAJO | 251-500: BAJO | 501-750: NORMAL | 751-1000: GRANDE | 1001-1250: ELEVADO\n\nREGLAS:\n- NO uses emojis ni iconos\n- Sé técnico y específico con datos del evento\n- Las medidas deben incluir números concretos y responsables\n- Genera EXACTAMENTE 7 medidas (6 preventivas + 1 protocolo)\n- NO termines hasta completar las 7 medidas";

        return response()->stream(function () use ($riesgos, $contextText, $systemPrompt, $planSection, $plan, $model) {
            $client = OpenAI::client(config('openai.api_key'));
            $fullText = '';
            $totalUsage = ['prompt_tokens' => 0, 'completion_tokens' => 0, 'total_tokens' => 0];

            foreach ($riesgos as $index => $riesgo) {
                $nombre = $riesgo['nombre'] ?? 'Riesgo';
                $contextoRiesgo = $riesgo['contexto'] ?? '';
                $num = $index + 1;

                // Signal start of this risk
                echo "data: " . json_encode(['riesgo_inicio' => $num, 'nombre' => $nombre, 'total' => count($riesgos)]) . "\n\n";
                if (ob_get_level() > 0) ob_flush();
                flush();

                $stream = $client->chat()->createStreamed([
                    'model' => $model,
                    'max_tokens' => 3000,
                    'stream_options' => ['include_usage' => true],
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => "Contexto del evento:\n{$contextText}\n\nRiesgo asignado para analizar:\n{$nombre}: {$contextoRiesgo}"],
                    ],
                ]);

                foreach ($stream as $response) {
                    $text = $response->choices[0]->delta->content ?? '';
                    if ($text !== '') {
                        $fullText .= $text;
                        echo "data: " . json_encode(['text' => $text]) . "\n\n";
                        if (ob_get_level() > 0) ob_flush();
                        flush();
                    }
                    if (!empty($response->usage)) {
                        $totalUsage['prompt_tokens'] += $response->usage->promptTokens ?? 0;
                        $totalUsage['completion_tokens'] += $response->usage->completionTokens ?? 0;
                        $totalUsage['total_tokens'] += $response->usage->totalTokens ?? 0;
                    }
                }

                // Separator between risks
                if ($index < count($riesgos) - 1) {
                    $separator = "\n\n---\n\n";
                    $fullText .= $separator;
                    echo "data: " . json_encode(['text' => $separator]) . "\n\n";
                    if (ob_get_level() > 0) ob_flush();
                    flush();
                }
            }

            // Save complete text
            $planSection->update([
                'generated_text' => $fullText,
                'status' => 'listo',
            ]);

            // Log total usage
            if ($totalUsage['total_tokens'] > 0) {
                PlanUsageLog::create([
                    'plan_id'           => $plan->id,
                    'section_number'    => 7,
                    'model'             => $model,
                    'type'              => 'generate',
                    'prompt_tokens'     => $totalUsage['prompt_tokens'],
                    'completion_tokens' => $totalUsage['completion_tokens'],
                    'total_tokens'      => $totalUsage['total_tokens'],
                    'cost_usd'          => PlanUsageLog::calculateCost($model, $totalUsage['prompt_tokens'], $totalUsage['completion_tokens']),
                ]);
            }

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
