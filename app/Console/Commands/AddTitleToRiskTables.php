<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use setasign\Fpdi\Tcpdf\Fpdi;

class AddTitleToRiskTables extends Command
{
    protected $signature = 'pdf:add-risk-titles';
    protected $description = 'Add section title to risk table PDFs (ES and EN)';

    public function handle(): int
    {
        $fontsPath = config('pdf.fonts_path') . '/';
        $assetsPath = storage_path('app/pdf-assets');

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
            // If original backup doesn't exist, create it from current file
            if (!file_exists($config['source'])) {
                $currentFile = $config['output'];
                if (!file_exists($currentFile)) {
                    $this->error("No source file found for {$lang}: {$currentFile}");
                    continue;
                }
                copy($currentFile, $config['source']);
                $this->info("Backed up original: {$config['source']}");
            }

            $pdf = new Fpdi('P', 'mm', 'A4', true, 'UTF-8');
            $pdf->setPrintHeader(false);
            $pdf->setPrintFooter(false);
            $pdf->SetMargins(0, 0, 0);
            $pdf->SetAutoPageBreak(false, 0);

            // Register font
            $pdf->AddFont('helveticaneueblackcondensed', '', $fontsPath . 'helveticaneueblackcondensed.php');

            $pageCount = $pdf->setSourceFile($config['source']);

            for ($i = 1; $i <= $pageCount; $i++) {
                $pdf->AddPage();
                $tpl = $pdf->importPage($i);
                $pdf->useTemplate($tpl, 0, 0, 210, 297);

                // Add title only on first page
                if ($i === 1) {
                    $pdf->SetFont('helveticaneueblackcondensed', '', 20);
                    $pdf->SetTextColor(34, 58, 129); // #223A81
                    $pdf->SetXY(20, 15);
                    $pdf->Cell(170, 10, $config['title'], 0, 0, 'L');
                }
            }

            $pdf->Output($config['output'], 'F');
            $this->info("Generated: {$config['output']} ({$pageCount} pages, {$lang})");
        }

        $this->info('Done.');
        return self::SUCCESS;
    }
}
