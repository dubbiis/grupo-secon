<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('plan_files')) return;
        Schema::create('plan_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')->constrained()->onDelete('cascade');
            $table->tinyInteger('section_number');
            $table->string('file_category'); // plano|excel|logo|imagen_ruta|anexo|acreditacion|portada|run_of_show
            $table->string('file_path');
            $table->string('original_name');
            $table->string('mime_type')->nullable();
            $table->tinyInteger('order')->default(0);
            $table->json('metadata')->nullable(); // tipo de plano, nombre acreditación, etc.
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_files');
    }
};
