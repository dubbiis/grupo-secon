<?php

namespace App\Services\Pdf;

use App\Models\Plan;
use App\Models\PlanFile;
use Illuminate\Support\Collection;

class ContentPageBuilder
{
    public function __construct(
        private TcpdfInstance $pdf,
        private Plan $plan,
        private string $lang,
    ) {}

    private array $sectionPages = [];

    /**
     * @return array<int, int> Map of pdf_num => starting page number
     */
    public function build(): array
    {
        $mapping = SectionMapper::getMapping();

        foreach ($mapping as $section) {
            $this->buildSection($section);
        }

        return $this->sectionPages;
    }

    private bool $isFirstSection = true;

    private function buildSection(array $section): void
    {
        $pdfNum = $section['pdf_num'];
        $type = $section['type'];

        // Minimum space needed: title (~15mm) + 5 lines of body text (~30mm) = ~45mm
        $minSpace = 45;
        $remainingSpace = 297 - $this->pdf->GetY() - 22; // 22mm bottom margin for footer

        // Composite (risk tables) — title is already in the PDF, skip title + page break
        if ($type === 'composite') {
            $this->isFirstSection = false;
            // Page number will be recorded when mergeRiskTables adds the first page
        } else {
            // Annexes always start on a new page
            $forceNewPage = $type === 'annexes';

            if ($this->isFirstSection || $forceNewPage || $remainingSpace < $minSpace) {
                $this->pdf->AddPage();
                $this->pdf->SetY(25);
            } else {
                $this->pdf->SetY($this->pdf->GetY() + 12);
            }
            $this->isFirstSection = false;

            // Record starting page for this section
            $this->sectionPages[$pdfNum] = $this->pdf->getPage();

            // Section title
            FontManager::apply($this->pdf, 'section_title');
            $sectionTitle = $this->getSectionTitle($section);
            $title = "{$pdfNum}. " . mb_strtoupper($sectionTitle);
            $this->pdf->MultiCell(0, 10, $title, 0, 'L', false, 1, 20, null, true);
            $this->pdf->SetY($this->pdf->GetY() + 5);
        }

        // Content based on type
        switch ($type) {
            case 'app_section':
                $this->renderAppSections($section['app_sections']);
                // Structured item rendering for specific sections
                $appSec = $section['app_sections'][0] ?? null;
                if ($appSec === 2) {
                    $this->renderScheduleTimeline();
                } elseif ($appSec === 4) {
                    $this->renderAccesosCards();
                } elseif ($appSec === 6) {
                    $this->renderVipCards();
                } elseif ($appSec === 12) {
                    $this->renderAcreditacionCards();
                } elseif ($appSec === 13) {
                    $this->renderContactosCards();
                } elseif (!empty($section['has_images'])) {
                    $this->renderSectionImages($section['app_sections']);
                }
                break;

            case 'fixed_text':
                $this->renderFixedText($section['fixed_key']);
                break;

            case 'composite':
                if (!empty($section['merge_pdf'])) {
                    $this->mergeRiskTables();
                }
                // Analysis text on next page only if it exists
                $compositeSection = $this->plan->sections->firstWhere('section_number', $section['app_sections'][0] ?? 0);
                if ($compositeSection && !empty($compositeSection->generated_text)) {
                    // Let the next buildSection call handle the page break
                    // We set isFirstSection=true so the next section forces AddPage
                    $this->isFirstSection = true;
                    // Render analysis as a sub-part of section 7
                    $this->pdf->AddPage();
                    $this->pdf->SetY(25);
                    FontManager::apply($this->pdf, 'section_title');
                    $subTitle = "{$pdfNum}.1 " . mb_strtoupper($this->lang === 'en' ? 'DETAILED ANALYSIS' : 'ANÁLISIS DETALLADO');
                    $this->pdf->MultiCell(0, 10, $subTitle, 0, 'L', false, 1, 20, null, true);
                    $this->pdf->SetY($this->pdf->GetY() + 5);
                    $this->renderFormattedText($compositeSection->generated_text);
                }
                break;

            case 'annexes':
                $this->renderAnnexes($section['app_sections'], $pdfNum);
                break;
        }
    }

    private function getSectionTitle(array $section): string
    {
        $type = $section['type'];

        if ($type === 'fixed_text') {
            return PdfTranslations::sectionTitle($section['pdf_num'], $this->lang);
        }

        $appSections = $section['app_sections'] ?? [];
        if (!empty($appSections)) {
            $appSection = $this->plan->sections->firstWhere('section_number', $appSections[0]);
            if ($appSection && $appSection->section_name) {
                return $appSection->section_name;
            }
        }

        return PdfTranslations::sectionTitle($section['pdf_num'], $this->lang);
    }

