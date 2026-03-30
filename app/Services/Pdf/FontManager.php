<?php

namespace App\Services\Pdf;

class FontManager
{
    // TCPDF font names (from addTTFfont registration)
    public const BLACK_CONDENSED = 'helveticaneueblackcondensed';
    public const HEAVY = 'helveticaneueheavy';
    public const BOLD_CONDENSED = 'helveticaneuebcondensed';
    public const BOLD = 'helveticaneueb';
    public const MEDIUM = 'helveticaneuemedium';
    public const ROMAN = 'helveticaneueroman';

    // Color constants [R, G, B]
    public const COLOR_PRIMARY = [34, 58, 129];    // #223A81
    public const COLOR_BODY = [114, 112, 112];      // #727070
    public const COLOR_WHITE = [255, 255, 255];

    // Style presets: [font, size, color]
    public const STYLES = [
        'cover_title'    => [self::BLACK_CONDENSED, 72, self::COLOR_PRIMARY],
        'cover_event'    => [self::MEDIUM, 32, self::COLOR_PRIMARY],
        'cover_location' => [self::BOLD, 22, self::COLOR_PRIMARY],
        'section_title'  => [self::BLACK_CONDENSED, 20, self::COLOR_PRIMARY],
        'index_title'    => [self::BLACK_CONDENSED, 24, self::COLOR_PRIMARY],
        'index_entry'    => [self::BOLD_CONDENSED, 11, self::COLOR_BODY],
        'subsection'     => [self::BOLD, 11, self::COLOR_PRIMARY],
        'label'          => [self::HEAVY, 11, self::COLOR_BODY],
        'sub_label'      => [self::MEDIUM, 11, self::COLOR_BODY],
        'body'           => [self::ROMAN, 11, self::COLOR_BODY],
        'footer'         => [self::ROMAN, 9, self::COLOR_WHITE],
    ];

    public static function apply(TcpdfInstance $pdf, string $style): void
    {
        $config = self::STYLES[$style] ?? self::STYLES['body'];
        [$font, $size, $color] = $config;

        $pdf->SetFont($font, '', $size);
        $pdf->SetTextColor($color[0], $color[1], $color[2]);
    }

    public static function registerFonts(TcpdfInstance $pdf): void
    {
        $fontsPath = config('pdf.fonts_path') . '/';

        // Disable font subsetting — embed full fonts for Adobe compatibility
        $pdf->setFontSubsetting(false);

        $fontFiles = [
            self::BLACK_CONDENSED => 'helveticaneueblackcondensed',
            self::HEAVY           => 'helveticaneueheavy',
            self::BOLD_CONDENSED  => 'helveticaneuebcondensed',
            self::BOLD            => 'helveticaneueb',
            self::MEDIUM          => 'helveticaneuemedium',
            self::ROMAN           => 'helveticaneueroman',
        ];

        foreach ($fontFiles as $name => $file) {
            $pdf->AddFont($name, '', $fontsPath . $file . '.php');
        }
    }
}
