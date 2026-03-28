<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ConvertPdfFonts extends Command
{
    protected $signature = 'pdf:convert-fonts';
    protected $description = 'Register TTF fonts in TCPDF format for PDF generation';

    public function handle(): int
    {
        $fontsPath = config('pdf.fonts_path');

        if (!is_dir($fontsPath)) {
            mkdir($fontsPath, 0755, true);
        }

        $ttfFiles = [
            'helveticaneue-blackcondensed.ttf',
            'helveticaneue-heavy.ttf',
            'helveticaneue-boldcondensed.ttf',
            'helveticaneue-bold.ttf',
            'helveticaneue-medium.ttf',
            'helveticaneue-roman.ttf',
        ];

        foreach ($ttfFiles as $filename) {
            $fontFile = $fontsPath . '/' . $filename;

            if (!file_exists($fontFile)) {
                $this->error("TTF file not found: {$fontFile}");
                $this->info("  Run the Python OTF→TTF conversion first.");
                continue;
            }

            $this->info("Registering: {$filename}");

            try {
                $tcpdfFontName = \TCPDF_FONTS::addTTFfont(
                    $fontFile, 'TrueTypeUnicode', '', 96, $fontsPath . '/'
                );
                if ($tcpdfFontName) {
                    $this->info("  OK → {$tcpdfFontName}");
                } else {
                    $this->error("  FAIL: could not register {$filename}");
                }
            } catch (\Exception $e) {
                $this->error("  ERROR: " . $e->getMessage());
            }
        }

        $this->info("\nDone. Font files at: {$fontsPath}");
        return self::SUCCESS;
    }
}
