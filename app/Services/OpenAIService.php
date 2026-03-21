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

    public function streamGenerate(PromptTemplate $template, array $variables, callable $onChunk): void
    {
        $userPrompt = $template->buildUserPrompt($variables);

        $stream = $this->client->chat()->createStreamed([
            'model' => $template->model,
            'max_tokens' => $template->max_tokens,
            'messages' => [
                ['role' => 'system', 'content' => $template->system_prompt],
                ['role' => 'user', 'content' => $userPrompt],
            ],
        ]);

        foreach ($stream as $response) {
            $text = $response->choices[0]->delta->content ?? '';
            if ($text !== '') {
                $onChunk($text);
            }
        }
    }

    public function streamCambios(string $textoAnterior, string $instrucciones, callable $onChunk): void
    {
        $stream = $this->client->chat()->createStreamed([
            'model' => config('openai.model', 'gpt-4o-mini'),
            'max_tokens' => 6000,
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

        foreach ($stream as $response) {
            $text = $response->choices[0]->delta->content ?? '';
            if ($text !== '') {
                $onChunk($text);
            }
        }
    }

    public function buildContext(Plan $plan, int $currentSection): array
    {
        $context = [];
        $sections = $plan->sections()->where('section_number', '<', $currentSection)
            ->whereIn('status', ['listo', 'editado'])
            ->get();

        // Variables globales del plan (de sección 1)
        $sec1 = $plan->getSectionByNumber(1);
        if ($sec1 && $sec1->form_data) {
            $context = array_merge($context, $sec1->form_data);
        }

        // Contexto acumulado de secciones anteriores (para sección 7)
        if ($currentSection === 7 && $sections->count() > 0) {
            $resumen = [];
            foreach ($sections as $s) {
                if ($s->generated_text) {
                    $resumen[] = "### {$s->section_name}\n" . substr($s->generated_text, 0, 500) . '...';
                }
            }
            $context['contexto_secciones_anteriores'] = implode("\n\n", $resumen);
        }

        return $context;
    }
}