    private function renderAppSections(array $appSections): void
    {
        foreach ($appSections as $i => $secNum) {
            $appSection = $this->plan->sections->firstWhere('section_number', $secNum);

            if (!$appSection || empty($appSection->generated_text)) {
                FontManager::apply($this->pdf, 'body');
                $this->pdf->MultiCell(
                    0, 6,
                    '(Sección pendiente de generar)',
                    0, 'L', false, 1, 20, null, true
                );
                continue;
            }

            // Add spacing between multiple app sections
            if ($i > 0) {
                $this->pdf->SetY($this->pdf->GetY() + 8);
            }

            $text = $appSection->generated_text;
            $this->renderFormattedText($text);
        }
    }

    private function renderFixedText(string $key): void
    {
        $text = FixedTextProvider::getText($key, $this->lang);
        $this->renderFormattedText($text);
    }

    /**
     * Render text with typography matching the design spec:
     *
     * - Subsection headers (e.g. "3.1 EVENT: ACG") → Bold #223A81
     * - Labels ending with ":" (short, e.g. "Datos del Evento:") → Heavy #727070
     * - ALL CAPS short lines → Heavy #727070
     * - List items starting with "- " or "• " → Roman #727070, indented
     * - Short standalone lines (titles without ":") → Medium #727070
     * - Everything else → Roman #727070 (body paragraph)
     */
    private function renderFormattedText(string $text): void
    {
        // Strip markdown bold/italic markers
        $text = preg_replace('/\*{1,2}([^*]+)\*{1,2}/', '$1', $text);

        // Split into individual lines (not double-newline paragraphs) for finer control
        $lines = explode("\n", $text);
        $i = 0;
        $totalLines = count($lines);

        while ($i < $totalLines) {
            $line = trim($lines[$i]);

            // Skip empty lines (add small spacing)
            if ($line === '') {
                $this->pdf->SetY($this->pdf->GetY() + 2);
                $i++;
                continue;
            }

            // 0. Markdown table: line starts and contains "|"
            if (str_contains($line, '|') && preg_match('/\|.*\|/', $line)) {
                // Collect all table lines
                $tableLines = [];
                while ($i < $totalLines && str_contains(trim($lines[$i]), '|')) {
                    $tl = trim($lines[$i]);
                    // Skip separator lines (|---|---|, | --- | --- |, etc.)
                    $stripped = preg_replace('/[\s\-:|]/', '', $tl);
                    if ($stripped !== '') {
                        $tableLines[] = $tl;
                    }
                    $i++;
                }
                if (!empty($tableLines)) {
                    $this->renderTable($tableLines);
                }
                continue;
            }

            // 1. Subsection header: starts with number.number (e.g. "3.1 EVENT:")
            if (preg_match('/^\d+\.\d+\s+/', $line)) {
                FontManager::apply($this->pdf, 'subsection');
                $this->pdf->MultiCell(0, 7, $line, 0, 'L', false, 1, 20, null, true);
                $this->pdf->SetY($this->pdf->GetY() + 2);
                $i++;
                continue;
            }

            // 2. List item: starts with "- ", "• ", "· " or numbered "1. ", "2. " etc.
            if (preg_match('/^[-•·]\s+/', $line) || preg_match('/^\d+\.\s+\S/', $line)) {
                FontManager::apply($this->pdf, 'body');
                $this->pdf->MultiCell(0, 6, $line, 0, 'L', false, 1, 25, null, true); // indent to 25mm
                $this->pdf->SetY($this->pdf->GetY() + 1);
                $i++;
                continue;
            }

            // 3. Label: short line ending with ":" (e.g. "Datos del Evento:", "Dates:")
            if (mb_strlen($line) < 80 && preg_match('/:\s*$/', $line)) {
                FontManager::apply($this->pdf, 'label');
                $this->pdf->MultiCell(0, 7, $line, 0, 'L', false, 1, 20, null, true);
                $this->pdf->SetY($this->pdf->GetY() + 1);
                $i++;
                continue;
            }

            // 4. ALL CAPS short line (e.g. section-level headings in the text)
            if (mb_strlen($line) < 80 && $line === mb_strtoupper($line) && mb_strlen($line) > 3) {
                FontManager::apply($this->pdf, 'label');
                $this->pdf->MultiCell(0, 7, $line, 0, 'L', false, 1, 20, null, true);
                $this->pdf->SetY($this->pdf->GetY() + 2);
                $i++;
                continue;
            }

            // 5. Short standalone line without periods (subtitle/category name)
            if (mb_strlen($line) < 80 && !str_contains($line, '.') && !preg_match('/^\d/', $line)) {
                // Check if next line is a list or empty (confirms this is a heading)
                $nextLine = trim($lines[$i + 1] ?? '');
                $nextIsList = preg_match('/^[-•·]\s+/', $nextLine);
                $nextIsEmpty = $nextLine === '';
                if ($nextIsList || $nextIsEmpty) {
                    FontManager::apply($this->pdf, 'sub_label');
                    $this->pdf->MultiCell(0, 7, $line, 0, 'L', false, 1, 20, null, true);
                    $this->pdf->SetY($this->pdf->GetY() + 1);
                    $i++;
                    continue;
                }
            }

            // 6. Regular body text — collect consecutive body lines into a paragraph
            $paragraph = $line;
            while ($i + 1 < $totalLines) {
                $nextLine = trim($lines[$i + 1]);
                // Stop if next line is empty, a list item, a label, or a header
                if ($nextLine === '' ||
                    (str_contains($nextLine, '|') && preg_match('/\|.*\|/', $nextLine)) ||
                    preg_match('/^[-•·]\s+/', $nextLine) ||
                    preg_match('/^\d+\.\s+\S/', $nextLine) ||
                    (preg_match('/:\s*$/', $nextLine) && mb_strlen($nextLine) < 80) ||
                    preg_match('/^\d+\.\d+\s+/', $nextLine) ||
                    ($nextLine === mb_strtoupper($nextLine) && mb_strlen($nextLine) < 80 && mb_strlen($nextLine) > 3)) {
                    break;
                }
                $i++;
                $paragraph .= ' ' . $nextLine;
            }

            FontManager::apply($this->pdf, 'body');
            $this->pdf->MultiCell(0, 6, $paragraph, 0, 'L', false, 1, 20, null, true);
            $this->pdf->SetY($this->pdf->GetY() + 3);
            $i++;
        }
    }

