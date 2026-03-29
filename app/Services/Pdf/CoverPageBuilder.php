<?php

namespace App\Services\Pdf;

use App\Models\Plan;

class CoverPageBuilder
{
    public function __construct(
        private TcpdfInstance $pdf,
        private Plan $plan,
        private string $lang,
    ) {}

    public function build(): void
    {
        // Cover page has NO background template
        $this->pdf->enableBackground(false);
        $this->pdf->AddPage();

        $pageW = 210;
        $pageH = 297;

        // Cover image as FULL PAGE BACKGROUND (behind everything)
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
        $this->pdf->MultiCell(0, 22, $title, 0, 'C', false, 1, 20, null, true);

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
        $this->pdf->MultiCell(0, 14, strtoupper($eventName), 0, 'C', false, 1, 20, null, true);

        // Location
        $this->pdf->SetY($this->pdf->GetY() + 3);
        FontManager::apply($this->pdf, 'cover_location');
        $location = $this->getLocation();
        $this->pdf->MultiCell(0, 10, strtoupper($location), 0, 'C', false, 1, 20, null, true);

        // Re-enable background for subsequent pages
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
        // Get the latest portada file that actually exists on disk
        $coverFile = $this->plan->files
            ->where('section_number', 15)
            ->where('file_category', 'portada')
            ->sortByDesc('id')
            ->first(fn($f) => file_exists(\Storage::disk('public')->path($f->file_path)));

        if (!$coverFile) {
            \Log::info('PDF cover: no portada file found for plan ' . $this->plan->uuid);
            return;
        }

        $path = $coverFile->absolute_path;
        \Log::info("PDF cover: file_path={$coverFile->file_path}, absolute={$path}, exists=" . (file_exists($path) ? 'yes' : 'no'));

        if (!file_exists($path)) {
            // Try with Storage disk directly
            $path = storage_path('app/public/' . $coverFile->file_path);
            \Log::info("PDF cover: retry path={$path}, exists=" . (file_exists($path) ? 'yes' : 'no'));
            if (!file_exists($path)) {
                return;
            }
        }

        $mime = $coverFile->mime_type ?? '';
        if (!str_starts_with($mime, 'image/')) {
            return;
        }

        // TCPDF doesn't support WebP — convert to PNG on the fly
        $imagePath = $path;
        if (str_contains($mime, 'webp')) {
            $img = @imagecreatefromwebp($path);
            if (!$img) return;
            $tmpPath = sys_get_temp_dir() . '/cover_' . md5($path) . '.png';
            imagepng($img, $tmpPath);
            imagedestroy($img);
            $imagePath = $tmpPath;
        }

        // Full page background — cover mode (fill page, crop overflow)
        // Get image dimensions to calculate cover scaling
        $imgSize = @getimagesize($imagePath);
        if ($imgSize) {
            $imgW = $imgSize[0];
            $imgH = $imgSize[1];
            $pageW = 210;
            $pageH = 297;

            // Scale to cover: the larger ratio wins
            $scaleW = $pageW / $imgW;
            $scaleH = $pageH / $imgH;
            $scale = max($scaleW, $scaleH);

            $drawW = $imgW * $scale;
            $drawH = $imgH * $scale;

            // Center the overflow
            $drawX = ($pageW - $drawW) / 2;
            $drawY = ($pageH - $drawH) / 2;

            $this->pdf->Image(
                $imagePath,
                $drawX, $drawY, $drawW, $drawH,
                '', '', '', false, 300, '', false, false, 0
            );
        } else {
            // Fallback: stretch to page
            $this->pdf->Image(
                $imagePath,
                0, 0, 210, 297,
                '', '', '', false, 300, '', false, false, 0
            );
        }
    }
}
