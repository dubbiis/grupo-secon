<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plan_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')->constrained()->onDelete('cascade');
            $table->tinyInteger('section_number');
            $table->string('section_name');
            $table->json('form_data')->nullable();
            $table->longText('generated_text')->nullable();
            $table->enum('status', ['pendiente', 'generando', 'listo', 'editado'])->default('pendiente');
            $table->timestamps();

            $table->unique(['plan_id', 'section_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_sections');
    }
};