    private function mergeRiskTables(): void
    {
        $riskTablePath = config("pdf.risk_tables.{$this->lang}")
            ?? config('pdf.risk_tables.es');

        if (!file_exists($riskTablePath)) {
            return;
        }

        // Use originals — apply base template + title + footer dynamically
        $baseTplPath = config('pdf.base_template');
        $fontsPath = config('pdf.fonts_path') . '/';

        // 1. Import all risk table pages first
        $pageCount = $this->pdf->setSourceFile($riskTablePath);
        $tableTemplates = [];
        for ($i = 1; $i <= $pageCount; $i++) {
            $tableTemplates[] = $this->pdf->importPage($i);
        }

        // 2. Import base template
        $this->pdf->setSourceFile($baseTplPath);
        $bgTpl = $this->pdf->importPage(1);

        // 3. Disable auto background + auto page break during table import
        $this->pdf->enableBackground(false);
        $this->pdf->SetAutoPageBreak(false, 0);

        // 4. Render each page: base template + table content + title (1st) + footer
        foreach ($tableTemplates as $idx => $tpl) {
            $this->pdf->AddPage();

            // Base template (logo + blue bar)
            $this->pdf->useTemplate($bgTpl, 0, 0, 210, 297);

            // Table content — offset down to leave room for logo/title
            if ($idx === 0) {
                $this->pdf->useTemplate($tpl, 0, 38, 210, 247);
            } else {
                $this->pdf->useTemplate($tpl, 0, 15, 210, 270);
            }

            // Title on first page
            if ($idx === 0) {
                FontManager::apply($this->pdf, 'section_title');
                $title = $this->lang === 'en'
                    ? '7. RISK ASSESSMENT AND PREVENTIVE MEASURES'
                    : '7. ANÁLISIS DE RIESGOS Y MEDIDAS PREVENTIVAS';
                $this->pdf->SetXY(20, 25);
                $this->pdf->Cell(170, 10, $title, 0, 0, 'L');
                $this->sectionPages[7] = $this->pdf->getPage();
            }

            // Footer
            $this->pdf->drawFooter();
        }

        // 5. Restore
        $this->pdf->SetAutoPageBreak(true, 22);
        $this->pdf->enableBackground(true);
        $this->pdf->reloadBackgroundTemplate();
    }

