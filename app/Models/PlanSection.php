<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlanSection extends Model
{
    protected $fillable = [
        'plan_id', 'section_number', 'section_name',
        'form_data', 'generated_text', 'status',
    ];

    protected $casts = [
        'form_data' => 'array',
    ];

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function isDone(): bool
    {
        return in_array($this->status, ['listo', 'editado']);
    }

    public function hasGeneratedText(): bool
    {
        return !empty($this->generated_text);
    }
}
