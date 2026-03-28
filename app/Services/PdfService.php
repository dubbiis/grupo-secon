<?php

namespace App\Services;

use App\Models\Plan;
use App\Services\Pdf\PlanPdfBuilder;

class PdfService
{
    public function generate(Plan $plan): string
    {
        $plan->load(['sections' => fn($q) => $q->orderBy('section_number'), 'files']);

        $branding = $plan->branding ?? [];
        $lang = $branding['language'] ?? 'es';

        return (new PlanPdfBuilder())->build($plan, $lang);
    }
}