    /**
     * Render annexes section:
     * 1. AI-generated introductory text
     * 2. For each annex: name as subsection + embedded file (PDF pages, images)
     */
    private function renderAnnexes(array $appSections, int $pdfNum): void
    {
        // 1. Render AI intro text
        $this->renderAppSections($appSections);

        // 2. Get annexes list from form_data
        $appSection = $this->plan->sections->firstWhere('section_number', 14);
        if (!$appSection || empty($appSection->form_data['anexos_json'])) {
            return;
        }

        $anexos = json_decode($appSection->form_data['anexos_json'], true);
        if (!is_array($anexos) || empty($anexos)) {
            return;
        }

        // 3. Render each annex with its files
        foreach ($anexos as $i => $anexo) {
            $nombre = $anexo['nombre'] ?? ('Anexo ' . ($i + 1));
            $descripcion = $anexo['descripcion'] ?? '';
            $anexoId = $anexo['id'] ?? '';

            // Get files for this annex
            $anexoFiles = $this->plan->files
                ->where('section_number', 14)
                ->where('file_category', "anexo_{$anexoId}");

            // Only break page if not enough space for title + description
            $remainingSpace = 297 - $this->pdf->GetY() - 22;
            if ($remainingSpace < 45) {
                $this->pdf->AddPage();
                $this->pdf->SetY(25);
            } else {
                $this->pdf->SetY($this->pdf->GetY() + 8);
            }

            // Annex title as subsection
            FontManager::apply($this->pdf, 'subsection');
            $annexNum = $pdfNum . '.' . ($i + 1);
            $this->pdf->MultiCell(0, 8, "{$annexNum} {$nombre}", 0, 'L', false, 1, 20, null, true);

            if ($descripcion) {
                $this->pdf->SetY($this->pdf->GetY() + 2);
                FontManager::apply($this->pdf, 'body');
                $this->pdf->MultiCell(0, 6, $descripcion, 0, 'L', false, 1, 20, null, true);
            }

            $this->pdf->SetY($this->pdf->GetY() + 5);

            // Embed each file
            foreach ($anexoFiles as $file) {
                if (!file_exists($file->absolute_path)) continue;

                $mime = $file->mime_type ?? '';

                if ($mime === 'application/pdf') {
                    // Import PDF pages
                    $this->embedPdfFile($file->absolute_path);
                } elseif (str_starts_with($mime, 'image/')) {
                    // Embed image
                    $this->embedImage($file->absolute_path);
                } else {
                    // For other file types (Word, Excel), just show the filename
                    FontManager::apply($this->pdf, 'body');
                    $icon = $this->getFileIcon($mime);
                    $this->pdf->MultiCell(
                        0, 6,
                        "{$icon} {$file->original_name}",
                        0, 'L', false, 1, 20, null, true
                    );
                    $this->pdf->SetY($this->pdf->GetY() + 3);
                }
            }
        }
    }

    private function embedPdfFile(string $path): void
    {
        $this->pdf->enableBackground(false);

        $pageCount = $this->pdf->setSourceFile($path);
        for ($i = 1; $i <= $pageCount; $i++) {
            $this->pdf->AddPage();
            $tpl = $this->pdf->importPage($i);
            $this->pdf->useTemplate($tpl, 0, 0, 210, 297);
        }

        $this->pdf->enableBackground(true);
        $this->pdf->reloadBackgroundTemplate();
    }

    private function embedImage(string $path): void
    {
        // Convert WebP to PNG (TCPDF doesn't support WebP)
        $imagePath = $path;
        $mime = mime_content_type($path) ?: '';
        if (str_contains($mime, 'webp')) {
            $img = @imagecreatefromwebp($path);
            if (!$img) return;
            $tmpPath = sys_get_temp_dir() . '/embed_' . md5($path) . '.png';
            imagepng($img, $tmpPath);
            imagedestroy($img);
            $imagePath = $tmpPath;
        }

        $imgSize = @getimagesize($imagePath);
        if (!$imgSize) return;

        $maxW = 170;
        $imgRatio = $imgSize[1] / $imgSize[0];
        $drawH = $maxW * $imgRatio;
        $maxPageH = 297 - 25 - 22;
        if ($drawH > $maxPageH) {
            $drawH = $maxPageH;
            $maxW = $drawH / $imgRatio;
        }

        $remainingSpace = 297 - $this->pdf->GetY() - 22;
        if ($remainingSpace < $drawH + 5) {
            $this->pdf->AddPage();
            $this->pdf->SetY(25);
        }

        $this->pdf->Image(
            $imagePath,
            20, $this->pdf->GetY(),
            $maxW, $drawH,
            '', '', '', false, 300, '', false, false, 0
        );

        $this->pdf->SetY($this->pdf->GetY() + $drawH + 5);
    }

    private function getFileIcon(string $mime): string
    {
        if (str_contains($mime, 'word') || str_contains($mime, 'document')) return '[DOC]';
        if (str_contains($mime, 'excel') || str_contains($mime, 'spreadsheet')) return '[XLS]';
        if (str_contains($mime, 'presentation') || str_contains($mime, 'powerpoint')) return '[PPT]';
        return '[FILE]';
    }

    // ── Structured item renderers ──────────────────────────────

