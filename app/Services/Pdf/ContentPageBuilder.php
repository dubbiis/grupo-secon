<?php

namespace App\Services\Pdf;

use App\Models\Plan;
use App\Models\PlanFile;
use Illuminate\Support\Collection;

class ContentPageBuilder
{
    public function __construct(
        private TcpdfInstance $pdf,
        private Plan $plan,
        private string $lang,
    ) {}

    public function build(): void
    {
        $mapping = SectionMapper::getMapping();

        foreach ($mapping as $section) {
            $this->buildSection($section);
        }
    }

    private function buildSection(array $section): void
    {
        $pdfNum = $section['pdf_num'];
        $type = $section['type'];

        // New page for each section
        $this->pdf->AddPage();

        // Section title — use app section name for app sections, translated title for fixed
        $this->pdf->SetY(25);
        FontManager::apply($this->pdf, 'section_title');
        $sectionTitle = $this->getSectionTitle($section);
        $title = "{$pdfNum}. " . mb_strtoupper($sectionTitle);
        $this->pdf->MultiCell(0, 10, $title, 0, 'L', false, 1, 20, null, true);
        $this->pdf->SetY($this->pdf->GetY() + 5);

        // Content based on type
        switch ($type) {
            case 'app_section':
                $this->renderAppSections($section['app_sections']);
                if (!empty($section['has_images'])) {
                    $this->renderSectionImages($section['app_sections']);
                }
                break;

            case 'fixed_text':
                $this->renderFixedText($section['fixed_key']);
                break;

            case 'composite':
                // Risk tables go BEFORE the analysis text
                if (!empty($section['merge_pdf'])) {
                    $this->mergeRiskTables();
                    // New page for the analysis text after the tables
                    $this->pdf->AddPage();
                    $this->pdf->SetY(25);
                }
                $this->renderAppSections($section['app_sections']);
                break;

            case 'annexes':
                $this->renderAnnexes($section['app_sections'], $pdfNum);
                break;
        }
    }

    private function getSectionTitle(array $section): string
    {
        $type = $section['type'];

        if ($type === 'fixed_text') {
            return PdfTranslations::sectionTitle($section['pdf_num'], $this->lang);
        }

        $appSections = $section['app_sections'] ?? [];
        if (!empty($appSections)) {
            $appSection = $this->plan->sections->firstWhere('section_number', $appSections[0]);
            if ($appSection && $appSection->section_name) {
                return $appSection->section_name;
            }
        }

        return PdfTranslations::sectionTitle($section['pdf_num'], $this->lang);
    }

    private function renderAppSections(array $appSections): void
    {
        foreach ($appSections as $i => $secNum) {
            $appSection = $this->plan->sections->firstWhere('section_number', $secNum);

            if (!$appSection || empty($appSection->generated_text)) {
                FontManager::apply($this->pdf, 'body');
                $this->pdf->MultiCell(
                    0, 6,
                    '(Sección pendiente de generar)',
                    0, 'L', false, 1, 20, null, true
                );
                continue;
            }

            // Add spacing between multiple app sections
            if ($i > 0) {
                $this->pdf->SetY($this->pdf->GetY() + 8);
            }

            $text = $appSection->generated_text;
            $this->renderFormattedText($text);
        }
    }

    private function renderFixedText(string $key): void
    {
        $text = FixedTextProvider::getText($key, $this->lang);
        $this->renderFormattedText($text);
    }

