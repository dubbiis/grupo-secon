# CLAUDE.md — Grupo Secon

## Principio fundamental: Animaciones y UX moderna

**SIEMPRE** usar los componentes de `animate-ui` y Framer Motion para que cada interacción se sienta moderna e interactiva. Antes de implementar cualquier botón, efecto, transición o elemento visual, revisa los componentes disponibles:

### Componentes animate-ui disponibles
```
resources/js/components/animate-ui/
├── components/
│   ├── buttons/button.jsx        — Botón con variantes (CVA)
│   ├── buttons/ripple.jsx        — RippleButton (efecto onda al click)
│   ├── backgrounds/gradient.jsx  — Fondo degradado animado
│   ├── backgrounds/stars.jsx     — Estrellas parallax con ratón
│   └── backgrounds/gravity-stars.jsx — Estrellas con gravedad (canvas)
├── primitives/
│   ├── effects/shine.jsx         — Efecto brillo/shimmer (hover/auto/click)
│   ├── texts/gradient.jsx        — Texto con degradado animado
│   ├── texts/morphing.jsx        — Texto que transiciona entre strings
│   ├── texts/sliding-number.jsx  — Números que ruedan al cambiar
│   ├── texts/typing.jsx          — Efecto máquina de escribir
│   ├── buttons/button.jsx        — Botón con scale hover/tap
│   ├── buttons/ripple.jsx        — Primitivo ripple
│   └── animate/slot.jsx          — Slot para componer motion
```

### Framer Motion disponible
- `motion.div`, `AnimatePresence`, `Reorder.Group/Item` (drag & drop)
- `useDragControls` para drag por handle
- Siempre usar `AnimatePresence` para entradas/salidas de elementos

---

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Laravel 13 |
| Frontend | React 19 + Inertia.js |
| CSS | Tailwind CSS v4 + shadcn/ui |
| Animaciones | Framer Motion + animate-ui |
| IA | OpenAI gpt-4o-mini (streaming SSE) |
| PDF | barryvdh/laravel-dompdf |
| Mapas | Leaflet + OpenStreetMap + Nominatim |
| Canvas | HTML5 Canvas nativo |

---

## Reglas de desarrollo

### Archivos e imágenes
- **NUNCA** guardar base64 en BD. Solo paths en `plan_files`. Archivos en `storage/app/public/planes/{uuid}/sec{n}/`
- Respuestas JSON de archivos SIEMPRE incluir `mime_type`
- FileUpload usa optimistic UI + `router.reload({ only: ["files"] })`

### Frontend
- Tema oscuro SIEMPRE. Colores hardcoded dark (`bg-white/5`, `text-white/70`, etc.)
- Paleta marca: `#253C87` (azul oscuro), `#208DCA` (azul claro)
- Botones de acción: `RippleButton` con gradiente `from-[#253C87] to-[#208DCA]`
- Botones secundarios: `Shine` wrapper con `enableOnHover` + borde semitransparente
- Botón Guardar: estilo `bg-white/6 border border-white/10 hover:bg-white/10`
- Toast/feedback: `AnimatePresence` + `motion.span` con icono `CheckCircle2`
- Texto generado IA: vista formateada (renderMarkdown) por defecto, textarea al editar
- Selects y inputs: fondo transparente, ring `[#208DCA]/30` en focus