    /**
     * Sec 3: Espacios — name + type + address + contact info
     */
    private function renderEspaciosCards(): void
    {
        $appSection = $this->plan->sections->firstWhere('section_number', 3);
        if (!$appSection) return;

        $espacios = json_decode($appSection->form_data['espacios_json'] ?? '[]', true);
        if (!is_array($espacios) || empty($espacios)) return;

        foreach ($espacios as $i => $espacio) {
            $nombre = $espacio['nombre_espacio'] ?? '';
            if (!$nombre) continue;

            $this->ensureSpace(30);

            FontManager::apply($this->pdf, 'subsection');
            $this->pdf->MultiCell(0, 7, ($i + 1) . '. ' . $nombre, 0, 'L', false, 1, 20, null, true);
            $this->pdf->SetY($this->pdf->GetY() + 1);

            $details = [];
            if (!empty($espacio['tipo_espacio'])) $details[] = "Tipo: {$espacio['tipo_espacio']}";
            if (!empty($espacio['direccion'])) $details[] = "Dirección: {$espacio['direccion']}";
            if (!empty($espacio['persona_contacto'])) $details[] = "Contacto: {$espacio['persona_contacto']}";
            if (!empty($espacio['telefono'])) $details[] = "Teléfono: {$espacio['telefono']}";
            if (!empty($espacio['email'])) $details[] = "Email: {$espacio['email']}";

            if ($details) {
                FontManager::apply($this->pdf, 'body');
                foreach ($details as $detail) {
                    $this->pdf->MultiCell(0, 6, "- {$detail}", 0, 'L', false, 1, 25, null, true);
                }
            }
            $this->pdf->SetY($this->pdf->GetY() + 4);
        }
    }

    /**
     * Sec 4: Accesos — name + description + photo (indexed by position)
     */
    private function renderAccesosCards(): void
    {
        $appSection = $this->plan->sections->firstWhere('section_number', 4);
        if (!$appSection) return;

        $accesos = $appSection->form_data['accesos_detalle'] ?? [];
        if (!is_array($accesos) || empty($accesos)) return;

        foreach ($accesos as $i => $acceso) {
            $nombre = $acceso['nombre'] ?? "Acceso " . ($i + 1);
            $descripcion = $acceso['descripcion'] ?? '';

            $this->ensureSpace(40);

            // Title
            FontManager::apply($this->pdf, 'subsection');
            $this->pdf->MultiCell(0, 7, ($i + 1) . '. ' . $nombre, 0, 'L', false, 1, 20, null, true);
            $this->pdf->SetY($this->pdf->GetY() + 1);

            // Description
            if ($descripcion) {
                FontManager::apply($this->pdf, 'body');
                $this->pdf->MultiCell(0, 6, $descripcion, 0, 'L', false, 1, 20, null, true);
                $this->pdf->SetY($this->pdf->GetY() + 3);
            }

            // Photo for this access point
            $photo = $this->plan->files
                ->where('section_number', 4)
                ->where('file_category', "acceso_foto_{$i}")
                ->sortByDesc('id')
                ->first();

            if ($photo && file_exists($photo->absolute_path)) {
                $this->renderItemImage($photo->absolute_path, $photo->mime_type ?? '');
            }

            $this->pdf->SetY($this->pdf->GetY() + 5);
        }
    }

    /**
     * Sec 12: Acreditaciones — photo (landscape) + name + access zones
     */
    private function renderAcreditacionCards(): void
    {
        $appSection = $this->plan->sections->firstWhere('section_number', 12);
        if (!$appSection) return;

        $items = json_decode($appSection->form_data['personas_json'] ?? '[]', true);
        if (!is_array($items) || empty($items)) return;

        foreach ($items as $i => $item) {
            $nombre = $item['nombre'] ?? '';
            $cargo = $item['cargo'] ?? '';
            if (!$nombre && !$cargo) continue;

            $this->ensureSpace(35);

            // Title
            FontManager::apply($this->pdf, 'subsection');
            $this->pdf->MultiCell(0, 7, ($i + 1) . '. ' . ($nombre ?: 'Acreditación ' . ($i + 1)), 0, 'L', false, 1, 20, null, true);

            if ($cargo) {
                FontManager::apply($this->pdf, 'body');
                $this->pdf->MultiCell(0, 6, "Zonas de acceso: {$cargo}", 0, 'L', false, 1, 20, null, true);
            }
            $this->pdf->SetY($this->pdf->GetY() + 2);

            // Photo — find by foto_id stored in the item
            if (!empty($item['foto_id'])) {
                $photo = $this->plan->files->firstWhere('id', $item['foto_id']);
                if ($photo && file_exists($photo->absolute_path)) {
                    $this->renderItemImage($photo->absolute_path, $photo->mime_type ?? '', 120); // landscape, wider
                }
            }

            $this->pdf->SetY($this->pdf->GetY() + 5);
        }
    }

    /**
     * Sec 13: Contactos — name + role + phone + email + company
     */
    private function renderContactosCards(): void
    {
        $appSection = $this->plan->sections->firstWhere('section_number', 13);
        if (!$appSection) return;

        $items = json_decode($appSection->form_data['contactos_json'] ?? '[]', true);
        if (!is_array($items) || empty($items)) return;

        foreach ($items as $i => $item) {
            $nombre = $item['nombre'] ?? '';
            if (!$nombre) continue;

            $this->ensureSpace(25);

            FontManager::apply($this->pdf, 'subsection');
            $this->pdf->MultiCell(0, 7, ($i + 1) . '. ' . $nombre, 0, 'L', false, 1, 20, null, true);

            $details = [];
            if (!empty($item['cargo'])) $details[] = $item['cargo'];
            if (!empty($item['empresa'])) $details[] = $item['empresa'];
            if (!empty($item['telefono'])) $details[] = "Tel: {$item['telefono']}";
            if (!empty($item['email'])) $details[] = $item['email'];

            if ($details) {
                FontManager::apply($this->pdf, 'body');
                $this->pdf->MultiCell(0, 6, implode(' · ', $details), 0, 'L', false, 1, 25, null, true);
            }

            $this->pdf->SetY($this->pdf->GetY() + 4);
        }
    }

