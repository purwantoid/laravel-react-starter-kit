<?php

declare(strict_types=1);

use App\Http\Controllers\Web\RoleController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', static function () {
    return Inertia::render('dashboard');
})->name('dashboard');

Route::group(['prefix' => '/roles'], static function () {
  Route::get('/', [RoleController::class, 'index'])->name('roles.index');
  Route::post('/store', [RoleController::class, 'store'])->name('roles.store');
  Route::delete('/delete/{id}', [RoleController::class, 'destroy'])->name('roles.destroy');
  Route::get('/permissions', [RoleController::class, 'permissions'])->name('roles.permissions');
});
