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
            'sec_4'  => 'UBICACIONES Y DESCRIPCIÓN DEL ENTORNO',
            'sec_5'  => 'CLASIFICACIÓN Y DESCRIPCIÓN DE USUARIOS',
            'sec_6'  => 'ANÁLISIS DE RIESGOS',
            'sec_7'  => 'PLAN DE SEGURIDAD',
            'sec_8'  => 'TRANSPORTE Y MOVILIDAD OPERACIONAL',
            'sec_9'  => 'MEDIOS HUMANOS',
            'sec_10' => 'DISPOSITIVO DE SEGURIDAD',
            'sec_11' => 'PLANIFICACIÓN DEL PERSONAL',
            'sec_12' => 'CONTROL DE ACCESOS Y ACREDITACIÓN',
            'sec_13' => 'RUN OF SHOW',
            'sec_14' => 'CONTACTOS',
            'sec_15' => 'ANEXOS',
        ],
        'en' => [
            'cover_title'   => 'SECURITY PLAN',
            'index'         => 'INDEX',
            'sec_1'  => 'INTRODUCTION',
            'sec_2'  => 'PURPOSE',
            'sec_3'  => 'GENERAL IDENTIFICATION OF EVENTS',
            'sec_4'  => 'VENUE LOCATIONS & ENVIRONMENT DESCRIPTION',
            'sec_5'  => 'CLASSIFICATION AND DESCRIPTION OF USERS',
            'sec_6'  => 'RISK ASSESSMENT',
            'sec_7'  => 'SECURITY PLAN',
            'sec_8'  => 'TRANSPORT AND OPERATIONAL MOBILITY',
            'sec_9'  => 'HUMAN RESOURCES',
            'sec_10' => 'SECURITY DEVICE',
            'sec_11' => 'STAFF PLANNING',
            'sec_12' => 'ACCESS CONTROL AND ACCREDITATION',
            'sec_13' => 'RUN OF SHOW',
            'sec_14' => 'CONTACTS',
            'sec_15' => 'ANNEXES',
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
