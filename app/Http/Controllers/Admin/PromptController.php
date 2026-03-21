<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PromptTemplate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PromptController extends Controller
{
    public function index()
    {
        $prompts = PromptTemplate::orderBy('section_number')->get()->map(fn($p) => [
            'section_number' => $p->section_number,
            'section_name' => $p->section_name,
            'model' => $p->model,
            'max_tokens' => $p->max_tokens,
            'updated_at' => $p->updated_at?->format('d/m/Y H:i'),
        ]);

        return Inertia::render('Admin/Prompts', ['prompts' => $prompts]);
    }

    public function edit(int $section)
    {
        $prompt = PromptTemplate::where('section_number', $section)->firstOrFail();

        return Inertia::render('Admin/PromptEdit', [
            'prompt' => [
                'section_number' => $prompt->section_number,
                'section_name' => $prompt->section_name,
                'system_prompt' => $prompt->system_prompt,
                'user_prompt_template' => $prompt->user_prompt_template,
                'example_output' => $prompt->example_output,
                'model' => $prompt->model,
                'max_tokens' => $prompt->max_tokens,
            ],
        ]);
    }

    public function update(Request $request, int $section)
    {
        $data = $request->validate([
            'system_prompt' => 'required|string',
            'user_prompt_template' => 'required|string',
            'example_output' => 'nullable|string',
            'model' => 'required|string|in:gpt-4o-mini,gpt-4o,gpt-4-turbo',
            'max_tokens' => 'required|integer|min:512|max:16000',
        ]);

        PromptTemplate::where('section_number', $section)->update([
            ...$data,
            'updated_by' => auth()->id(),
        ]);

        return redirect()->route('admin.prompts.index')->with('success', 'Prompt actualizado.');
    }
}
