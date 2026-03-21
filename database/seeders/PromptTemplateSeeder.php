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
                'example_output' => 'El presente documento tiene por objeto la elaboración, desarrollo e implantación de un Plan de Seguridad para el evento **{nombre del evento}**, organizado por **{organizador}**, que se celebrará en **{Dirección}**, con motivo de la realización del evento **{tipo de evento}**, en el espacio denominado **{Espacio}**. El evento combina diversos ámbitos de interés y podrá incluir actividades interactivas, zonas restringidas, exhibiciones e interactuaciones con público.

La finalidad de este documento es desarrollar un Plan de Seguridad con carácter confidencial y dentro del marco legal vigente, conforme a la legislación aplicable en materia de seguridad privada en el país donde se celebra el evento.

El presente plan ha sido encargado por la organización y se elabora con base en la información facilitada por las partes implicadas, incluyendo datos sobre características, recinto, distribución de zonas, flujos de acceso, organización interna y servicios disponibles, conforme a lo observado durante las visitas realizadas o información facilitada.

La redacción del presente Plan de Seguridad ha sido realizada por **{nombre del redactor}** con número de habilitación **{número de habilitación}**.

Este documento contiene información confidencial y su difusión está legalmente restringida. Su uso está destinado exclusivamente a las organizaciones que participan en el evento, y no podrá ser copiado, remitido, distribuido o retenido sin el consentimiento escrito de la entidad autorizante.',
                'use_example_output' => false,
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
                'example_output' => '{descripcion_general_evento}

**Objetivo principal del evento:**
{objetivo_principal_evento}

**Fecha del evento:**
{fecha_evento}

**Horario:**
{horario_evento}

**Días de montaje y desmontaje:**
Montaje: {fechas_montaje}
Desmontaje: {fechas_desmontaje}

**Número de asistentes:**
Aproximadamente {numero_visitantes_por_dia} visitantes por día y un equipo operativo de {numero_trabajadores} trabajadores.

**Asistentes VIP:**
{asistentes_vip}',
                'use_example_output' => false,
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
                'example_output' => '**Tipo o tipos de espacio o recinto:**
{tipo_espacio}

**Dirección completa del recinto:**
{direccion_recinto}

**Teléfono de contacto del recinto o gestor:**
{telefono_recinto}

**Correo electrónico de contacto:**
{email_contacto}

**Promotor del evento:**
{promotor_evento}

**Productora o empresa responsable de la organización técnica:**
{productora_tecnica}

**Persona de contacto del evento:**
{persona_contacto}',
                'use_example_output' => false,
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
                'example_output' => 'El presente apartado describe las características del establecimiento {nombre_espacio}, situado en {direccion_evento}, donde se celebrará el evento {nombre_evento}.

Se trata de un {tipo_recinto} destinado a {descripcion_uso_espacio}, con {infraestructuras_instaladas}. El recinto dispone de un aforo máximo autorizado de {aforo_autorizado} personas y presenta condiciones óptimas de accesibilidad y seguridad, conforme a la normativa vigente.

Los accesos están claramente diferenciados para garantizar la fluidez, el control de personas acreditadas y la seguridad operativa:
- **Acceso principal (público general):** {acceso_principal}
- **Acceso técnico o de producción:** {acceso_tecnico}
- **Acceso de emergencias:** {acceso_emergencias}

Los accesos cumplen con las condiciones técnicas necesarias para permitir el acceso y maniobra de vehículos de emergencia, incluyendo ambulancias, bomberos y fuerzas de seguridad.

**Accesibilidad y medios de transporte**

**Transporte público:** {información de transporte público con estaciones, líneas y distancias reales}

**Transporte privado:** {información de acceso en vehículo privado, vías principales y parkings cercanos}

Estas rutas ofrecen las combinaciones más adecuadas mediante metro, tren, tranvía, autobuses urbanos o carreteras principales.

**Aparcamientos y zonas de carga/descarga:** {información sobre aparcamientos cercanos y zonas logísticas}',
                'use_example_output' => false,
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
                'example_output' => 'En el entorno del evento se localizan los siguientes recursos sanitarios y de seguridad:

**ASISTENCIA SANITARIA**

Los centros hospitalarios más próximos al recinto son:

- **{hospital_1}:** ubicado a {distancia_1} del recinto (aproximadamente {tiempo_1} en vehículo). Teléfono: {telefono_1}.
- **{hospital_2}:** ubicado a {distancia_2} del recinto (aproximadamente {tiempo_2} en vehículo). Teléfono: {telefono_2}.

En caso de emergencia médica, los números de contacto prioritarios son:
- **112** — Emergencias generales
- **061** — Emergencias sanitarias
- **091** — Policía Nacional

**FUERZAS Y CUERPOS DE SEGURIDAD**

Las dependencias policiales más cercanas al recinto son:

- **Comisaría de Policía Nacional:** {direccion_policia}, a {distancia_policia} del recinto.
- **Guardia Civil:** {direccion_guardia_civil}, a {distancia_guardia_civil} del recinto.',
                'use_example_output' => false,
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
                'example_output' => 'El perfil del público asistente al evento se caracteriza por los siguientes rasgos:

**PERFIL DEMOGRÁFICO**

- Rango de edad predominante: {rango_edad}
- Procedencia geográfica: {procedencia}
- Tipo de público: {tipo_publico}

**COMPORTAMIENTO ESPERADO**

Se prevé un público con comportamiento {tipo_comportamiento}, con nivel de riesgo {nivel_riesgo}. Las medidas de seguridad se adaptarán a las características específicas de este perfil, prestando especial atención a {aspectos_relevantes}.

**INVITADOS VIP Y PERSONALIDADES**

**{nombre_invitado}**
{descripcion_invitado_perfil_profesional_y_consideraciones_de_seguridad_especificas}',
                'use_example_output' => false,
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
                'example_output' => 'Se han identificado y evaluado los siguientes riesgos asociados al evento:

RIESGO 1: AGLOMERACIÓN EN ACCESOS PRINCIPALES DURANTE HORARIO PUNTA

DESCRIPCIÓN:
Durante el horario de entrada masiva (19:00-20:00 horas), se prevé la llegada simultánea de aproximadamente 800 personas en un intervalo de 30 minutos, lo que puede generar aglomeraciones peligrosas en los 2 puntos de acceso habilitados. Este riesgo se incrementa por la concentración de público en horario coincidente y la limitación de puntos de control.

EVALUACIÓN CUANTITATIVA:
- Función (F): 4 — Afectaría gravemente el inicio puntual del evento
- Sustitución (S): 2 — Los accesos pueden redistribuirse relativamente fácil
- Profundidad (P): 4 — Potencial de lesiones graves por aplastamiento
- Extensión (E): 4 — Afecta a una zona amplia de accesos y espera
- Probabilidad (A): 4 — Alta probabilidad dado el aforo y horario
- Vulnerabilidad (V): 4 — Control limitado sobre comportamiento de masas

CÁLCULOS:
- I = F × S = 4 × 2 = 8
- D = P × E = 4 × 4 = 16
- C = I + D = 8 + 16 = 24
- PR = A × V = 4 × 4 = 16
- ER = C × PR = 24 × 16 = 384

CLASIFICACIÓN FINAL: **BAJO** (Control rutinario necesario)

MEDIDAS PREVENTIVAS Y DE MITIGACIÓN:
1. **Habilitar 4 puntos de acceso** en lugar de 2, duplicando la capacidad de entrada
2. **Implementar sistema de entrada escalonada** mediante franjas horarias
3. **Asignar 8 agentes de seguridad** específicamente para control de flujo de accesos (2 por punto)
4. **Instalar señalización clara y vallas de canalización** en zona de espera previa
5. **Sistema de pre-check online** para agilizar el proceso de validación de entradas
6. **Protocolo de comunicación** entre coordinadores para apertura de accesos adicionales de emergencia
7. **Monitorización continua** con cámaras de seguridad en zonas de acceso
8. **Personal sanitario en standby** durante horario punta para atención inmediata

RIESGO 2: INCENDIO O CONATO EN ZONA TÉCNICA Y BACKSTAGE

DESCRIPCIÓN:
La concentración de equipamiento eléctrico, iluminación, cableado y elementos escénicos en el área técnica representa un riesgo de incendio. La presencia de materiales inflamables y la alta carga eléctrica aumentan la probabilidad de sobrecalentamiento o cortocircuito.

EVALUACIÓN CUANTITATIVA:
- Función (F): 5 — Paralizaría completamente el evento
- Sustitución (S): 5 — El equipamiento técnico es insustituible en el momento
- Profundidad (P): 5 — Riesgo de víctimas mortales y daños materiales graves
- Extensión (E): 3 — Inicialmente localizado pero con riesgo de propagación
- Probabilidad (A): 2 — Baja probabilidad con instalación correcta
- Vulnerabilidad (V): 3 — Protección estándar mediante extintores y detectores

CÁLCULOS:
- I = F × S = 5 × 5 = 25
- D = P × E = 5 × 3 = 15
- C = I + D = 25 + 15 = 40
- PR = A × V = 2 × 3 = 6
- ER = C × PR = 40 × 6 = 240

CLASIFICACIÓN FINAL: **MUY BAJO** (Precaución básica)

