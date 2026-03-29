<?php

namespace App\Services\Pdf;

use App\Models\Plan;

class IndexPageBuilder
{
    private int $indexPageNum;
    private array $entryPositions = []; // [pdf_num => Y position]

    public function __construct(
        private TcpdfInstance $pdf,
        private Plan $plan,
        private string $lang,
    ) {}

    /**
     * Build the index page with titles and dot leaders.
     * Page numbers are filled in later via fillPageNumbers().
     */
    public function build(): void
    {
        $this->pdf->AddPage();
        $this->indexPageNum = $this->pdf->getPage();

        // INDEX title
        $this->pdf->SetY(30);
        FontManager::apply($this->pdf, 'index_title');
        $indexTitle = PdfTranslations::get('index', $this->lang);
        $this->pdf->Cell(0, 12, $indexTitle, 0, 1, 'L');

        $this->pdf->SetY($this->pdf->GetY() + 8);

        // Build index entries
        $mapping = SectionMapper::getMapping();
        $pageW = 210;
        $marginL = 20;
        $marginR = 20;
        $usableW = $pageW - $marginL - $marginR; // 170mm

        foreach ($mapping as $section) {
            $num = $section['pdf_num'];
            $title = $this->getSectionTitle($section);
            $entry = "{$num}. " . mb_strtoupper($title);

            $y = $this->pdf->GetY();
            $this->entryPositions[$num] = $y;

            // Draw the title text
            FontManager::apply($this->pdf, 'index_entry');
            $titleW = $this->pdf->GetStringWidth($entry) + 2;

            // Page number placeholder width
            $pageNumW = 15;
            $dotsW = $usableW - $titleW - $pageNumW;

            // Title
            $this->pdf->SetX($marginL);
            $this->pdf->Cell($titleW, 8, $entry, 0, 0, 'L');

            // Dot leaders
            if ($dotsW > 5) {
                $dotChar = '.';
                $dotW = $this->pdf->GetStringWidth($dotChar . ' ');
                $numDots = max(0, (int) floor($dotsW / $dotW));
                $dots = str_repeat($dotChar . ' ', $numDots);
                $this->pdf->SetTextColor(180, 180, 180);
                $this->pdf->Cell($dotsW, 8, $dots, 0, 0, 'L');
                // Restore text color
                FontManager::apply($this->pdf, 'index_entry');
            }

            // Page number placeholder (will be filled later)
            $this->pdf->Cell($pageNumW, 8, '', 0, 1, 'R');
        }
    }

    /**
     * Called after all content is generated to fill in actual page numbers.
     * @param array $sectionPages [pdf_num => page_number]
     */
    public function fillPageNumbers(array $sectionPages): void
    {
        $currentPage = $this->pdf->getPage();

        // Go back to the index page
        $this->pdf->setPage($this->indexPageNum);

        $pageW = 210;
        $marginR = 20;

        foreach ($sectionPages as $pdfNum => $pageNum) {
            if (!isset($this->entryPositions[$pdfNum])) continue;

            $y = $this->entryPositions[$pdfNum];
            $this->pdf->SetY($y);
            $this->pdf->SetX($pageW - $marginR - 15);

            FontManager::apply($this->pdf, 'index_entry');
            $this->pdf->Cell(15, 8, (string) $pageNum, 0, 0, 'R');
        }

        // Return to the last page
        $this->pdf->setPage($currentPage);
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
}