### Backend
- Streaming IA via SSE (`response()->stream()` con `Content-Type: text/event-stream`)
- CSRF: meta tag en `app.blade.php`, frontend lee con `document.querySelector('meta[name="csrf-token"]')`
- Cambios IA: enviar `texto_actual` desde el frontend (no usar `generated_text` de BD)
- Sección 7 (riesgos): flujo de 2 pasos — identificar riesgos (JSON) → analizar cada uno con SSE secuencial, un panel por riesgo
- Sección 9 (planificación): parsear solo hoja "Overview Event", ignorar Data/Staff
- `buildContext` en OpenAIService: escanea **todas** las secciones dinámicamente (sin whitelist hardcoded). Cualquier campo scalar nuevo llega a la IA automáticamente. Arrays conocidos: `accesos_detalle` → líneas texto, `vips_json` → lista nombres.
- Custom answers (preguntas adicionales): SectionShell mantiene `customAnswers` en estado local propio, siempre los mezcla en `fullFormData` antes de enviar a GeneradorIA y al PUT de guardar. No depender del `onFormChange` del padre para esto.
- Overpass API emergencias: 3 mirrors en fallback (`overpass-api.de` → `overpass.kumi.systems` → `overpass.private.coffee`), timeout 12s por mirror. Cache Laravel 7 días. Frontend hace 2 peticiones secuenciales (hospitales + policía), nunca una sola.
- Distancias a recursos de emergencia: fórmula **haversine** en PHP (no llamar Valhalla ni ninguna API de routing para esto).
- Geocoding: cadena CartoCiudad → Photon → Nominatim. Photon no soporta `lang=es`, usar `lang=default`.

### Git
- Rama: `master`
- Siempre `npm run build` antes de commit
- Co-author: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
- Push automático tras commit

### Deploy
- EasyPanel: Docker + PHP 8.4-cli + Node 22
- Webhook deploy automático al push a master

---

## Patrones comunes

### Botón con efecto Shine
```jsx
<Shine enableOnHover color="white" opacity={0.4} duration={600} asChild>
    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#208DCA]/15 text-[#208DCA] border border-[#208DCA]/25 hover:bg-[#208DCA]/25">
        <Icon size={12} /> Texto
    </button>
</Shine>
```

### Feedback de guardado
```jsx
<AnimatePresence>
    {saved && (
        <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-lg">
            <CheckCircle2 size={11} /> Guardado
        </motion.span>
    )}
</AnimatePresence>
```

### Streaming SSE desde frontend
```jsx
const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrfToken, "Accept": "text/event-stream" },
    body: JSON.stringify(body),
});
const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = "";
while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const parsed = JSON.parse(line.slice(6).trim());
        if (parsed.text) { /* append text */ }
        if (parsed.done) { /* finished */ }
    }
}
```

### Drag & drop con Reorder
```jsx
<Reorder.Group axis="y" values={items} onReorder={setItems}>
    {items.map((item) => (
        <Reorder.Item key={item._id} value={item}
            whileDrag={{ scale: 1.02, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
            ...
        </Reorder.Item>
    ))}
</Reorder.Group>
```

---

## Estructura de secciones (1-15)

| # | Sección | Tipo | Notas |
|---|---------|------|-------|
| 1 | Objetivo | SectionShell + IA | Evento, recinto, redactor, info adicional libre |
| 2 | Descripción | SectionShell + IA | Fechas dinámicas por día (montaje/evento/desmontaje), aforo previsto + aforo espacio |
| 3 | Titulares | SectionShell + IA | Loop de espacios/titulares con contacto |
| 4 | Accesos | SectionShell + IA | Aforo, accesos, transporte, parking, acceso vehículos emergencia (textarea libre) |
| 5 | Recursos sanitarios | SectionShell + IA + Mapa | Búsqueda auto hospitales/policía (2 peticiones), mapa rutas emergencia |
| 6 | Perfil público | SectionShell + IA | Tipo público, VIPs con perfil IA y foto |
| 7 | Análisis riesgos | Custom 2 pasos | Identificar (JSON) → panel expandible por riesgo con SSE individual; guardar/confirmar al pie |
| 8 | Dispositivo seguridad | Upload + MapEditor | Planos múltiples nombrados (nombre + descripción + FileUpload independiente por plano) |
| 9 | Planificación | Excel import + editor | Parsea hoja "Overview Event", drag reorder Reorder.Item, auto-calc horas |
| 10 | Transporte | SectionShell + IA | Perfiles asistentes (pills toggle), vehículos, parking |
| 11 | Run of show | Toggle upload/texto | Imagen/PDF o tabla de texto libre |
| 12 | Acreditaciones | Toggle upload/crear | Subir imágenes ya hechas (acreditacion_img) o crear: foto banner pulsera (w-full h-32) + nombre + zonas acceso |
| 13 | Contactos | Loop items | Nombre, cargo, email, teléfono, empresa |
| 14 | Anexos | Loop + upload | Cada anexo tiene FileUpload independiente con `category="anexo_{id}"` |
| 15 | Branding/PDF | Custom | Paleta colores, tipografía, logo cliente, imagen portada, descarga PDF |

