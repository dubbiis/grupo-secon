<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomQuestion extends Model
{
    protected $fillable = [
        'section_number', 'question_text', 'is_template', 'created_by',
    ];

    protected $casts = [
        'is_template' => 'boolean',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public static function forSection(int $section)
    {
        return static::where('section_number', $section)->orderByDesc('is_template')->latest()->get();
    }

    public static function templatesForSection(int $section)
    {
        return static::where('section_number', $section)->where('is_template', true)->get();
    }
}
