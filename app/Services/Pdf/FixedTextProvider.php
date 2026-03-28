<?php

namespace App\Services\Pdf;

class FixedTextProvider
{
    public static function getText(string $sectionKey, string $lang = 'es'): string
    {
        $texts = self::getTexts($lang);
        return $texts[$sectionKey] ?? '';
    }

    private static function getTexts(string $lang): array
    {
        if ($lang === 'en') {
            return self::englishTexts();
        }
        return self::spanishTexts();
    }

    private static function spanishTexts(): array
    {
        return [
            'security_plan' => <<<'TEXT'
En este Plan de Seguridad se recogen las situaciones de riesgo que puedan acontecer en consecuencia de la celebración del evento o servicio recogido en este documento, junto a las medidas para su mitigación o eliminación.

El principal objetivo del Plan de Seguridad es Informar – Controlar – Reducir – Anular cualquier riesgo que comprometa la integridad de las personas, las instalaciones o la imagen del evento.

Una vez identificadas las posibles causas de riesgo, su impacto potencial y la probabilidad de que se manifiesten, se han analizado los efectos sobre la infraestructura, el personal y el público asistente. Con base en este análisis, se han diseñado medidas preventivas y protocolos de respuesta inmediata que permitan limitar, neutralizar o eliminar cada amenaza detectada, reduciendo al máximo los tiempos de reacción.

Este documento tiene en cuenta todos aquellos factores que podrían interactuar durante el desarrollo del evento, con un enfoque técnico y riguroso, garantizando que las medidas adoptadas sean proporcionales y eficaces, y respeten la Política de Seguridad acordada con la organización. El objetivo es asegurar un uso óptimo de los recursos, sin sobredimensionar medios ni incurrir en deficiencias operativas.

Por último, se establece que el presente Plan cuenta con un grado de flexibilidad suficiente como para permitir adaptaciones en caso de cambios operativos, ausencia de datos, incidencias de última hora o nuevas indicaciones por parte de la organización o las Fuerzas y Cuerpos de Seguridad del Estado.
TEXT,

            'human_resources' => <<<'TEXT'
El operativo parte de unas posiciones iniciales que podrán ser modificadas para apoyar en todo momento del evento todas sus necesidades, según las demandas operativas, la afluencia de público o las indicaciones de la organización.

9.1 FUNCIONES DE LOS MEDIOS HUMANOS

Coordinador del servicio

Coordinar y supervisar el servicio de seguridad y control del evento.
Actuar como interlocutor con las FCSE, organizadores del evento y dirección de la instalación.
Adaptar la operativa en función de las necesidades o solicitudes de las FCSE o de la organización.
Coordinar los dispositivos del plan de seguridad y elaborar el informe posterior del servicio auxiliar de control / controlador de accesos.

Personal de control de acceso

El personal de control de acceso podrá desarrollar las siguientes funciones:
Dirigir y asegurar la entrada pacífica de personas al recinto, evitando alteraciones que interfieran con el desarrollo del evento.
Comprobar la edad de las personas que pretendan acceder al recinto, cuando sea procedente.
Controlar la posesión válida de entrada o acreditación por parte de los asistentes.
Verificar en todo momento que no se exceda el aforo autorizado.
Controlar el tránsito en zonas reservadas.
TEXT,
        ];
    }

    private static function englishTexts(): array
    {
        return [
            'security_plan' => <<<'TEXT'
This Security Plan covers the risk situations that may arise as a consequence of the event or service described in this document, together with the measures for their mitigation or elimination.

The main objective of the Security Plan is to Inform – Control – Reduce – Eliminate any risk that compromises the safety of people, the facilities or the image of the event.

Once the possible causes of risk, their potential impact and the probability of their occurrence have been identified, the effects on the infrastructure, personnel and attending public have been analysed. Based on this analysis, preventive measures and immediate response protocols have been designed to limit, neutralise or eliminate each detected threat, minimising reaction times.

This document takes into account all factors that could interact during the course of the event, with a technical and rigorous approach, ensuring that the measures adopted are proportionate and effective, and comply with the Security Policy agreed with the organisation. The objective is to ensure optimal use of resources, without oversizing means or incurring operational deficiencies.

Lastly, it is established that this Plan has a sufficient degree of flexibility to allow adaptations in the event of operational changes, absence of data, last-minute incidents or new instructions from the organisation or the State Security Forces and Corps.
TEXT,

            'human_resources' => <<<'TEXT'
The operation starts from initial positions that may be modified to support at all times the needs of the event, according to operational demands, public attendance or the instructions of the organisation.

9.1 FUNCTIONS OF HUMAN RESOURCES

Service Coordinator

Coordinate and supervise the security and control service of the event.
Act as the liaison with the State Security Forces and Corps, event organisers and venue management.
Adapt operations according to the needs or requests of the Security Forces or the organisation.
Coordinate the security plan devices and prepare the subsequent report as auxiliary control service / access controller.

Access Control Personnel

Access control personnel may perform the following functions:
Direct and ensure the peaceful entry of persons to the venue, preventing disturbances that interfere with the course of the event.
Verify the age of persons seeking to enter the venue, when applicable.
Check the valid possession of tickets or accreditation by attendees.
Verify at all times that the authorised capacity is not exceeded.
Control transit in restricted areas.
TEXT,
        ];
    }
}
