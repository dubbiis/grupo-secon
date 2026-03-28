<?php

namespace App\Services\Pdf;

use setasign\Fpdi\Tcpdf\Fpdi;

class TcpdfInstance extends Fpdi
{
    protected bool $useBackground = false;
    protected $bgTemplate = null;
    protected string $eventName = '';
    protected string $footerLogoPath = '';

    public function __construct()
    {
        parent::__construct('P', 'mm', 'A4', true, 'UTF-8');
        $this->SetCreator('Grupo Secon');
        $this->SetAutoPageBreak(true, 22);
        $this->SetMargins(20, 25, 20);
        $this->setPrintHeader(false);
        $this->setPrintFooter(false);
    }

    public function setBackgroundTemplate(string $templatePath): void
    {
        $this->setSourceFile($templatePath);
        $this->bgTemplate = $this->importPage(1);
    }

    public function reloadBackgroundTemplate(): void
    {
        $templatePath = config('pdf.base_template');
        $this->setSourceFile($templatePath);
        $this->bgTemplate = $this->importPage(1);
    }

    public function enableBackground(bool $enabled = true): void
    {
        $this->useBackground = $enabled;
    }

    public function setEventName(string $name): void
    {
        $this->eventName = $name;
    }

    public function setFooterLogoPath(string $path): void
    {
        $this->footerLogoPath = $path;
    }

    public function AddPage($orientation = '', $format = '', $keepmargins = false, $tocpage = false): void
    {
        parent::AddPage($orientation, $format, $keepmargins, $tocpage);

        if ($this->useBackground && $this->bgTemplate) {
            $this->useTemplate($this->bgTemplate, 0, 0, 210, 297);
        }
    }

    public function drawFooter(): void
    {
        $this->SetY(-12);
        $this->SetFont('helveticaneueroman', '', 9);
        $this->SetTextColor(255, 255, 255);

        // Event name centered
        $this->Cell(0, 5, strtoupper($this->eventName), 0, 0, 'C');

        // Page number right
        $this->SetX(-30);
        $this->Cell(10, 5, (string) $this->getAliasNumPage(), 0, 0, 'R');
    }

    // Prevent TCPDF default header/footer
    public function Header(): void {}
    public function Footer(): void
    {
        if ($this->useBackground) {
            $this->drawFooter();
        }
    }
}
