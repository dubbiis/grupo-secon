<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Usuario admin por defecto
        User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@gruposecon.com',
            'role' => 'admin',
        ]);

        // Cargar prompts de las 15 secciones
        $this->call(PromptTemplateSeeder::class);
    }
}