    /**
     * Render text with basic formatting:
     * - Lines starting with a number+dot (e.g. "9.1") are rendered as subsections
     * - Lines that are all caps and short are rendered as labels
     * - Everything else is body text
     */
    private function renderFormattedText(string $text): void
    {
        // Strip markdown bold markers — PDF uses font weight via styles, not inline markup
        $text = preg_replace('/\*{1,2}([^*]+)\*{1,2}/', '$1', $text);

        $paragraphs = preg_split('/\n\s*\n/', $text);

        foreach ($paragraphs as $paragraph) {
            $paragraph = trim($paragraph);
            if (empty($paragraph)) continue;

            // Check if it's a subsection header (e.g. "9.1 FUNCIONES...")
            if (preg_match('/^\d+\.\d+\s+/', $paragraph)) {
                FontManager::apply($this->pdf, 'subsection');
                $this->pdf->MultiCell(0, 7, $paragraph, 0, 'L', false, 1, 20, null, true);
                $this->pdf->SetY($this->pdf->GetY() + 2);
                continue;
            }

            // Check if it's a short label line (all caps, under 60 chars)
            if (mb_strlen($paragraph) < 60 && $paragraph === mb_strtoupper($paragraph)) {
                FontManager::apply($this->pdf, 'label');
                $this->pdf->MultiCell(0, 7, $paragraph, 0, 'L', false, 1, 20, null, true);
                $this->pdf->SetY($this->pdf->GetY() + 1);
                continue;
            }

            // Check if it's a bold label (e.g. "Coordinador del servicio")
            if (mb_strlen($paragraph) < 80 && !str_contains($paragraph, '.') && !str_contains($paragraph, ',')) {
                FontManager::apply($this->pdf, 'label');
                $this->pdf->MultiCell(0, 7, $paragraph, 0, 'L', false, 1, 20, null, true);
                $this->pdf->SetY($this->pdf->GetY() + 1);
                continue;
            }

            // Regular body text
            FontManager::apply($this->pdf, 'body');
            $this->pdf->MultiCell(0, 6, $paragraph, 0, 'J', false, 1, 20, null, true);
            $this->pdf->SetY($this->pdf->GetY() + 3);
        }
    }

    private function mergeRiskTables(): void
    {
        $riskTablePath = config("pdf.risk_tables.{$this->lang}")
            ?? config('pdf.risk_tables.es');

        if (!file_exists($riskTablePath)) {
            return;
        }

        // Temporarily disable background for imported pages
        $this->pdf->enableBackground(false);

        $pageCount = $this->pdf->setSourceFile($riskTablePath);
        for ($i = 1; $i <= $pageCount; $i++) {
            $this->pdf->AddPage();
            $tpl = $this->pdf->importPage($i);
            $this->pdf->useTemplate($tpl, 0, 0, 210, 297);
        }

        // Re-enable background and reload the base template
        $this->pdf->enableBackground(true);
        $this->pdf->reloadBackgroundTemplate();
    }

    /**
     * Render annexes section:
     * 1. AI-generated introductory text
     * 2. For each annex: name as subsection + embedded file (PDF pages, images)
     */
    private function renderAnnexes(array $appSections, int $pdfNum): void
    {
        // 1. Render AI intro text
        $this->renderAppSections($appSections);

        // 2. Get annexes list from form_data
        $appSection = $this->plan->sections->firstWhere('section_number', 14);
        if (!$appSection || empty($appSection->form_data['anexos_json'])) {
            return;
        }

        $anexos = json_decode($appSection->form_data['anexos_json'], true);
        if (!is_array($anexos) || empty($anexos)) {
            return;
        }

        // 3. Render each annex with its files
        foreach ($anexos as $i => $anexo) {
            $nombre = $anexo['nombre'] ?? ('Anexo ' . ($i + 1));
            $descripcion = $anexo['descripcion'] ?? '';
            $anexoId = $anexo['id'] ?? '';

            // Get files for this annex
            $anexoFiles = $this->plan->files
                ->where('section_number', 14)
                ->where('file_category', "anexo_{$anexoId}");

            // New page for each annex
            $this->pdf->AddPage();
            $this->pdf->SetY(25);

            // Annex title as subsection
            FontManager::apply($this->pdf, 'subsection');
            $annexNum = $pdfNum . '.' . ($i + 1);
            $this->pdf->MultiCell(0, 8, "{$annexNum} {$nombre}", 0, 'L', false, 1, 20, null, true);

            if ($descripcion) {
                $this->pdf->SetY($this->pdf->GetY() + 2);
                FontManager::apply($this->pdf, 'body');
                $this->pdf->MultiCell(0, 6, $descripcion, 0, 'L', false, 1, 20, null, true);
            }

            $this->pdf->SetY($this->pdf->GetY() + 5);

            // Embed each file
            foreach ($anexoFiles as $file) {
                if (!file_exists($file->absolute_path)) continue;

                $mime = $file->mime_type ?? '';

                if ($mime === 'application/pdf') {
                    // Import PDF pages
                    $this->embedPdfFile($file->absolute_path);
                } elseif (str_starts_with($mime, 'image/')) {
                    // Embed image
                    $this->embedImage($file->absolute_path);
                } else {
                    // For other file types (Word, Excel), just show the filename
                    FontManager::apply($this->pdf, 'body');
                    $icon = $this->getFileIcon($mime);
                    $this->pdf->MultiCell(
                        0, 6,
                        "{$icon} {$file->original_name}",
                        0, 'L', false, 1, 20, null, true
                    );
                    $this->pdf->SetY($this->pdf->GetY() + 3);
                }
            }
        }
    }

