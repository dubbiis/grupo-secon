# Grupo Secon — Generador de Planes de Seguridad Privada

Aplicación web para redactar, gestionar y exportar Planes de Seguridad Privada para eventos. Combina formularios estructurados, generación de texto por IA (OpenAI streaming), editor de mapas interactivo y exportación PDF.

---

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Laravel 13, PHP 8.4 |
| Frontend | React 19 + Inertia.js |
| CSS | Tailwind CSS v4 + shadcn/ui |
| Animaciones | Framer Motion + animate-ui |
| IA | OpenAI gpt-4o-mini — streaming SSE |
| PDF | barryvdh/laravel-dompdf |
| Mapas | Leaflet + OpenStreetMap + OSRM |
| Geocoding | CartoCiudad → Photon → Nominatim (cadena fallback) |
| Emergencias | Overpass API (3 mirrors, cache 7 días, haversine) |
| Canvas | HTML5 Canvas nativo |
| Auth | Laravel Breeze (email + password) |
| Deploy | Docker + EasyPanel, PHP 8.4-cli + Node 22 |
| BD | MySQL (prod) / SQLite (local) |

---

## Instalación local

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
npm run dev
php artisan serve
```

Variables de entorno requeridas:

```env
OPENAI_API_KEY=sk-...
APP_URL=http://localhost:8000
```

---

## Deploy

```bash
npm run build
git add . && git commit -m "descripción" && git push origin master
```

Push a `master` dispara deploy automático vía webhook en EasyPanel.

---

## Secciones del plan (1–15)

| # | Nombre | Tipo | Descripción |
|---|--------|------|-------------|
| 1 | Objetivo | Formulario + IA | Datos del evento, recinto, redactor, info adicional libre |
| 2 | Descripción | Formulario + IA | Fechas dinámicas por día (montaje/evento/desmontaje), aforo previsto y aforo del espacio |
| 3 | Titulares | Loop + IA | Espacios y titulares con datos de contacto |
| 4 | Accesos | Formulario + IA | Aforo, accesos, transporte público, parkings, acceso vehículos emergencia |
| 5 | Recursos sanitarios | Formulario + IA + Mapa | Búsqueda automática de hospitales y policía, mapa de rutas de emergencia |
| 6 | Perfil público | Formulario + IA | Tipo de público, VIPs/artistas con perfil IA y foto |
| 7 | Análisis de riesgos | Custom 2 pasos | Identificar riesgos → panel expandible por riesgo con texto IA individual |
| 8 | Dispositivo de seguridad | Upload + MapEditor | Planos múltiples nombrados con upload independiente por plano, editor canvas/mapa |
| 9 | Planificación de personal | Excel + editor | Import Excel (hoja "Overview Event"), drag & drop para reordenar, cálculo automático de horas |
| 10 | Transporte | Formulario + IA | Perfiles de asistentes, vehículos, parking |
| 11 | Run of show | Upload o texto | Imagen/PDF o tabla de texto |
| 12 | Acreditaciones | Upload + Crear | Subir imágenes ya diseñadas, o crear con foto (banner pulsera), nombre y zonas de acceso |
| 13 | Contactos | Loop items | Nombre, cargo, email, teléfono, empresa |
| 14 | Anexos | Loop + upload | Cada anexo tiene su propio uploader de archivo independiente |
| 15 | Branding / PDF | Custom | Paleta de colores, tipografía, logo cliente, imagen de portada, descarga PDF |

---

## Estructura del proyecto

```
app/
├── Http/Controllers/
│   ├── PlanController.php           — CRUD planes
│   ├── PlanSectionController.php    — Vista/guardado/IA por sección
│   ├── PlanFileController.php       — Subida/borrado de archivos
│   ├── PlanPdfController.php        — Preview y descarga PDF
│   ├── GoogleMapsController.php     — Geocoding, POIs, emergencias
│   ├── CustomQuestionController.php — Preguntas adicionales por sección
│   ├── PromptController.php         — Admin: gestión de prompts IA
│   ├── StatsController.php          — Admin: estadísticas de uso IA
│   └── UserController.php           — Admin: gestión de usuarios
├── Models/
│   ├── Plan.php                     — uuid, title, user_id, status
│   ├── PlanSection.php              — section_number, form_data (JSON), generated_text, status
│   ├── PlanFile.php                 — plan_id, section_number, file_category, path, mime_type
│   ├── PlanUsageLog.php             — tokens, coste, modelo por generación
│   ├── PromptTemplate.php           — system_prompt, user_prompt, model, max_tokens
│   └── CustomQuestion.php           — question_text, is_template, user_id
└── Services/
    ├── OpenAIService.php            — streamGenerate, streamCambios, buildContext
    └── GoogleMapsService.php        — geocoding, Overpass, OSRM, haversine

