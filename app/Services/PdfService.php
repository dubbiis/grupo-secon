<?php

namespace App\Services;

use App\Models\Plan;
use Barryvdh\DomPDF\Facade\Pdf;

class PdfService
{
    public function generate(Plan $plan)
    {
        $plan->load(['sections' => fn($q) => $q->orderBy('section_number'), 'files']);

        $branding = $plan->branding ?? [];
        $palette = $this->getPalette($branding['paleta'] ?? 'secon');

        $data = [
            'plan' => $plan,
            'sections' => $plan->sections,
            'files' => $plan->files,
            'palette' => $palette,
            'branding' => $branding,
        ];

        return Pdf::loadView('pdf.plan-seguridad', $data)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => false,
                'defaultFont' => 'sans-serif',
            ]);
    }

    private function getPalette(string $name): array
    {
        return match ($name) {
            'elegante'   => ['primary' => '#1A1A1A', 'accent' => '#C9A96E'],
            'energia'    => ['primary' => '#CC0000', 'accent' => '#1A1A1A'],
            'naturaleza' => ['primary' => '#2E7D32', 'accent' => '#F5F5F5'],
            'moderno'    => ['primary' => '#6B21A8', 'accent' => '#06B6D4'],
            default      => ['primary' => '#253C87', 'accent' => '#208DCA'], // secon
        };
    }
}
