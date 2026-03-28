<?php

namespace App\Services;

use App\Models\Plan;
use App\Services\Pdf\PlanPdfBuilder;

class PdfService
{
    public function generate(Plan $plan): string
    {
        $plan->load(['sections' => fn($q) => $q->orderBy('section_number'), 'files']);

        // Language from section 15 form_data
        $sec15 = $plan->sections->firstWhere('section_number', 15);
        $lang = $sec15?->form_data['language'] ?? 'es';

        return (new PlanPdfBuilder())->build($plan, $lang);
    }
}
