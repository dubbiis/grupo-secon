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
- Sección 7 (riesgos): flujo de 2 pasos — identificar riesgos (JSON) → analizar cada uno (5 llamadas SSE secuenciales)
- Sección 9 (planificación): parsear solo hoja "Overview Event", ignorar Data/Staff

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
| 1-6 | Formulario + IA | SectionShell + GeneradorIA | Formulario arriba, generador abajo |
| 7 | Análisis riesgos | Custom (2 pasos) | Identificar → analizar 5 riesgos secuencial |
| 8 | Dispositivo seguridad | Upload + MapEditor | Planos + editor canvas/mapa |
| 9 | Planificación | Excel import + editor | Parsea "Overview Event", drag reorder, auto-calc horas |
| 10 | Transporte | SectionShell + IA | — |
| 11 | Run of show | Upload | Imagen o texto |
| 12 | Acreditaciones | Loop items | Nombre, cantidad, imagen |
| 13 | Contactos | Loop items | Nombre, cargo, email, tlf |
| 14 | Anexos | Loop + upload | Documentos adjuntos |
| 15 | Branding/PDF | Custom | Paleta, tipografía, logo, portada |
