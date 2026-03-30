<?php

namespace App\Services\Pdf;

use App\Models\Plan;
use Illuminate\Support\Facades\Storage;

class CoverPageBuilder
{
    public function __construct(
        private TcpdfInstance $pdf,
        private Plan $plan,
        private string $lang,
    ) {}

    public function build(): void
    {
        $this->pdf->enableBackground(false);
        $this->pdf->setPrintFooter(false); // No footer on cover
        $this->pdf->SetMargins(0, 0, 0);
        $this->pdf->SetAutoPageBreak(false, 0);
        $this->pdf->AddPage();

        $pageW = 210;

        // Cover image as FULL PAGE BACKGROUND
        $this->addCoverBackground();

        // Logo centered at top
        $logoPath = public_path('images/logo-secon.svg');
        if (file_exists($logoPath)) {
            $logoW = 50;
            $logoX = ($pageW - $logoW) / 2;
            $this->pdf->ImageSVG($logoPath, $logoX, 25, $logoW);
        }

        // "PLAN DE SEGURIDAD" / "SECURITY PLAN" title
        $this->pdf->SetY(80);
        FontManager::apply($this->pdf, 'cover_title');
        $title = PdfTranslations::get('cover_title', $this->lang);
        $this->pdf->MultiCell($pageW, 22, $title, 0, 'C', false, 1, 0, null, true);

        // Blue separator line
        $lineY = $this->pdf->GetY() + 5;
        $lineW = 40;
        $lineX = ($pageW - $lineW) / 2;
        $this->pdf->SetDrawColor(34, 58, 129);
        $this->pdf->SetLineWidth(0.8);
        $this->pdf->Line($lineX, $lineY, $lineX + $lineW, $lineY);

        // Event name
        $this->pdf->SetY($lineY + 10);
        FontManager::apply($this->pdf, 'cover_event');
        $eventName = $this->getEventName();
        $this->pdf->MultiCell($pageW, 14, strtoupper($eventName), 0, 'C', false, 1, 0, null, true);

        // Location
        $this->pdf->SetY($this->pdf->GetY() + 3);
        FontManager::apply($this->pdf, 'cover_location');
        $location = $this->getLocation();
        $this->pdf->MultiCell($pageW, 10, strtoupper($location), 0, 'C', false, 1, 0, null, true);

        // Restore margins and settings for content pages
        $this->pdf->SetMargins(20, 25, 20);
        $this->pdf->SetAutoPageBreak(true, 22);
        $this->pdf->setPrintFooter(true);
        $this->pdf->enableBackground(true);
    }

    private function getEventName(): string
    {
        $sec1 = $this->plan->sections->firstWhere('section_number', 1);
        if ($sec1 && $sec1->form_data) {
            return $sec1->form_data['nombre_evento'] ?? $this->plan->title ?? '';
        }
        return $this->plan->title ?? '';
    }

    private function getLocation(): string
    {
        $sec1 = $this->plan->sections->firstWhere('section_number', 1);
        if ($sec1 && $sec1->form_data) {
            $parts = array_filter([
                $sec1->form_data['nombre_recinto'] ?? '',
                $sec1->form_data['direccion_evento'] ?? '',
            ]);
            return implode(', ', $parts);
        }
        return '';
    }

    private function addCoverBackground(): void
    {
        $coverFile = $this->plan->files
            ->where('section_number', 15)
            ->where('file_category', 'portada')
            ->sortByDesc('id')
            ->first();

        if (!$coverFile) {
            \Log::warning('PDF cover: no portada record in DB for plan ' . $this->plan->uuid);
            return;
        }

        // Resolve path using Storage disk
        $path = Storage::disk('public')->path($coverFile->file_path);

        if (!file_exists($path)) {
            \Log::warning("PDF cover: file not on disk: {$path} (file_path={$coverFile->file_path})");
            return;
        }

        $mime = $coverFile->mime_type ?? mime_content_type($path) ?? '';

        // Convert WebP to PNG (TCPDF doesn't support WebP)
        $imagePath = $path;
        if (str_contains($mime, 'webp')) {
            $img = @imagecreatefromwebp($path);
            if (!$img) {
                \Log::warning("PDF cover: imagecreatefromwebp failed for {$path}");
                return;
            }
            $tmpPath = sys_get_temp_dir() . '/cover_' . md5($path) . '.png';
            imagepng($img, $tmpPath, 1);
            imagedestroy($img);
            $imagePath = $tmpPath;
        }

        // Full page cover — stretch to fill A4 (210x297mm)
        $this->pdf->Image(
            $imagePath,
            0, 0, 210, 297,
            '', '', '', false, 300, '', false, false, 0
        );

        \Log::info("PDF cover: rendered {$imagePath} as full-page background");
    }
}
