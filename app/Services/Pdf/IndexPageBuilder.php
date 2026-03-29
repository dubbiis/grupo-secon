<?php

namespace App\Services\Pdf;

use App\Models\Plan;

class IndexPageBuilder
{
    public function __construct(
        private TcpdfInstance $pdf,
        private Plan $plan,
        private string $lang,
    ) {}

    public function build(): void
    {
        $this->pdf->AddPage();

        // INDEX title
        $this->pdf->SetY(30);
        FontManager::apply($this->pdf, 'index_title');
        $indexTitle = PdfTranslations::get('index', $this->lang);
        $this->pdf->Cell(0, 12, $indexTitle, 0, 1, 'L');

        $this->pdf->SetY($this->pdf->GetY() + 8);

        // Build index entries from mapping
        $mapping = SectionMapper::getMapping();
        FontManager::apply($this->pdf, 'index_entry');

        foreach ($mapping as $section) {
            $num = $section['pdf_num'];
            $title = $this->getSectionTitle($section);
            $entry = "{$num}. " . mb_strtoupper($title);

            $this->pdf->Cell(0, 8, $entry, 0, 1, 'L');
        }
    }

    /**
     * Get the title for an index entry:
     * - app_section / composite / annexes: use the app section name from the plan
     * - fixed_text: use the translated fixed title
     */
    private function getSectionTitle(array $section): string
    {
        $type = $section['type'];

        // Fixed text sections always use the translated title
        if ($type === 'fixed_text') {
            return PdfTranslations::sectionTitle($section['pdf_num'], $this->lang);
        }

        // For app sections, use the section_name from the plan
        $appSections = $section['app_sections'] ?? [];
        if (!empty($appSections)) {
            $appSection = $this->plan->sections->firstWhere('section_number', $appSections[0]);
            if ($appSection && $appSection->section_name) {
                return $appSection->section_name;
            }
        }

        // Fallback to translated title
        return PdfTranslations::sectionTitle($section['pdf_num'], $this->lang);
    }
}