    // ── Helper methods ──────────────────────────────────────────

    /**
     * Render a markdown table with styled header and rows.
     * Column widths are proportional to content length.
     */
    private function renderTable(array $tableLines): void
    {
        if (empty($tableLines)) return;

        // Parse cells from each line
        $rows = [];
        foreach ($tableLines as $line) {
            // Split by | and clean up
            $parts = explode('|', $line);
            $cells = [];
            foreach ($parts as $p) {
                $trimmed = trim($p);
                if ($trimmed !== '' || count($cells) > 0) {
                    $cells[] = $trimmed;
                }
            }
            // Remove trailing empty cell
            while (!empty($cells) && $cells[count($cells) - 1] === '') {
                array_pop($cells);
            }
            if (!empty($cells)) {
                $rows[] = $cells;
            }
        }

        if (empty($rows)) return;

        $numCols = count($rows[0]);
        $totalW = 170; // usable width
        $startX = 20;
        $rowH = 8;

        // Calculate column widths based on max content length per column
        $maxLens = array_fill(0, $numCols, 0);
        foreach ($rows as $row) {
            foreach ($row as $colIdx => $cell) {
                if ($colIdx < $numCols) {
                    $maxLens[$colIdx] = max($maxLens[$colIdx], mb_strlen($cell));
                }
            }
        }
        $totalLen = max(1, array_sum($maxLens));
        $colWidths = [];
        foreach ($maxLens as $len) {
            $colWidths[] = max(15, ($len / $totalLen) * $totalW); // min 15mm per col
        }
        // Normalize to exactly totalW
        $sum = array_sum($colWidths);
        $colWidths = array_map(fn($w) => $w * ($totalW / $sum), $colWidths);

        // Check space
        $tableH = count($rows) * $rowH + 10;
        $this->ensureSpace(min($tableH, 80));

        foreach ($rows as $rowIdx => $cells) {
            $isHeader = ($rowIdx === 0);
            $y = $this->pdf->GetY();

            // Page break if needed
            if (297 - $y - 22 < $rowH + 2) {
                $this->pdf->AddPage();
                $y = 25;
                $this->pdf->SetY($y);
            }

            // Pad cells
            while (count($cells) < $numCols) {
                $cells[] = '';
            }

            if ($isHeader) {
                $this->pdf->SetFillColor(34, 58, 129);
                $this->pdf->SetTextColor(255, 255, 255);
                $this->pdf->SetFont(FontManager::BOLD_CONDENSED, '', 8);
            } else {
                $bg = ($rowIdx % 2 === 0) ? [240, 243, 248] : [255, 255, 255];
                $this->pdf->SetFillColor($bg[0], $bg[1], $bg[2]);
                $this->pdf->SetTextColor(114, 112, 112);
                $this->pdf->SetFont(FontManager::ROMAN, '', 8);
            }

            $x = $startX;
            foreach ($cells as $colIdx => $cell) {
                if ($colIdx >= $numCols) break;
                $w = $colWidths[$colIdx];
                $this->pdf->SetXY($x, $y);
                // Use MultiCell for wrapping, but cap height
                $align = $isHeader ? 'C' : ($colIdx === $numCols - 1 ? 'L' : 'C');
                $this->pdf->Cell($w, $rowH, $cell, 0, 0, $align, true);
                $x += $w;
            }

            $this->pdf->SetY($y + $rowH);
        }

        FontManager::apply($this->pdf, 'body');
        $this->pdf->SetY($this->pdf->GetY() + 5);
    }

