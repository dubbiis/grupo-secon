<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use setasign\Fpdi\Tcpdf\Fpdi;

class AddTitleToRiskTables extends Command
{
    protected $signature = 'pdf:add-risk-titles';
    protected $description = 'Generate risk table PDFs with title + base template (logo + footer bar)';

    public function handle(): int
    {
        $fontsPath = config('pdf.fonts_path') . '/';
        $assetsPath = storage_path('app/pdf-assets');
        $baseTplPath = config('pdf.base_template');

        $versions = [
            'es' => [
                'source' => $assetsPath . '/risk-tables-es-original.pdf',
                'output' => $assetsPath . '/risk-tables-es.pdf',
                'title'  => '7. ANÁLISIS DE RIESGOS Y MEDIDAS PREVENTIVAS',
            ],
            'en' => [
                'source' => $assetsPath . '/risk-tables-en-original.pdf',
                'output' => $assetsPath . '/risk-tables-en.pdf',
                'title'  => '7. RISK ASSESSMENT AND PREVENTIVE MEASURES',
            ],
        ];

        foreach ($versions as $lang => $config) {
            if (!file_exists($config['source'])) {
                $this->error("Original file not found: {$config['source']}");
                continue;
            }

            $pdf = new Fpdi('P', 'mm', 'A4', true, 'UTF-8');
            $pdf->setPrintHeader(false);
            $pdf->setPrintFooter(false);
            $pdf->SetMargins(0, 0, 0);
            $pdf->SetAutoPageBreak(false, 0);

            // Register fonts
            $pdf->AddFont('helveticaneueblackcondensed', '', $fontsPath . 'helveticaneueblackcondensed.php');
            $pdf->AddFont('helveticaneueroman', '', $fontsPath . 'helveticaneueroman.php');

            // Import base template
            $pdf->setSourceFile($baseTplPath);
            $baseTpl = $pdf->importPage(1);

            // Import risk tables
            $tablePageCount = $pdf->setSourceFile($config['source']);

            for ($i = 1; $i <= $tablePageCount; $i++) {
                $pdf->AddPage();

                // 1. Paint base template first (logo + blue bar)
                // Re-import base template (source file changed)
                $pdf->setSourceFile($baseTplPath);
                $bgTpl = $pdf->importPage(1);
                $pdf->useTemplate($bgTpl, 0, 0, 210, 297);

                // 2. Paint the risk table page on top
                $pdf->setSourceFile($config['source']);
                $tableTpl = $pdf->importPage($i);
                // Offset the table content to avoid overlapping the logo area
                // Table starts at y=35 on first page (after title), y=20 on subsequent
                if ($i === 1) {
                    $pdf->useTemplate($tableTpl, 0, 38, 210, 247);
                } else {
                    $pdf->useTemplate($tableTpl, 0, 15, 210, 270);
                }

                // 3. Add title on first page
                if ($i === 1) {
                    $pdf->SetFont('helveticaneueblackcondensed', '', 20);
                    $pdf->SetTextColor(34, 58, 129);
                    $pdf->SetXY(20, 25);
                    $pdf->Cell(170, 10, $config['title'], 0, 0, 'L');
                }
            }

            $pdf->Output($config['output'], 'F');
            $this->info("Generated: {$config['output']} ({$tablePageCount} pages, {$lang})");
        }

        $this->info('Done.');
        return self::SUCCESS;
    }
}
