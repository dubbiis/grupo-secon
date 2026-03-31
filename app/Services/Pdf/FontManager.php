<?php

namespace App\Services\Pdf;

class FontManager
{
    // Fuentes base — Helvetica estándar (Type1, embebida nativamente, 100% compatible Adobe)
    public const BLACK_CONDENSED = 'helvetica';
    public const HEAVY = 'helvetica';
    public const BOLD_CONDENSED = 'helvetica';
    public const BOLD = 'helvetica';
    public const MEDIUM = 'helvetica';
    public const ROMAN = 'helvetica';

    // Color constants [R, G, B]
    public const COLOR_PRIMARY = [34, 58, 129];    // #223A81
    public const COLOR_BODY = [114, 112, 112];      // #727070
    public const COLOR_WHITE = [255, 255, 255];

    // Style presets: [font, tcpdfStyle, size, color]
    // Helvetica con B/I simula las variantes: BlackCondensed→HelvB, Roman→Helv, etc.
    public const STYLES = [
        'cover_title'    => ['helvetica', 'B', 72, self::COLOR_PRIMARY],
        'cover_event'    => ['helvetica', '',  32, self::COLOR_PRIMARY],
        'cover_location' => ['helvetica', 'B', 22, self::COLOR_PRIMARY],
        'section_title'  => ['helvetica', 'B', 20, self::COLOR_PRIMARY],
        'index_title'    => ['helvetica', 'B', 24, self::COLOR_PRIMARY],
        'index_entry'    => ['helvetica', 'B', 11, self::COLOR_BODY],
        'subsection'     => ['helvetica', 'B', 11, self::COLOR_PRIMARY],
        'label'          => ['helvetica', 'B', 11, self::COLOR_BODY],
        'sub_label'      => ['helvetica', '',  11, self::COLOR_BODY],
        'body'           => ['helvetica', '',  11, self::COLOR_BODY],
        'footer'         => ['helvetica', '',  9,  self::COLOR_WHITE],
    ];

    public static function apply(TcpdfInstance $pdf, string $style): void
    {
        $config = self::STYLES[$style] ?? self::STYLES['body'];
        [$font, $tcpdfStyle, $size, $color] = $config;

        $pdf->SetFont($font, $tcpdfStyle, $size);
        $pdf->SetTextColor($color[0], $color[1], $color[2]);
    }

    public static function registerFonts(TcpdfInstance $pdf): void
    {
        // Helvetica es fuente core de TCPDF — no necesita registro
        // Solo desactivamos subsetting por si se usan fuentes custom en el futuro
        $pdf->setFontSubsetting(false);

        \Log::info('PDF: usando Helvetica estándar (compatible Adobe Acrobat)');
    }
}
