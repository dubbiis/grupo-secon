<?php

namespace App\Services\Pdf;

class PdfTranslations
{
    private static array $translations = [
        'es' => [
            'cover_title'   => 'PLAN DE SEGURIDAD',
            'index'         => 'ÍNDICE',
            'sec_1'  => 'OBJETIVO DEL PLAN DE SEGURIDAD',
            'sec_2'  => 'DESCRIPCIÓN GENERAL DEL EVENTO',
            'sec_3'  => 'IDENTIFICACIÓN DE TITULARES Y ESPACIOS',
            'sec_4'  => 'ESTABLECIMIENTO Y ACCESOS',
            'sec_5'  => 'RECURSOS SANITARIOS Y DE SEGURIDAD',
            'sec_6'  => 'PERFIL DEL PÚBLICO ASISTENTE',
            'sec_7'  => 'ANÁLISIS DE RIESGOS Y MEDIDAS PREVENTIVAS',
            'sec_8'  => 'PLAN DE SEGURIDAD',
            'sec_9'  => 'MEDIOS HUMANOS',
            'sec_10' => 'DISPOSITIVO DE SEGURIDAD',
            'sec_11' => 'PLANIFICACIÓN DEL PERSONAL',
            'sec_12' => 'MEDIOS DE TRANSPORTE',
            'sec_13' => 'RUN OF SHOW',
            'sec_14' => 'ACREDITACIONES',
            'sec_15' => 'CONTACTOS DE INTERÉS',
            'sec_16' => 'ANEXOS Y DOCUMENTACIÓN',
        ],
        'en' => [
            'cover_title'   => 'SECURITY PLAN',
            'index'         => 'INDEX',
            'sec_1'  => 'SECURITY PLAN OBJECTIVE',
            'sec_2'  => 'GENERAL EVENT DESCRIPTION',
            'sec_3'  => 'IDENTIFICATION OF HOLDERS AND SPACES',
            'sec_4'  => 'VENUE AND ACCESS POINTS',
            'sec_5'  => 'HEALTH AND SECURITY RESOURCES',
            'sec_6'  => 'AUDIENCE PROFILE',
            'sec_7'  => 'RISK ASSESSMENT AND PREVENTIVE MEASURES',
            'sec_8'  => 'SECURITY PLAN',
            'sec_9'  => 'HUMAN RESOURCES',
            'sec_10' => 'SECURITY DEVICE',
            'sec_11' => 'STAFF PLANNING',
            'sec_12' => 'TRANSPORT',
            'sec_13' => 'RUN OF SHOW',
            'sec_14' => 'ACCREDITATION',
            'sec_15' => 'CONTACTS',
            'sec_16' => 'ANNEXES',
        ],
    ];

    public static function get(string $key, string $lang = 'es'): string
    {
        return self::$translations[$lang][$key]
            ?? self::$translations['es'][$key]
            ?? $key;
    }

    public static function sectionTitle(int $pdfNum, string $lang = 'es'): string
    {
        return self::get("sec_{$pdfNum}", $lang);
    }
}
