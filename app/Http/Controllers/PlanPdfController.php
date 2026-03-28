<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Services\PdfService;
use Illuminate\Support\Facades\Gate;

class PlanPdfController extends Controller
{
    public function preview(string $uuid)
    {
        $plan = Plan::where('uuid', $uuid)
            ->with(['sections', 'files'])
            ->firstOrFail();

        Gate::authorize('view', $plan);

        $pdfContent = (new PdfService())->generate($plan);

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="plan-' . $uuid . '.pdf"',
        ]);
    }

    public function download(string $uuid)
    {
        $plan = Plan::where('uuid', $uuid)
            ->with(['sections', 'files'])
            ->firstOrFail();

        Gate::authorize('view', $plan);

        $pdfContent = (new PdfService())->generate($plan);

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="plan-' . $uuid . '.pdf"',
        ]);
    }
}
