<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prompt_templates', function (Blueprint $table) {
            $table->boolean('use_example_output')->default(false)->after('example_output');
        });
    }

    public function down(): void
    {
        Schema::table('prompt_templates', function (Blueprint $table) {
            $table->dropColumn('use_example_output');
        });
    }
};
