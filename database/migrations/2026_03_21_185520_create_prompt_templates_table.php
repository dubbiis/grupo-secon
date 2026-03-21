<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prompt_templates', function (Blueprint $table) {
            $table->id();
            $table->tinyInteger('section_number')->unique();
            $table->string('section_name');
            $table->text('system_prompt');
            $table->text('user_prompt_template');
            $table->string('model')->default('gpt-4o-mini');
            $table->integer('max_tokens')->default(4096);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prompt_templates');
    }
};