resources/js/
├── Pages/
│   ├── Dashboard.jsx
│   ├── Planes/Show.jsx              — Shell del plan con sidebar de progreso
│   ├── Planes/Secciones/            — Seccion1.jsx … Seccion15.jsx
│   ├── Admin/                       — Prompts, Stats, Users
│   └── Auth/                        — Login, Register
├── components/planes/
│   ├── SectionShell.jsx             — Wrapper común: cabecera, guardar, confirmar, IA
│   ├── GeneradorIA.jsx              — Panel IA: generar, editar, solicitar cambios
│   ├── FileUpload.jsx               — Uploader con drag & drop y optimistic UI
│   ├── MapEditor.jsx                — Editor canvas/mapa con toolbar completo
│   ├── LeafletMap.jsx               — Mapa Leaflet con routing OSRM multi-ruta
│   ├── PlacesPanel.jsx              — Búsqueda automática de hospitales/policía
│   ├── CustomQuestions.jsx          — Preguntas adicionales por sección
│   ├── LoopItems.jsx                — Componente genérico de lista expandible
│   └── SidebarSecciones.jsx         — Sidebar con progreso del plan
└── i18n/
    ├── es.json                      — Traducciones ES (idioma principal)
    ├── en.json                      — Traducciones EN
    └── index.jsx                    — LanguageProvider + useTranslation hook
```

---

## Rutas principales

### Planes
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Dashboard |
| POST | `/planes` | Crear plan |
| DELETE | `/planes/{plan}` | Eliminar plan |
| GET | `/planes/{uuid}/seccion/{n}` | Ver sección N |
| PUT | `/planes/{uuid}/seccion/{n}` | Guardar sección N |
| POST | `/planes/{uuid}/seccion/{n}/generar` | Generar texto IA (SSE) |
| POST | `/planes/{uuid}/seccion/{n}/cambios` | Aplicar cambios IA (SSE) |
| POST | `/planes/{uuid}/seccion/7/identificar-riesgos` | Paso 1 análisis riesgos |
| POST | `/planes/{uuid}/seccion/7/analizar-riesgos` | Paso 2 análisis riesgos (SSE) |
| POST | `/planes/{uuid}/vip-describir` | Perfil VIP con IA (SSE) |
| POST | `/planes/{uuid}/seccion/{n}/archivo` | Subir archivo |
| DELETE | `/planes/archivos/{file}` | Eliminar archivo |
| GET | `/planes/{uuid}/pdf/previsualizar` | Preview PDF |
| GET | `/planes/{uuid}/pdf/descargar` | Descargar PDF |

### Mapas / Geocoding
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/planes/{uuid}/maps/hospitales` | Hospitales cercanos (Overpass, cache 7d) |
| POST | `/planes/{uuid}/maps/policia` | Policía cercana (Overpass, cache 7d) |
| POST | `/planes/{uuid}/maps/transporte` | Transporte público |
| POST | `/planes/{uuid}/maps/parking` | Parkings cercanos |
| GET | `/api/geocode?q=...` | Geocoding dirección |
| GET | `/api/map-pois?lat=&lng=&cats=` | POIs para el mapa |

### Admin
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/PUT | `/admin/prompts/{section}` | Gestión prompts IA |
| GET | `/admin/stats` | Estadísticas de uso IA |
| GET/POST/PUT/DELETE | `/admin/users/...` | CRUD usuarios |

---

## Generación IA

**buildContext** escanea todas las secciones del plan dinámicamente: cualquier campo nuevo en un formulario llega a la IA sin tocar el servicio. Las respuestas de "Información adicional" (preguntas personalizadas) se inyectan al final del prompt.

**Sección 7 (riesgos)** usa un flujo de 2 pasos:
1. Identificar riesgos → JSON con lista
2. Analizar cada riesgo con SSE secuencial → texto por panel

**Reglas globales** aplicadas a todos los prompts: sin markdown headers, sin emojis, sin conclusión, no inventar datos, seguir estructura del ejemplo si se proporciona.

---

## Convenciones

- Archivos: `NUNCA` guardar base64 en BD — solo paths en `plan_files`
- Storage: `storage/app/public/planes/{uuid}/sec{n}/{category}/`
- Paleta marca: `#253C87` (azul oscuro), `#208DCA` (azul claro)
- Botones primarios: `RippleButton` con gradiente `from-[#253C87] to-[#208DCA]`
- Botones secundarios: `Shine` wrapper con `enableOnHover`
- Animaciones: siempre `AnimatePresence` para montar/desmontar elementos
