<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Services\PdfService;

class PlanPdfController extends Controller
{
    public function preview(string $uuid)
    {
        $plan = Plan::where('uuid', $uuid)
            ->with(['sections', 'files'])
            ->firstOrFail();

        $this->authorize('view', $plan);

        $pdf = (new PdfService())->generate($plan);
        return $pdf->stream("plan-{$uuid}.pdf");
    }

    public function download(string $uuid)
    {
        $plan = Plan::where('uuid', $uuid)
            ->with(['sections', 'files'])
            ->firstOrFail();

        $this->authorize('view', $plan);

        $pdf = (new PdfService())->generate($plan);
        return $pdf->download("plan-{$uuid}.pdf");
    }
}
