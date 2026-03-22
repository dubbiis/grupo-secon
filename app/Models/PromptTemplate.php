<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PromptTemplate extends Model
{
    protected $fillable = [
        'section_number', 'section_name',
        'system_prompt', 'user_prompt_template', 'example_output', 'use_example_output',
        'model', 'max_tokens', 'updated_by',
    ];

    protected $casts = [
        'use_example_output' => 'boolean',
    ];

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public static function forSection(int $section): ?self
    {
        return static::where('section_number', $section)->first();
    }

    public function buildUserPrompt(array $variables): string
    {
        $prompt = $this->user_prompt_template;
        foreach ($variables as $key => $value) {
            if (is_array($value) || is_object($value)) continue;
            $prompt = str_replace('{{' . $key . '}}', $value ?? '', $prompt);
        }
        return $prompt;
    }
}
