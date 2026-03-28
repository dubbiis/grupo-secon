<?php

namespace App\Services\Pdf;

class IndexPageBuilder
{
    public function __construct(
        private TcpdfInstance $pdf,
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

        // Section entries
        $mapping = SectionMapper::getMapping();
        FontManager::apply($this->pdf, 'index_entry');

        foreach ($mapping as $section) {
            $num = $section['pdf_num'];
            $title = PdfTranslations::sectionTitle($num, $this->lang);
            $entry = "{$num}. {$title}";

            $this->pdf->Cell(0, 8, $entry, 0, 1, 'L');
        }
    }
}
