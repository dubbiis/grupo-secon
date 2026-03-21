<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
        font-family: 'DejaVu Sans', sans-serif;
        font-size: 11pt;
        color: #1a1a1a;
        line-height: 1.6;
    }
    .page-break { page-break-after: always; }

    /* Cover */
    .cover {
        height: 100vh;
        display: flex;
        flex-direction: column;
        background: {{ $palette['primary'] }};
        color: white;
        padding: 60px;
        position: relative;
    }
    .cover-title {
        font-size: 28pt;
        font-weight: bold;
        margin-top: auto;
        line-height: 1.2;
    }
    .cover-sub {
        font-size: 14pt;
        opacity: 0.8;
        margin-top: 12px;
    }
    .cover-uuid {
        font-size: 9pt;
        opacity: 0.6;
        margin-top: 40px;
        font-family: monospace;
    }
    .cover-bottom {
        margin-top: auto;
        padding-top: 40px;
        border-top: 1px solid rgba(255,255,255,0.3);
        font-size: 9pt;
        opacity: 0.7;
    }

    /* Content */
    .content { padding: 40px 50px; }
    .section-header {
        background: {{ $palette['primary'] }};
        color: white;
        padding: 10px 16px;
        margin-bottom: 16px;
        border-radius: 4px;
    }
    .section-number {
        font-size: 8pt;
        opacity: 0.7;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .section-title {
        font-size: 14pt;
        font-weight: bold;
        margin-top: 2px;
    }
    .section-body {
        white-space: pre-wrap;
        text-align: justify;
        color: #333;
        margin-bottom: 30px;
    }
    .section-pending {
        color: #999;
        font-style: italic;
        padding: 12px;
        border: 1px dashed #ddd;
        border-radius: 4px;
        margin-bottom: 30px;
    }

    /* Index */
    .index-title {
        font-size: 18pt;
        font-weight: bold;
        color: {{ $palette['primary'] }};
        border-bottom: 2px solid {{ $palette['accent'] }};
        padding-bottom: 8px;
        margin-bottom: 24px;
    }
    .index-item {
        display: flex;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #eee;
    }
    .index-num {
        width: 28px;
        height: 28px;
        background: {{ $palette['primary'] }};
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9pt;
        font-weight: bold;
        flex-shrink: 0;
        margin-right: 12px;
        text-align: center;
        line-height: 28px;
    }
    .index-name {
        flex: 1;
        color: #333;
    }
    .index-status {
        font-size: 8pt;
        color: #999;
    }
</style>
</head>
<body>

{{-- PORTADA --}}
<div class="cover">
    @if(!empty($branding['logo_path']))
    <img src="{{ storage_path('app/public/' . $branding['logo_path']) }}" style="height:60px;object-fit:contain;margin-bottom:auto;" alt="Logo">
    @endif
    <div class="cover-title">{{ $plan->title }}</div>
    <div class="cover-sub">Plan de Seguridad Privada</div>
    <div class="cover-uuid">Ref: {{ $plan->uuid }} · Generado {{ now()->format('d/m/Y') }}</div>
    <div class="cover-bottom">
        <strong>Grupo Secon</strong> · Seguridad Privada
    </div>
</div>

{{-- ÍNDICE --}}
<div class="content page-break">
    <div class="index-title">Índice</div>
    @foreach($sections as $section)
    <div class="index-item">
        <div class="index-num">{{ $section->section_number }}</div>
        <div class="index-name">{{ $section->section_name }}</div>
        <div class="index-status">
            @if(in_array($section->status, ['listo','editado']))
                ✓
            @else
                —
            @endif
        </div>
    </div>
    @endforeach
</div>

{{-- SECCIONES --}}
@foreach($sections as $section)
<div class="content {{ !$loop->last ? 'page-break' : '' }}">
    <div class="section-header">
        <div class="section-number">Sección {{ $section->section_number }}</div>
        <div class="section-title">{{ $section->section_name }}</div>
    </div>

    @if($section->generated_text)
        <div class="section-body">{{ $section->generated_text }}</div>
    @else
        <div class="section-pending">Esta sección aún no ha sido completada.</div>
    @endif
</div>
@endforeach

</body>
</html>
