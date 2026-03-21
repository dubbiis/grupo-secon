<?php

namespace App\Services;

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

    public function streamGenerate(PromptTemplate $template, array $variables, callable $onChunk): ?array
    {
        $userPrompt = $template->buildUserPrompt($variables);

        if ($template->use_example_output && $template->example_output) {
            $userPrompt .= "\n\n---\n**Texto de ejemplo como referencia de estilo y formato** (no lo copies literalmente, úsalo solo como guía de estructura, extensión y tono):\n\n" . $template->example_output;
        }

        $stream = $this->client->chat()->createStreamed([
            'model' => $template->model,
            'max_tokens' => $template->max_tokens,
            'stream_options' => ['include_usage' => true],
            'messages' => [
                ['role' => 'system', 'content' => $template->system_prompt],
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

    public function streamCambios(string $textoAnterior, string $instrucciones, callable $onChunk): ?array
    {
        $stream = $this->client->chat()->createStreamed([
            'model' => config('openai.model', 'gpt-4o-mini'),
            'max_tokens' => 6000,
            'stream_options' => ['include_usage' => true],
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'Eres un redactor experto en Planes de Seguridad Privada. Tu tarea es aplicar las correcciones solicitadas al texto existente, manteniendo el estilo profesional y técnico. Solo modifica lo que se te pide. No añadas ni elimines contenido no relacionado con las instrucciones. Responde únicamente con el texto corregido, sin explicaciones.',
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

        // Variables globales del plan (de sección 1)
        $sec1 = $plan->getSectionByNumber(1);
        if ($sec1 && $sec1->form_data) {
            $context = array_merge($context, $sec1->form_data);
        }

        // Fechas y horarios (sección 2)
        $sec2 = $plan->getSectionByNumber(2);
        if ($sec2 && $sec2->form_data) {
            foreach (['fecha_evento', 'horario_evento', 'num_asistentes', 'montaje_desmontaje'] as $key) {
                if (!empty($sec2->form_data[$key])) {
                    $context[$key] = $sec2->form_data[$key];
                }
            }
        }

        // Aforo y accesos (sección 4)
        $sec4 = $plan->getSectionByNumber(4);
        if ($sec4 && $sec4->form_data) {
            foreach (['aforo_total', 'num_accesos'] as $key) {
                if (!empty($sec4->form_data[$key])) {
                    $context[$key] = $sec4->form_data[$key];
                }
            }
        }

        // Perfil del público (sección 6)
        $sec6 = $plan->getSectionByNumber(6);
        if ($sec6 && $sec6->form_data) {
            foreach (['perfil_publico', 'rango_edad', 'ambito_geografico'] as $key) {
                if (!empty($sec6->form_data[$key])) {
                    $context[$key] = $sec6->form_data[$key];
                }
            }
            $vips = json_decode($sec6->form_data['vips_json'] ?? '[]', true);
            $context['hay_vips'] = (!empty($vips) && count($vips) > 0) ? 'Sí' : 'No';
        }

        // Contexto acumulado de secciones anteriores (para sección 7)
        if ($currentSection === 7) {
            $sections = $plan->sections()
                ->where('section_number', '<', 7)
                ->whereIn('status', ['listo', 'editado'])
                ->get();
            if ($sections->count() > 0) {
                $resumen = [];
                foreach ($sections as $s) {
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
