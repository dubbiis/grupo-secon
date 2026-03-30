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
        $this->setPrintFooter(true);
        $this->setFooterMargin(10);
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

    public function getEventName(): string
    {
        return $this->eventName;
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
        // Position text centered vertically on the blue bar (~last 8mm of page)
        $this->SetY(-8);
        $this->SetFont('helveticaneueroman', '', 8);
        $this->SetTextColor(255, 255, 255);

        // Event name centered (skip logo area on the left ~25mm)
        $this->SetX(30);
        $this->Cell(150, 4, strtoupper($this->eventName), 0, 0, 'C');

        // Page number right
        $this->SetX(-25);
        $this->Cell(15, 4, (string) $this->getAliasNumPage(), 0, 0, 'R');
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
