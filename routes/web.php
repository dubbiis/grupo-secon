<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\PlanSectionController;
use App\Http\Controllers\PlanFileController;
use App\Http\Controllers\PlanPdfController;
use App\Http\Controllers\Admin\PromptController;
use App\Http\Controllers\Admin\StatsController;
use Illuminate\Support\Facades\Route;

// Auth
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
    Route::get('/register', [RegisterController::class, 'create'])->name('register');
    Route::post('/register', [RegisterController::class, 'store']);
});

Route::post('/logout', [LoginController::class, 'destroy'])->name('logout')->middleware('auth');

// App — requiere auth
Route::middleware('auth')->group(function () {
    Route::get('/', [PlanController::class, 'index'])->name('dashboard');
    Route::post('/planes', [PlanController::class, 'store'])->name('planes.store');
    Route::delete('/planes/{plan}', [PlanController::class, 'destroy'])->name('planes.destroy');

    // Secciones
    Route::get('/planes/{uuid}/seccion/{section}', [PlanSectionController::class, 'show'])->name('planes.seccion');
    Route::put('/planes/{uuid}/seccion/{section}', [PlanSectionController::class, 'update'])->name('planes.seccion.update');
    Route::post('/planes/{uuid}/seccion/{section}/generar', [PlanSectionController::class, 'generar'])->name('planes.seccion.generar');
    Route::post('/planes/{uuid}/seccion/{section}/cambios', [PlanSectionController::class, 'cambios'])->name('planes.seccion.cambios');

    // Archivos
    Route::post('/planes/{uuid}/seccion/{section}/archivo', [PlanFileController::class, 'store'])->name('planes.archivo.store');
    Route::delete('/planes/archivos/{file}', [PlanFileController::class, 'destroy'])->name('planes.archivo.destroy');

    // PDF
    Route::get('/planes/{uuid}/pdf/previsualizar', [PlanPdfController::class, 'preview'])->name('planes.pdf.preview');
    Route::get('/planes/{uuid}/pdf/descargar', [PlanPdfController::class, 'download'])->name('planes.pdf.download');

    // Admin
    Route::middleware('admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/prompts', [PromptController::class, 'index'])->name('prompts.index');
        Route::get('/prompts/{section}', [PromptController::class, 'edit'])->name('prompts.edit');
        Route::put('/prompts/{section}', [PromptController::class, 'update'])->name('prompts.update');
        Route::get('/stats', [StatsController::class, 'index'])->name('stats');
    });
});