### Notas importantes por sección

**Sec 7**: `riskTexts` es array de strings, uno por riesgo. El texto final para BD = `riskTexts.join("\n\n---\n\n")`. Al cargar, se parsea con `split("\n\n---\n\n")`.

**Sec 8**: Cada plano tiene `{ id: randomString, nombre, descripcion }`. FileUpload usa `category="plano_{id}"` para que los archivos sean independientes por plano.

**Sec 12**: Modo "subir" → FileUpload con `category="acreditacion_img"`. Modo "crear" → AcreditacionCard con PhotoUpload (banner horizontal completo, `object-contain`) + nombre + zonas acceso. El campo `cargo` del modelo almacena las zonas de acceso.

**Sec 14**: Igual que sec 8, cada anexo tiene `id` propio y `category="anexo_{id}"`.

**Sec 2**: Los días de montaje, evento y desmontaje son rangos de fechas. Se generan DayScheduleCard individuales con horario por día. Los campos de BD son `fecha_inicio_montaje`, `fecha_fin_montaje`, `fecha_inicio_evento`, `fecha_fin_evento`, `fecha_inicio_desmontaje`, `fecha_fin_desmontaje`, plus `horarios_montaje`, `horarios_evento`, `horarios_desmontaje` como JSON.

---

## Trampas conocidas

### 1. Overpass API — timeout en búsqueda de emergencias
La sección 5 se quedaba en "Buscando…" indefinidamente. Causa: Overpass `overpass-api.de` tiene picos de carga que generan 504. Solución: 3 mirrors en fallback, timeout 12s por mirror, cache 7 días en Laravel, y peticiones separadas (hospitales/policía) para reducir el tamaño de cada query. **No volver a una sola petición combinada.**

### 2. Custom answers no llegaban a la IA
Las preguntas adicionales ("Información adicional") se guardaban en el estado del componente padre pero `SectionShell` recibía `onFormChange={() => {}}` en secciones como Sec 8 o Sec 14. Las respuestas nunca llegaban a `GeneradorIA`. Solución: `SectionShell` mantiene su propio estado `customAnswers` independiente del padre, siempre lo mezcla en `fullFormData` antes de enviarlo. **No depender de que el padre propague `custom_answers`.**

### 3. buildContext no incluía campos nuevos
`OpenAIService::buildContext()` tenía una whitelist hardcoded de campos. Cualquier campo nuevo añadido a un formulario no llegaba a la IA. Solución: escaneo dinámico de todos los `form_data` de todas las secciones, skipping arrays y el campo `custom_answers` (que se maneja aparte).

### 4. Photon geocoding con `lang=es` falla
Photon (komoot) no soporta `lang=es` — devuelve error silencioso o resultados incorrectos. Usar `lang=default`. Documentado en el GoogleMapsService.

### 5. Valhalla (routing API) para distancias → muy lento
Se usaba Valhalla para calcular distancias a hospitales/policía. Con 10+ resultados tardaba 30+ segundos. Solución: fórmula haversine en PHP puro. Es suficiente para mostrar "a X km en línea recta".

### 6. `t("common.lang_code")` en Seccion2 — key faltante
`formatDay()` en Seccion2.jsx llama `t("common.lang_code") || "es"` para el locale de fechas. La key no existía en los JSON, `t()` devolvía la key misma ("common.lang_code") que es truthy, anulando el `|| "es"`. El locale de formato de fechas quedaba roto. Solución: añadir `"lang_code": "es"/"en"` en los JSON de i18n.

### 7. Geocoding CartoCiudad — retry sin número de portal
CartoCiudad falla silenciosamente con números de portal que no existen en su BD. Implementado retry automático: si no hay resultados, reintentar la misma dirección sin el número de calle antes de pasar al siguiente proveedor de la cadena.
