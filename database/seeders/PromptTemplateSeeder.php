<?php

namespace Database\Seeders;

use App\Models\PromptTemplate;
use Illuminate\Database\Seeder;

class PromptTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $prompts = [
            [
                'section_number' => 1,
                'section_name' => 'Objetivo del Plan de Seguridad',
                'model' => 'gpt-4o-mini',
                'max_tokens' => 2048,
                'system_prompt' => 'Eres un redactor experto en Planes de Seguridad Privada para eventos. Generas textos profesionales, técnicos y rigurosos en español. Usa negritas para resaltar información clave pero sin abusar. No uses iconos ni emojis. El texto debe ser formal, directo y apropiado para un documento oficial de seguridad.',
                'user_prompt_template' => 'Genera el texto de la SECCIÓN 1: OBJETIVO DEL PLAN DE SEGURIDAD para el siguiente evento:

**Datos del evento:**
- Nombre del evento: {{nombre_evento}}
- Organizador/Patrocinador: {{organizador}}
- Dirección: {{direccion_evento}}
- Tipo de evento: {{tipo_evento}}
- Nombre del espacio: {{nombre_espacio}}
- Empresa productora: {{productora}}
- Redactor del plan: {{nombre_redactor}}
- Número de habilitación del Director de Seguridad: {{num_habilitacion}}

El objetivo debe explicar el propósito del plan, el ámbito de aplicación, y quién lo ha redactado. Debe ser único, profesional y adaptado al tipo de evento específico. Mínimo 300 palabras.',
            ],
            [
                'section_number' => 2,
                'section_name' => 'Descripción General del Evento',
                'model' => 'gpt-4o-mini',
                'max_tokens' => 3000,
                'system_prompt' => 'Eres un redactor experto en Planes de Seguridad Privada para eventos. Generas textos profesionales, técnicos y rigurosos en español. Usa negritas para resaltar información clave. No uses iconos ni emojis. El texto debe ser formal y apropiado para un documento oficial.',
                'user_prompt_template' => 'Genera el texto de la SECCIÓN 2: DESCRIPCIÓN GENERAL DEL EVENTO con los siguientes datos:

**Datos:**
- Descripción general: {{descripcion_general}}
- Objetivo principal del evento: {{objetivo_evento}}
- Fecha: {{fecha_evento}}
- Horario: {{horario_evento}}
- Montaje y desmontaje: {{montaje_desmontaje}}
- Número de asistentes previstos: {{num_asistentes}}
- Asistentes VIP: {{asistentes_vip}}

Incluye toda la información relevante de forma estructurada. Describe el evento, su naturaleza, alcance y características principales desde el punto de vista de la seguridad.',
            ],
            [
                'section_number' => 3,
                'section_name' => 'Identificación de Titulares y Espacios',
                'model' => 'gpt-4o-mini',
                'max_tokens' => 3000,
                'system_prompt' => 'Eres un redactor experto en Planes de Seguridad Privada. Generas textos profesionales en español para documentos oficiales. Sin iconos ni emojis.',
                'user_prompt_template' => 'Genera el texto de la SECCIÓN 3: IDENTIFICACIÓN DE TITULARES Y ESPACIOS con los siguientes datos:

**Espacios registrados:**
{{espacios_json}}

Para cada espacio, describe: tipo de espacio, datos de identificación (dirección, teléfono, email, persona de contacto) y su relevancia para el plan de seguridad. El texto debe estar bien estructurado con subsecciones para cada espacio.',
            ],
            [
                'section_number' => 4,
                'section_name' => 'Establecimiento y Accesos',
                'model' => 'gpt-4o-mini',
                'max_tokens' => 4096,
                'system_prompt' => 'Eres un redactor experto en Planes de Seguridad Privada. IMPORTANTE: Solo usa la información real que te proporcionen. No inventes nombres de estaciones, líneas de transporte, calles o parkings. Si se te proporcionan datos reales de Google Maps, úsalos exactamente. Genera texto profesional en español para documentos oficiales.',
                'user_prompt_template' => 'Genera el texto de la SECCIÓN 4: DESCRIPCIÓN DEL ESTABLECIMIENTO Y SUS ACCESOS con los siguientes datos:

**Datos del establecimiento:**
- Nombre del espacio: {{nombre_espacio}}
- Dirección: {{direccion_evento}}
- Aforo total: {{aforo_total}}
- Número de accesos: {{num_accesos}}
- Descripción de accesos y zonas: {{descripcion_accesos}}

**Información de transporte real (obtenida de Google Maps):**
{{datos_transporte_googlemaps}}

**Información de parkings cercanos (obtenida de Google Maps):**
{{datos_parkings_googlemaps}}

Redacta una descripción completa del establecimiento y sus vías de acceso. Incluye: ubicación y descripción del recinto, capacidad, zonas diferenciadas, accesos para público general, VIPs y personal de seguridad, y opciones de transporte público y privado con los datos reales proporcionados.',
            ],
            [
                'section_number' => 5,
                'section_name' => 'Recursos Sanitarios y de Seguridad',
                'model' => 'gpt-4o-mini',
                'max_tokens' => 3000,
                'system_prompt' => 'Eres un redactor experto en Planes de Seguridad Privada. CRÍTICO: Solo usa los datos reales de hospitales y comisarías que te proporcionen. No inventes nombres, teléfonos ni distancias. Genera texto profesional en español para documentos oficiales.',
                'user_prompt_template' => 'Genera el texto de la SECCIÓN 5: RECURSOS SANITARIOS Y DE SEGURIDAD CERCANOS con los siguientes datos reales:

**Dirección del evento:** {{direccion_evento}}

**Recursos sanitarios cercanos (datos reales de Google Maps):**
{{hospitales_reales}}

**Recursos de seguridad cercanos (datos reales de Google Maps):**
{{comisarias_reales}}

Redacta el texto indicando los recursos disponibles con sus nombres reales, distancias exactas y tiempos de respuesta estimados. Incluye también los números de emergencias (112, 091, 061). Estructura la información en subsecciones: Asistencia Sanitaria y Fuerzas de Seguridad.',
            ],
            [
                'section_number' => 6,
                'section_name' => 'Perfil del Público Asistente',
                'model' => 'gpt-4o-mini',
                'max_tokens' => 4096,
                'system_prompt' => 'Eres un redactor experto en Planes de Seguridad Privada. Generas perfiles de público detallados y análisis de comportamiento esperado para documentos oficiales. En español, formal, sin emojis.',
                'user_prompt_template' => 'Genera el texto de la SECCIÓN 6: PERFIL DEL PÚBLICO ASISTENTE con los siguientes datos:

**Perfil general:**
- Tipo de público: {{perfil_publico}}
- Rango de edad estimado: {{rango_edad}}
- Ámbito geográfico: {{ambito_geografico}}

**Invitados VIP / Artistas / Personalidades:**
{{vips_json}}

Para el perfil general: describe el tipo de público, comportamiento esperado, nivel de riesgo asociado y medidas específicas recomendadas para este perfil.

Para cada VIP/artista: incluye nombre, perfil profesional y relevancia, y las consideraciones de seguridad específicas que su presencia implica. Mínimo 400 palabras por VIP destacado.',
            ],
            [
                'section_number' => 7,
                'section_name' => 'Análisis de Riesgos y Medidas Preventivas',
                'model' => 'gpt-4o-mini',
                'max_tokens' => 6000,
                'system_prompt' => 'Eres un experto en análisis de riesgos para seguridad de eventos. Generas análisis técnicos y completos en español para documentos oficiales de seguridad privada. El análisis debe ser riguroso, específico al evento y basado en los datos proporcionados. Sin emojis.',
                'user_prompt_template' => 'Genera el texto de la SECCIÓN 7: ANÁLISIS DE RIESGOS Y MEDIDAS PREVENTIVAS basándote en el contexto completo del evento:

**Contexto del evento:**
- Nombre: {{nombre_evento}}
- Tipo: {{tipo_evento}}
- Dirección: {{direccion_evento}}
- Aforo: {{aforo_total}}
- Perfil del público: {{perfil_publico}}
- Número de accesos: {{num_accesos}}
- Hay VIPs: {{hay_vips}}

**Secciones anteriores del plan (resumen):**
{{contexto_secciones_anteriores}}

Genera un análisis completo que incluya:
1. Metodología de evaluación de riesgos
2. Identificación de 6-10 riesgos específicos para este evento (con probabilidad, impacto y nivel de riesgo: bajo/medio/alto/crítico)
3. Medidas preventivas concretas para cada riesgo
4. Plan de contingencia para los riesgos críticos

Sé muy específico al tipo de evento. No uses riesgos genéricos.',
            ],
            [
                'section_number' => 8,
                'section_name' => 'Dispositivo de Seguridad',
                'model' => 'gpt-4o-mini',
                'max_tokens' => 2048,
                'system_prompt' => 'Eres un experto en seguridad privada para eventos. Sin emojis, formal.',
                'user_prompt_template' => 'Esta sección contiene los planos del dispositivo de seguridad subidos por el usuario. Genera un texto introductorio breve que describa el dispositivo de seguridad para el evento "{{nombre_evento}}" con aforo de {{aforo_total}} personas. Menciona que los planos adjuntos detallan la distribución del personal, accesos y zonas de seguridad. Máximo 200 palabras.',
            ],
            [
                'section_number' => 9,
                'section_name' => 'Planificación del Personal',
                'model' => 'gpt-4o-mini',
                'max_tokens' => 1024,
                'system_prompt' => 'Eres un experto en seguridad privada para eventos. Sin emojis, formal.',
                'user_prompt_template' => 'Genera un texto introductorio para la SECCIÓN 9: PLANIFICACIÓN DEL PERSONAL del evento "{{nombre_evento}}". Indica que la planificación detallada del personal de seguridad se adjunta en el documento Excel correspondiente. El texto debe ser breve (máximo 150 palabras) y describir en términos generales cómo está organizado el despliegue de personal.',
            ],
            [
                'section_number' => 10,
                'section_name' => 'Medios de Transporte',
                'model' => 'gpt-4o-mini',
                'max_tokens' => 3000,
                'system_prompt' => 'Eres un redactor experto en Planes de Seguridad Privada. Generas texto profesional en español para documentos oficiales. Sin emojis.',
                'user_prompt_template' => 'Genera el texto de la SECCIÓN 10: MEDIOS DE TRANSPORTE con los siguientes datos:

**Datos del evento:**
- Nombre: {{nombre_evento}}
- Fecha: {{fecha_evento}}
- Dirección: {{direccion_evento}}

**Información de transporte:**
- Tipos de asistentes que necesitan transporte: {{tipos_asistentes}}
- Vehículos utilizados: {{vehiculos}}
- ¿Hay zonas de aparcamiento específicas?: {{hay_aparcamiento}}
- Descripción de zonas de aparcamiento: {{zonas_aparcamiento}}

Redacta una sección completa sobre la gestión del transporte y la movilidad durante el evento. Incluye: accesos para distintos perfiles (público general, artistas/VIP, proveedores), zonas de carga/descarga, coordinación con transporte público y gestión del aparcamiento.',
            ],
            [
                'section_number' => 11,
                'section_name' => 'Run of Show',
                'model' => 'gpt-4o-mini',
                'max_tokens' => 2048,
                'system_prompt' => 'Eres un redactor experto en Planes de Seguridad Privada. Sin emojis, formal.',
                'user_prompt_template' => 'Genera un texto introductorio para la SECCIÓN 11: RUN OF SHOW del evento "{{nombre_evento}}". El run of show (cronograma detallado) se adjunta {{tipo_run_of_show}}. El texto debe describir brevemente la importancia del run of show para la coordinación de la seguridad y cómo el personal debe seguirlo. Máximo 200 palabras.',
            ],
            [
                'section_number' => 12,
                'section_name' => 'Acreditaciones',
                'model' => 'gpt-4o-mini',
                'max_tokens' => 2048,
                'system_prompt' => 'Eres un redactor experto en Planes de Seguridad Privada. Sin emojis, formal.',
                'user_prompt_template' => 'Genera el texto introductorio de la SECCIÓN 12: ACREDITACIONES para el evento "{{nombre_evento}}". Describe el sistema de acreditaciones utilizado y cómo el personal de seguridad debe verificarlas. Las acreditaciones específicas se detallan a continuación en la sección. Máximo 250 palabras.',
            ],
            [
                'section_number' => 13,
                'section_name' => 'Contactos de Interés',
                'model' => 'gpt-4o-mini',
                'max_tokens' => 1024,
                'system_prompt' => 'Eres un redactor experto en Planes de Seguridad Privada. Sin emojis, formal.',
                'user_prompt_template' => 'Genera un breve texto introductorio para la SECCIÓN 13: CONTACTOS DE INTERÉS del evento "{{nombre_evento}}". Explica la importancia de tener los contactos clave disponibles durante el evento. Los contactos específicos se listan a continuación. Máximo 100 palabras.',
            ],
            [
                'section_number' => 14,
                'section_name' => 'Anexos y Documentación',
                'model' => 'gpt-4o-mini',
                'max_tokens' => 1024,
                'system_prompt' => 'Eres un redactor experto en Planes de Seguridad Privada. Sin emojis, formal.',
                'user_prompt_template' => 'Genera un breve texto introductorio para la SECCIÓN 14: ANEXOS Y DOCUMENTACIÓN del plan de seguridad del evento "{{nombre_evento}}". Indica que los documentos adjuntos complementan y dan soporte a lo descrito en el plan. Máximo 100 palabras.',
            ],
            [
                'section_number' => 15,
                'section_name' => 'Branding y Generación de PDF',
                'model' => 'gpt-4o-mini',
                'max_tokens' => 512,
                'system_prompt' => 'Sección de configuración de branding. No requiere generación de texto.',
                'user_prompt_template' => 'Esta sección es de configuración visual del PDF. No hay texto que generar.',
            ],
        ];

        foreach ($prompts as $prompt) {
            PromptTemplate::updateOrCreate(
                ['section_number' => $prompt['section_number']],
                $prompt
            );
        }
    }
}