    /**
     * Render a visual timeline for section 2 (schedule phases).
     */
    private function renderScheduleTimeline(): void
    {
        $appSection = $this->plan->sections->firstWhere('section_number', 2);
        if (!$appSection || !$appSection->form_data) return;

        $fd = $appSection->form_data;

        $phases = [];
        if (!empty($fd['montaje_inicio'])) {
            $phases[] = [
                'label' => $this->lang === 'en' ? 'SETUP' : 'MONTAJE',
                'start' => $fd['montaje_inicio'],
                'end'   => $fd['montaje_fin'] ?? $fd['montaje_inicio'],
                'color' => [32, 141, 202], // #208DCA
            ];
        }
        if (!empty($fd['fecha_inicio'])) {
            $phases[] = [
                'label' => $this->lang === 'en' ? 'EVENT' : 'EVENTO',
                'start' => $fd['fecha_inicio'],
                'end'   => $fd['fecha_fin'] ?? $fd['fecha_inicio'],
                'color' => [34, 58, 129], // #223A81
            ];
        }
        if (!empty($fd['desmontaje_inicio'])) {
            $phases[] = [
                'label' => $this->lang === 'en' ? 'TEARDOWN' : 'DESMONTAJE',
                'start' => $fd['desmontaje_inicio'],
                'end'   => $fd['desmontaje_fin'] ?? $fd['desmontaje_inicio'],
                'color' => [114, 112, 112], // #727070
            ];
        }

        if (empty($phases)) return;

        $this->ensureSpace(35);

        // Title
        FontManager::apply($this->pdf, 'label');
        $tlTitle = $this->lang === 'en' ? 'Event Timeline:' : 'Cronograma del Evento:';
        $this->pdf->MultiCell(0, 7, $tlTitle, 0, 'L', false, 1, 20, null, true);
        $this->pdf->SetY($this->pdf->GetY() + 3);

        // Calculate date range
        $allDates = [];
        foreach ($phases as $p) {
            $allDates[] = strtotime($p['start']);
            $allDates[] = strtotime($p['end']);
        }
        $minDate = min($allDates);
        $maxDate = max($allDates);
        $totalDays = max(1, ($maxDate - $minDate) / 86400 + 1);

        $barX = 20;
        $barW = 170;
        $barH = 8;
        $y = $this->pdf->GetY();

        foreach ($phases as $phase) {
            $startDay = (strtotime($phase['start']) - $minDate) / 86400;
            $endDay = (strtotime($phase['end']) - $minDate) / 86400 + 1;

            $x = $barX + ($startDay / $totalDays) * $barW;
            $w = max(10, (($endDay - $startDay) / $totalDays) * $barW);

            // Bar
            $this->pdf->SetFillColor($phase['color'][0], $phase['color'][1], $phase['color'][2]);
            $this->pdf->RoundedRect($x, $y, $w, $barH, 1.5, '1111', 'F');

            // Label inside bar
            $this->pdf->SetFont(FontManager::BOLD_CONDENSED, '', 7);
            $this->pdf->SetTextColor(255, 255, 255);
            $this->pdf->SetXY($x, $y);
            $this->pdf->Cell($w, $barH, $phase['label'], 0, 0, 'C');

            // Dates below
            $this->pdf->SetFont(FontManager::ROMAN, '', 7);
            $this->pdf->SetTextColor(114, 112, 112);
            $dateStr = date('d/m', strtotime($phase['start']));
            if ($phase['start'] !== $phase['end']) {
                $dateStr .= ' - ' . date('d/m', strtotime($phase['end']));
            }
            $this->pdf->SetXY($x, $y + $barH + 1);
            $this->pdf->Cell($w, 4, $dateStr, 0, 0, 'C');

            $y += $barH + 7;
        }

        $this->pdf->SetY($y + 3);
        FontManager::apply($this->pdf, 'body');
    }

    /**
     * Ensure minimum vertical space, jump to new page if needed.
     */
    private function ensureSpace(float $mm): void
    {
        $remaining = 297 - $this->pdf->GetY() - 22;
        if ($remaining < $mm) {
            $this->pdf->AddPage();
            $this->pdf->SetY(25);
        }
    }

    /**
     * Render an image from a file path, with WebP conversion and proper sizing.
     */
    private function renderItemImage(string $path, string $mime, float $maxW = 170): void
    {
        // Convert WebP
        $imagePath = $path;
        if (str_contains($mime, 'webp')) {
            $img = @imagecreatefromwebp($path);
            if (!$img) return;
            $tmpPath = sys_get_temp_dir() . '/item_' . md5($path) . '.png';
            imagepng($img, $tmpPath);
            imagedestroy($img);
            $imagePath = $tmpPath;
        }

        $imgSize = @getimagesize($imagePath);
        if (!$imgSize) return;

        $imgRatio = $imgSize[1] / $imgSize[0];
        $drawH = $maxW * $imgRatio;
        $maxPageH = 297 - 25 - 22;
        if ($drawH > $maxPageH) {
            $drawH = $maxPageH;
            $maxW = $drawH / $imgRatio;
        }

        $this->ensureSpace($drawH + 5);

        $this->pdf->Image($imagePath, 20, $this->pdf->GetY(), $maxW, $drawH, '', '', '', false, 300, '', false, false, 0);
        $this->pdf->SetY($this->pdf->GetY() + $drawH + 3);
    }

