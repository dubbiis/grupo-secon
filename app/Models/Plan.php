<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = ['uuid', 'title', 'status', 'user_id', 'branding'];

    protected $casts = [
        'branding' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($plan) {
            if (empty($plan->uuid)) {
                $plan->uuid = static::generateUuid();
            }
        });

        static::created(function ($plan) {
            // Crear las 15 secciones vacías automáticamente
            $secciones = [
                1 => 'Objetivo del Plan de Seguridad',
                2 => 'Descripción General del Evento',
                3 => 'Identificación de Titulares y Espacios',
                4 => 'Establecimiento y Accesos',
                5 => 'Recursos Sanitarios y de Seguridad',
                6 => 'Perfil del Público Asistente',
                7 => 'Análisis de Riesgos y Medidas Preventivas',
                8 => 'Dispositivo de Seguridad',
                9 => 'Planificación del Personal',
                10 => 'Medios de Transporte',
                11 => 'Run of Show',
                12 => 'Acreditaciones',
                13 => 'Contactos de Interés',
                14 => 'Anexos y Documentación',
                15 => 'Branding y Generación de PDF',
            ];

            foreach ($secciones as $num => $nombre) {
                PlanSection::create([
                    'plan_id' => $plan->id,
                    'section_number' => $num,
                    'section_name' => $nombre,
                    'status' => 'pendiente',
                ]);
            }
        });
    }

    protected static function generateUuid(): string
    {
        $year = date('Y');
        $prefix = 'SECON-' . $year . '-';
        $last = static::where('uuid', 'like', $prefix . '%')
            ->orderByRaw('CAST(SUBSTRING(uuid, ?) AS UNSIGNED) DESC', [strlen($prefix) + 1])
            ->value('uuid');
        $next = $last ? (int) substr($last, strlen($prefix)) + 1 : 1;
        return $prefix . str_pad($next, 3, '0', STR_PAD_LEFT);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function sections()
    {
        return $this->hasMany(PlanSection::class)->orderBy('section_number');
    }

    public function files()
    {
        return $this->hasMany(PlanFile::class)->orderBy('section_number')->orderBy('order');
    }

    public function getProgressAttribute(): int
    {
        $total = 15;
        $done = $this->sections()->whereIn('status', ['listo', 'editado'])->count();
        return $total > 0 ? (int) round(($done / $total) * 100) : 0;
    }

    public function getSectionByNumber(int $number): ?PlanSection
    {
        return $this->sections()->where('section_number', $number)->first();
    }

    public function getFilesBySection(int $sectionNumber)
    {
        return $this->files()->where('section_number', $sectionNumber)->get();
    }
}