    private function embedPdfFile(string $path): void
    {
        $this->pdf->enableBackground(false);

        $pageCount = $this->pdf->setSourceFile($path);
        for ($i = 1; $i <= $pageCount; $i++) {
            $this->pdf->AddPage();
            $tpl = $this->pdf->importPage($i);
            $this->pdf->useTemplate($tpl, 0, 0, 210, 297);
        }

        $this->pdf->enableBackground(true);
        $this->pdf->reloadBackgroundTemplate();
    }

    private function embedImage(string $path): void
    {
        $remainingSpace = 297 - $this->pdf->GetY() - 22;
        if ($remainingSpace < 60) {
            $this->pdf->AddPage();
            $this->pdf->SetY(25);
        }

        // Convert WebP to PNG (TCPDF doesn't support WebP)
        $imagePath = $path;
        $mime = mime_content_type($path) ?: '';
        if (str_contains($mime, 'webp')) {
            $img = @imagecreatefromwebp($path);
            if (!$img) return;
            $tmpPath = sys_get_temp_dir() . '/embed_' . md5($path) . '.png';
            imagepng($img, $tmpPath);
            imagedestroy($img);
            $imagePath = $tmpPath;
        }

        $this->pdf->Image(
            $imagePath,
            20, $this->pdf->GetY(),
            170, 0,
            '', '', '', false, 300, '', false, false, 0
        );

        $this->pdf->SetY($this->pdf->GetY() + 10);
    }

    private function getFileIcon(string $mime): string
    {
        if (str_contains($mime, 'word') || str_contains($mime, 'document')) return '[DOC]';
        if (str_contains($mime, 'excel') || str_contains($mime, 'spreadsheet')) return '[XLS]';
        if (str_contains($mime, 'presentation') || str_contains($mime, 'powerpoint')) return '[PPT]';
        return '[FILE]';
    }

    private function renderSectionImages(array $appSections): void
    {
        foreach ($appSections as $secNum) {
            $files = $this->plan->files
                ->where('section_number', $secNum)
                ->filter(fn(PlanFile $f) => str_starts_with($f->mime_type ?? '', 'image/'));

            foreach ($files as $file) {
                if (!file_exists($file->absolute_path)) continue;

                // Check if there's enough space on current page
                $remainingSpace = 297 - $this->pdf->GetY() - 22;
                if ($remainingSpace < 60) {
                    $this->pdf->AddPage();
                    $this->pdf->SetY(25);
                }

                $maxW = 170;
                $maxH = min($remainingSpace, 180);

                $this->pdf->Image(
                    $file->absolute_path,
                    20, $this->pdf->GetY(),
                    $maxW, 0, // 0 height = auto-proportional
                    '', '', '', false, 300, '', false, false, 0
                );

                // Move Y down (approximate, since we don't know actual image height easily)
                $this->pdf->SetY($this->pdf->GetY() + 10);
            }
        }
    }
}
