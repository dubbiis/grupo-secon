<?php

namespace App\Services\Pdf;

class PdfTranslations
{
    private static array $translations = [
        'es' => [
            'cover_title'   => 'PLAN DE SEGURIDAD',
            'index'         => 'ÍNDICE',
            'sec_1'  => 'INTRODUCCIÓN',
            'sec_2'  => 'DESCRIPCIÓN',
            'sec_3'  => 'IDENTIFICACIÓN GENERAL DE EVENTOS',
            'sec_4'  => 'ESTABLECIMIENTO Y ACCESOS',
            'sec_5'  => 'RECURSOS SANITARIOS Y DE SEGURIDAD',
            'sec_6'  => 'PERFIL DEL PÚBLICO ASISTENTE',
            'sec_7'  => 'ANÁLISIS DE RIESGOS',
            'sec_8'  => 'PLAN DE SEGURIDAD',
            'sec_9'  => 'TRANSPORTE Y MOVILIDAD OPERACIONAL',
            'sec_10' => 'MEDIOS HUMANOS',
            'sec_11' => 'DISPOSITIVO DE SEGURIDAD',
            'sec_12' => 'PLANIFICACIÓN DEL PERSONAL',
            'sec_13' => 'CONTROL DE ACCESOS Y ACREDITACIÓN',
            'sec_14' => 'RUN OF SHOW',
            'sec_15' => 'CONTACTOS',
            'sec_16' => 'ANEXOS',
        ],
        'en' => [
            'cover_title'   => 'SECURITY PLAN',
            'index'         => 'INDEX',
            'sec_1'  => 'INTRODUCTION',
            'sec_2'  => 'PURPOSE',
            'sec_3'  => 'GENERAL IDENTIFICATION OF EVENTS',
            'sec_4'  => 'VENUE AND ACCESS POINTS',
            'sec_5'  => 'HEALTH AND SECURITY RESOURCES',
            'sec_6'  => 'AUDIENCE PROFILE',
            'sec_7'  => 'RISK ASSESSMENT',
            'sec_8'  => 'SECURITY PLAN',
            'sec_9'  => 'TRANSPORT AND OPERATIONAL MOBILITY',
            'sec_10' => 'HUMAN RESOURCES',
            'sec_11' => 'SECURITY DEVICE',
            'sec_12' => 'STAFF PLANNING',
            'sec_13' => 'ACCESS CONTROL AND ACCREDITATION',
            'sec_14' => 'RUN OF SHOW',
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