    /**
     * Render VIP cards: small photo (passport-size) + name + description for each VIP.
     * Only renders one photo per VIP (the latest uploaded).
     */
    private function renderVipCards(): void
    {
        $appSection = $this->plan->sections->firstWhere('section_number', 6);
        if (!$appSection) return;

        $vipsJson = $appSection->form_data['vips_json'] ?? '[]';
        $vips = json_decode($vipsJson, true);
        if (!is_array($vips) || empty($vips)) return;

        // Get all VIP photos, grouped by index
        $vipPhotos = $this->plan->files
            ->where('section_number', 6)
            ->filter(fn($f) => str_starts_with($f->file_category ?? '', 'vip_foto'));

        foreach ($vips as $i => $vip) {
            $nombre = $vip['nombre'] ?? '';
            $descripcion = $vip['descripcion'] ?? '';
            if (!$nombre && !$descripcion) continue;

            // Check space: photo (30mm) + text needs ~45mm
            $remainingSpace = 297 - $this->pdf->GetY() - 22;
            if ($remainingSpace < 50) {
                $this->pdf->AddPage();
                $this->pdf->SetY(25);
            }

            $startY = $this->pdf->GetY();

            // Match photo to VIP: try indexed category first, then take by position
            $photo = $vipPhotos->firstWhere('file_category', "vip_foto_{$i}");
            if (!$photo) {
                // Fallback: take the i-th photo with generic 'vip_foto' category
                $genericPhotos = $vipPhotos->where('file_category', 'vip_foto')->values();
                $photo = $genericPhotos->get($i);
            }

            $photoW = 25; // mm — passport size
            $photoH = 30;
            $textX = 20; // default left margin

            if ($photo && file_exists($photo->absolute_path)) {
                $path = $photo->absolute_path;
                $mime = $photo->mime_type ?? '';

                // Convert WebP
                if (str_contains($mime, 'webp')) {
                    $img = @imagecreatefromwebp($path);
                    if ($img) {
                        $tmpPath = sys_get_temp_dir() . '/vip_' . md5($path) . '.png';
                        imagepng($img, $tmpPath);
                        imagedestroy($img);
                        $path = $tmpPath;
                    }
                }

                $this->pdf->Image($path, 20, $startY, $photoW, $photoH, '', '', '', false, 150, '', false, false, 0);
                $textX = 20 + $photoW + 5; // text starts after photo
            }

            // Name
            FontManager::apply($this->pdf, 'subsection');
            $this->pdf->SetXY($textX, $startY);
            $textW = 210 - $textX - 20;
            $this->pdf->MultiCell($textW, 7, $nombre, 0, 'L', false, 1, $textX, null, true);

            // Description
            if ($descripcion) {
                FontManager::apply($this->pdf, 'body');
                $this->pdf->MultiCell($textW, 6, $descripcion, 0, 'L', false, 1, $textX, null, true);
            }

            // Move Y to below whichever is taller: photo or text
            $textEndY = $this->pdf->GetY();
            $photoEndY = $startY + $photoH;
            $this->pdf->SetY(max($textEndY, $photoEndY) + 8);
        }
    }

    private function renderSectionImages(array $appSections): void
    {
        foreach ($appSections as $secNum) {
            $files = $this->plan->files
                ->where('section_number', $secNum)
                ->filter(fn(PlanFile $f) => str_starts_with($f->mime_type ?? '', 'image/'));

            foreach ($files as $file) {
                if (!file_exists($file->absolute_path)) continue;

                $path = $file->absolute_path;
                $mime = $file->mime_type ?? '';

                // Convert WebP to PNG
                if (str_contains($mime, 'webp')) {
                    $img = @imagecreatefromwebp($path);
                    if (!$img) continue;
                    $tmpPath = sys_get_temp_dir() . '/sec_img_' . md5($path) . '.png';
                    imagepng($img, $tmpPath);
                    imagedestroy($img);
                    $path = $tmpPath;
                }

                // Get real image dimensions to calculate height in PDF
                $imgSize = @getimagesize($path);
                if (!$imgSize) continue;

                $maxW = 170; // mm
                $imgRatio = $imgSize[1] / $imgSize[0]; // height/width
                $drawH = $maxW * $imgRatio;

                // Cap height to page area
                $maxPageH = 297 - 25 - 22; // top margin - bottom margin
                if ($drawH > $maxPageH) {
                    $drawH = $maxPageH;
                    $maxW = $drawH / $imgRatio;
                }

                // Check if there's enough space; if not, new page
                $remainingSpace = 297 - $this->pdf->GetY() - 22;
                if ($remainingSpace < $drawH + 5) {
                    $this->pdf->AddPage();
                    $this->pdf->SetY(25);
                }

                $this->pdf->Image(
                    $path,
                    20, $this->pdf->GetY(),
                    $maxW, $drawH,
                    '', '', '', false, 300, '', false, false, 0
                );

                $this->pdf->SetY($this->pdf->GetY() + $drawH + 5);
            }
        }
    }
}
