<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlanUsageLog extends Model
{
    protected $fillable = [
        'plan_id', 'section_number', 'model', 'type',
        'prompt_tokens', 'completion_tokens', 'total_tokens', 'cost_usd',
    ];

    protected $casts = ['cost_usd' => 'float'];

    // Precios por millón de tokens (input / output) en USD
    const MODEL_PRICES = [
        'gpt-4o-mini'  => ['input' => 0.15,  'output' => 0.60],
        'gpt-4o'       => ['input' => 2.50,  'output' => 10.00],
        'gpt-4-turbo'  => ['input' => 10.00, 'output' => 30.00],
    ];

    public static function calculateCost(string $model, int $promptTokens, int $completionTokens): float
    {
        $prices = self::MODEL_PRICES[$model] ?? self::MODEL_PRICES['gpt-4o-mini'];
        return ($promptTokens / 1_000_000 * $prices['input'])
             + ($completionTokens / 1_000_000 * $prices['output']);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }
}
