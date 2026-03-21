<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Usuario admin por defecto
        User::updateOrCreate(
            ['email' => 'admin@gruposecon.com'],
            [
                'name' => 'Admin Secon',
                'password' => Hash::make('secon2025'),
                'role' => 'admin',
            ]
        );

        // Cargar prompts de las 15 secciones
        $this->call(PromptTemplateSeeder::class);
    }
}
