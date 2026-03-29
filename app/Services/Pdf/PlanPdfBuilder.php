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

        // 2. Index page (with background) — page numbers filled in after content
        $indexBuilder = new IndexPageBuilder($pdf, $plan, $lang);
        $indexBuilder->build();

        // 3. Content pages (with background) — returns section start pages
        $sectionPages = (new ContentPageBuilder($pdf, $plan, $lang))->build();

        // 4. Fill in page numbers in the index
        $indexBuilder->fillPageNumbers($sectionPages);

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
