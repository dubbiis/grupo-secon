<?php

namespace App\Http\Controllers;

use App\Models\CustomQuestion;
use Illuminate\Http\Request;

class CustomQuestionController extends Controller
{
    public function index(int $section)
    {
        $questions = CustomQuestion::forSection($section);

        return response()->json($questions->map(fn($q) => [
            'id' => $q->id,
            'question_text' => $q->question_text,
            'is_template' => $q->is_template,
        ]));
    }

    public function store(Request $request)
    {
        $request->validate([
            'section_number' => 'required|integer|min:1|max:15',
            'question_text' => 'required|string|max:500',
        ]);

        $question = CustomQuestion::firstOrCreate(
            [
                'section_number' => $request->input('section_number'),
                'question_text' => $request->input('question_text'),
            ],
            [
                'created_by' => $request->user()->id,
            ]
        );

        return response()->json([
            'id' => $question->id,
            'question_text' => $question->question_text,
            'is_template' => $question->is_template,
        ]);
    }

    public function toggleTemplate(int $id)
    {
        $question = CustomQuestion::findOrFail($id);
        $question->update(['is_template' => !$question->is_template]);

        return response()->json([
            'id' => $question->id,
            'is_template' => $question->is_template,
        ]);
    }
}
