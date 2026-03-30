<?php

namespace App\Services\Pdf;

class SectionMapper
{
    /**
     * Maps PDF section numbers to their data sources.
     * Order follows the app sections (1-14) with fixed sections inserted after sec 7.
     */
    public static function getMapping(): array
    {
        return [
            ['pdf_num' => 1,  'type' => 'app_section',  'app_sections' => [1]],
            ['pdf_num' => 2,  'type' => 'app_section',  'app_sections' => [2]],
            ['pdf_num' => 3,  'type' => 'app_section',  'app_sections' => [3]],
            ['pdf_num' => 4,  'type' => 'app_section',  'app_sections' => [4],  'has_images' => true],
            ['pdf_num' => 5,  'type' => 'app_section',  'app_sections' => [5],  'has_images' => true],
            ['pdf_num' => 6,  'type' => 'app_section',  'app_sections' => [6],  'has_images' => true],
            ['pdf_num' => 7,  'type' => 'composite',    'app_sections' => [7],  'merge_pdf' => true],
            ['pdf_num' => 8,  'type' => 'fixed_text',   'fixed_key' => 'security_plan'],
            ['pdf_num' => 9,  'type' => 'fixed_text',   'fixed_key' => 'human_resources'],
            ['pdf_num' => 10, 'type' => 'app_section',  'app_sections' => [8],  'has_images' => true],
            ['pdf_num' => 11, 'type' => 'planning',     'app_sections' => [9]],
            ['pdf_num' => 12, 'type' => 'app_section',  'app_sections' => [10]],
            ['pdf_num' => 13, 'type' => 'app_section',  'app_sections' => [11], 'has_images' => true],
            ['pdf_num' => 14, 'type' => 'app_section',  'app_sections' => [12], 'has_images' => true],
            ['pdf_num' => 15, 'type' => 'app_section',  'app_sections' => [13]],
            ['pdf_num' => 16, 'type' => 'annexes',       'app_sections' => [14]],
        ];
    }
}
