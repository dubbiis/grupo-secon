<?php

namespace App\Services\Pdf;

use App\Models\Plan;

class PlanPdfBuilder
{
    public function build(Plan $plan, string $lang = 'es'): string
    {
        $plan->load(['sections' => fn($q) => $q->orderBy('section_number'), 'files']);

        // Create TCPDF+FPDI instance
        $pdf = new TcpdfInstance();

        // Register custom fonts
        FontManager::registerFonts($pdf);

        // Load background template
        $pdf->setBackgroundTemplate(config('pdf.base_template'));

        // Set event name for footer
        $eventName = $this->getEventName($plan);
        $pdf->setEventName($eventName);

        // 1. Cover page (no background)
        (new CoverPageBuilder($pdf, $plan, $lang))->build();

        // 2. Index page (with background)
        (new IndexPageBuilder($pdf, $plan, $lang))->build();

        // 3. Content pages (with background)
        (new ContentPageBuilder($pdf, $plan, $lang))->build();

        return $pdf->Output('', 'S');
    }

    private function getEventName(Plan $plan): string
    {
        $sec1 = $plan->sections->firstWhere('section_number', 1);
        if ($sec1 && $sec1->form_data) {
            return $sec1->form_data['nombre_evento'] ?? $plan->title ?? '';
        }
        return $plan->title ?? '';
    }
}