MEDIDAS PREVENTIVAS Y DE MITIGACIÓN:
1. **Inspección técnica previa** de todas las instalaciones eléctricas por personal certificado
2. **Instalación de sistema de detección de humos** en zona técnica y backstage
3. **Distribución estratégica de extintores** (mínimo 4 unidades CO2 en zona técnica)
4. **Prohibición de materiales altamente inflamables** en decoración cercana a fuentes de calor
5. **Personal técnico capacitado** en manejo de extintores presente en todo momento
6. **Protocolo de evacuación específico** para área técnica con rutas alternativas
7. **Supervisión continua** durante montaje y desmontaje de equipamiento
8. **Coordinación directa** con servicios de bomberos locales

(Genera los riesgos restantes con el mismo formato completo para cada uno identificado.)',
                'use_example_output' => false,
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
                'example_output' => null,
                'use_example_output' => false,
                'user_prompt_template' => 'Esta sección contiene los planos del dispositivo de seguridad subidos por el usuario. Genera un texto introductorio breve que describa el dispositivo de seguridad para el evento "{{nombre_evento}}" con aforo de {{aforo_total}} personas. Menciona que los planos adjuntos detallan la distribución del personal, accesos y zonas de seguridad. Máximo 200 palabras.',
            ],
            [
                'section_number' => 9,
                'section_name' => 'Planificación del Personal',
                'model' => 'gpt-4o-mini',
                'max_tokens' => 1024,
                'system_prompt' => 'Eres un experto en seguridad privada para eventos. Sin emojis, formal.',
                'example_output' => null,
                'use_example_output' => false,
                'user_prompt_template' => 'Genera un texto introductorio para la SECCIÓN 9: PLANIFICACIÓN DEL PERSONAL del evento "{{nombre_evento}}". Indica que la planificación detallada del personal de seguridad se adjunta en el documento Excel correspondiente. El texto debe ser breve (máximo 150 palabras) y describir en términos generales cómo está organizado el despliegue de personal.',
            ],
            [
                'section_number' => 10,
                'section_name' => 'Medios de Transporte',
                'model' => 'gpt-4o-mini',
                'max_tokens' => 3000,
                'system_prompt' => 'Eres un redactor experto en Planes de Seguridad Privada. Generas texto profesional en español para documentos oficiales. Sin emojis.',
                'example_output' => null,
                'use_example_output' => false,
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
                'example_output' => null,
                'use_example_output' => false,
                'user_prompt_template' => 'Genera un texto introductorio para la SECCIÓN 11: RUN OF SHOW del evento "{{nombre_evento}}". El run of show (cronograma detallado) se adjunta {{tipo_run_of_show}}. El texto debe describir brevemente la importancia del run of show para la coordinación de la seguridad y cómo el personal debe seguirlo. Máximo 200 palabras.',
            ],
            [
                'section_number' => 12,
                'section_name' => 'Acreditaciones',
                'model' => 'gpt-4o-mini',
                'max_tokens' => 2048,
                'system_prompt' => 'Eres un redactor experto en Planes de Seguridad Privada. Sin emojis, formal.',
                'example_output' => null,
                'use_example_output' => false,
                'user_prompt_template' => 'Genera el texto introductorio de la SECCIÓN 12: ACREDITACIONES para el evento "{{nombre_evento}}". Describe el sistema de acreditaciones utilizado y cómo el personal de seguridad debe verificarlas. Las acreditaciones específicas se detallan a continuación en la sección. Máximo 250 palabras.',
            ],
            [
                'section_number' => 13,
                'section_name' => 'Contactos de Interés',
                'model' => 'gpt-4o-mini',
                'max_tokens' => 1024,
                'system_prompt' => 'Eres un redactor experto en Planes de Seguridad Privada. Sin emojis, formal.',
                'example_output' => null,
                'use_example_output' => false,
                'user_prompt_template' => 'Genera un breve texto introductorio para la SECCIÓN 13: CONTACTOS DE INTERÉS del evento "{{nombre_evento}}". Explica la importancia de tener los contactos clave disponibles durante el evento. Los contactos específicos se listan a continuación. Máximo 100 palabras.',
            ],
            [
                'section_number' => 14,
                'section_name' => 'Anexos y Documentación',
                'model' => 'gpt-4o-mini',
                'max_tokens' => 1024,
                'system_prompt' => 'Eres un redactor experto en Planes de Seguridad Privada. Sin emojis, formal.',
                'example_output' => null,
                'use_example_output' => false,
                'user_prompt_template' => 'Genera un breve texto introductorio para la SECCIÓN 14: ANEXOS Y DOCUMENTACIÓN del plan de seguridad del evento "{{nombre_evento}}". Indica que los documentos adjuntos complementan y dan soporte a lo descrito en el plan. Máximo 100 palabras.',
            ],
            [
                'section_number' => 15,
                'section_name' => 'Branding y Generación de PDF',
                'model' => 'gpt-4o-mini',
                'max_tokens' => 512,
                'system_prompt' => 'Sección de configuración de branding. No requiere generación de texto.',
                'example_output' => null,
                'use_example_output' => false,
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
