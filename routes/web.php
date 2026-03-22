<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\PlanSectionController;
use App\Http\Controllers\PlanFileController;
use App\Http\Controllers\PlanPdfController;
use App\Http\Controllers\GoogleMapsController;
use App\Http\Controllers\CustomQuestionController;
use App\Http\Controllers\Admin\PromptController;
use App\Http\Controllers\Admin\StatsController;
use App\Http\Controllers\Admin\UserController;
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
    Route::post('/planes/{uuid}/seccion/7/identificar-riesgos', [PlanSectionController::class, 'identificarRiesgos'])->name('planes.seccion.identificar-riesgos');
    Route::post('/planes/{uuid}/seccion/7/analizar-riesgos', [PlanSectionController::class, 'analizarRiesgos'])->name('planes.seccion.analizar-riesgos');

    // Archivos
    Route::post('/planes/{uuid}/seccion/{section}/archivo', [PlanFileController::class, 'store'])->name('planes.archivo.store');
    Route::delete('/planes/archivos/{file}', [PlanFileController::class, 'destroy'])->name('planes.archivo.destroy');

    // PDF
    Route::get('/planes/{uuid}/pdf/previsualizar', [PlanPdfController::class, 'preview'])->name('planes.pdf.preview');
    Route::get('/planes/{uuid}/pdf/descargar', [PlanPdfController::class, 'download'])->name('planes.pdf.download');

    // VIP AI description
    Route::post('/planes/{uuid}/vip-describir', [PlanSectionController::class, 'vipDescribir'])->name('planes.vip.describir');

    // Maps (Nominatim + Overpass + Valhalla)
    Route::post('/planes/{uuid}/maps/transporte', [GoogleMapsController::class, 'transporte'])->name('planes.maps.transporte');
    Route::post('/planes/{uuid}/maps/emergencia', [GoogleMapsController::class, 'emergencia'])->name('planes.maps.emergencia');

    // Custom questions
    Route::get('/custom-questions/{section}', [CustomQuestionController::class, 'index']);
    Route::post('/custom-questions', [CustomQuestionController::class, 'store']);
    Route::put('/custom-questions/{id}/toggle-template', [CustomQuestionController::class, 'toggleTemplate']);

    // Herramientas standalone
    Route::get('/editor-mapas', fn() => inertia('EditorMapas'))->name('editor-mapas');
    Route::get('/editor-acreditaciones', fn() => inertia('EditorAcreditaciones'))->name('editor-acreditaciones');

    // Admin
    Route::middleware('admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/prompts', [PromptController::class, 'index'])->name('prompts.index');
        Route::get('/prompts/{section}', [PromptController::class, 'edit'])->name('prompts.edit');
        Route::put('/prompts/{section}', [PromptController::class, 'update'])->name('prompts.update');
        Route::get('/stats', [StatsController::class, 'index'])->name('stats');
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });
});
