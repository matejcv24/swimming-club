<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\ClubParentController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\TrainingController;
use Inertia\Inertia;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [AdminController::class, 'index'])->name('dashboard');
    Route::resource('members', MemberController::class);
    Route::post('/parents', [ClubParentController::class, 'store'])->name('parents.store');
    Route::get('/trainings/by-date', [TrainingController::class, 'getByDate'])->name('trainings.byDate');
    Route::resource('trainings', TrainingController::class);
});
