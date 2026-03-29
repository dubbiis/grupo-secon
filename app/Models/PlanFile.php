<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class PlanFile extends Model
{
    protected $fillable = [
        'plan_id', 'section_number', 'file_category',
        'file_path', 'original_name', 'mime_type', 'order', 'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function getUrlAttribute(): string
    {
        return "/archivos/{$this->id}";
    }

    public function getAbsolutePathAttribute(): string
    {
        return Storage::disk('public')->path($this->file_path);
    }

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($file) {
            Storage::disk('public')->delete($file->file_path);
        });
    }
}
