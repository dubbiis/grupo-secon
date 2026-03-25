<?php

namespace App\Services;

use App\Models\CustomQuestion;
use App\Models\Plan;
use App\Models\PromptTemplate;
use OpenAI;

class OpenAIService
{
    private $client;

    public function __construct()
    {
        $this->client = OpenAI::client(config('openai.api_key'));
    }

    public function streamGenerate(PromptTemplate $template, array $variables, callable $onChunk, string $lang = 'es'): ?array
    {
        $userPrompt = $template->buildUserPrompt($variables);

        // Inject custom question answers as additional context
        if (!empty($variables['custom_answers']) && is_array($variables['custom_answers'])) {
            $ids = array_keys($variables['custom_answers']);
            $questions = CustomQuestion::whereIn('id', $ids)->get()->keyBy('id');
            $extra = [];
            foreach ($variables['custom_answers'] as $qId => $answer) {
                if ($answer === '' || $answer === null) continue;
                $q = $questions->get((int) $qId);
                if ($q) $extra[] = "{$q->question_text}: {$answer}";
            }
            if (!empty($extra)) {
                $userPrompt .= "\n\nInformación adicional proporcionada por el cliente:\n" . implode("\n", $extra);
            }
        }

        if ($template->use_example_output && $template->example_output) {
            $userPrompt .= "\n\n---\nPLANTILLA A COMPLETAR — El siguiente texto es una plantilla. Reproduce este texto EXACTAMENTE tal cual, pero sustituye las variables entre llaves {{variable}} y los datos de ejemplo por los datos reales del evento proporcionados arriba. No cambies la estructura, el orden de los párrafos ni el estilo de redacción. Solo reemplaza los datos de ejemplo por los datos reales. Si un dato no está disponible, déjalo como [pendiente de completar]:\n\n" . $template->example_output;
        }

        $systemPrompt = $template->system_prompt;

        // Global rules for all AI generations
        $systemPrompt .= "\n\nREGLAS OBLIGATORIAS:\n- NO incluyas conclusión, resumen final ni párrafo de cierre a menos que se pida explícitamente.\n- NO uses encabezados markdown (###, ##, #). Usa texto corrido con párrafos y negritas (**texto**) para dar estructura.\n- NO uses emojis ni iconos.\n- NO inventes datos, nombres, cifras ni información que no esté en el contexto proporcionado. Si no tienes un dato, omítelo o indica que debe completarse.\n- Si se proporciona un texto de referencia, sigue su estructura y extensión de forma estricta.";

        if ($lang !== 'es') {
            $langName = match($lang) { 'en' => 'English', default => 'Spanish' };
            $systemPrompt .= "\n\nIMPORTANT: Respond entirely in {$langName}.";
        }

        $stream = $this->client->chat()->createStreamed([
            'model' => $template->model,
            'max_tokens' => $template->max_tokens,
            'stream_options' => ['include_usage' => true],
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
            ],
        ]);

        $usage = null;
        foreach ($stream as $response) {
            $text = $response->choices[0]->delta->content ?? '';
            if ($text !== '') {
                $onChunk($text);
            }
            if (!empty($response->usage)) {
                $usage = [
                    'prompt_tokens'     => $response->usage->promptTokens ?? 0,
                    'completion_tokens' => $response->usage->completionTokens ?? 0,
                    'total_tokens'      => $response->usage->totalTokens ?? 0,
                ];
            }
        }

        return $usage;
    }

    public function streamCambios(string $textoAnterior, string $instrucciones, callable $onChunk, string $lang = 'es'): ?array
    {
        $sysPrompt = 'Eres un redactor experto en Planes de Seguridad Privada. Tu tarea es aplicar las correcciones solicitadas al texto existente, manteniendo el estilo profesional y técnico. Solo modifica lo que se te pide. No añadas ni elimines contenido no relacionado con las instrucciones. Responde únicamente con el texto corregido, sin explicaciones.';
        if ($lang !== 'es') {
            $langName = match($lang) { 'en' => 'English', default => 'Spanish' };
            $sysPrompt .= "\n\nIMPORTANT: Respond entirely in {$langName}.";
        }

        $stream = $this->client->chat()->createStreamed([
            'model' => config('openai.model', 'gpt-4o-mini'),
            'max_tokens' => 6000,
            'stream_options' => ['include_usage' => true],
            'messages' => [
                [
                    'role' => 'system',
                    'content' => $sysPrompt,
                ],
                [
                    'role' => 'user',
                    'content' => "Texto original:\n\n{$textoAnterior}\n\n---\n\nInstrucciones de cambio:\n{$instrucciones}",
                ],
            ],
        ]);

        $usage = null;
        foreach ($stream as $response) {
            $text = $response->choices[0]->delta->content ?? '';
            if ($text !== '') {
                $onChunk($text);
            }
            if (!empty($response->usage)) {
                $usage = [
                    'prompt_tokens'     => $response->usage->promptTokens ?? 0,
                    'completion_tokens' => $response->usage->completionTokens ?? 0,
                    'total_tokens'      => $response->usage->totalTokens ?? 0,
                ];
            }
        }

        return $usage;
    }

    public function buildContext(Plan $plan, int $currentSection): array
    {
        $context = [];

        // Include ALL scalar form data from every section (ordered by section number)
        // This ensures new fields added to any section automatically reach the AI
        $allSections = $plan->sections->sortBy('section_number');
        foreach ($allSections as $section) {
            if (!$section->form_data) continue;
            foreach ($section->form_data as $key => $value) {
                if ($key === 'custom_answers') continue; // handled separately in streamGenerate
                if (is_array($value) || is_object($value)) continue;
                if ($value !== null && $value !== '') {
                    $context[$key] = $value;
                }
            }
        }

        // Serialize known array fields to readable text
        foreach ($allSections as $section) {
            if (!$section->form_data) continue;

            // accesos_detalle → "Nombre: descripción" lines
            if (!empty($section->form_data['accesos_detalle']) && is_array($section->form_data['accesos_detalle'])) {
                $lines = array_map(
                    fn($a) => trim(($a['nombre'] ?? '') . ': ' . ($a['descripcion'] ?? '')),
                    $section->form_data['accesos_detalle']
                );
                $text = implode("\n", array_filter($lines, fn($l) => strlen($l) > 2));
                if ($text) $context['accesos_detalle'] = $text;
            }

            // vips_json → list of VIP names
            if (!empty($section->form_data['vips_json'])) {
                $vips = json_decode($section->form_data['vips_json'], true);
                if (is_array($vips) && count($vips) > 0) {
                    $context['hay_vips'] = 'Sí';
                    $context['lista_vips'] = implode(', ', array_column($vips, 'nombre'));
                } else {
                    $context['hay_vips'] = 'No';
                }
            }
        }

        // For section 7: also include generated text summary from previous sections
        if ($currentSection === 7) {
            $prevSections = $plan->sections()
                ->where('section_number', '<', 7)
                ->whereIn('status', ['listo', 'editado'])
                ->get();
            if ($prevSections->count() > 0) {
                $resumen = [];
                foreach ($prevSections as $s) {
                    if ($s->generated_text) {
                        $resumen[] = "### {$s->section_name}\n" . substr($s->generated_text, 0, 500) . '...';
                    }
                }
                $context['contexto_secciones_anteriores'] = implode("\n\n", $resumen);
            }
        }

        return $context;
    }
}
