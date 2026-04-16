<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\ClubParentController;
use App\Http\Controllers\MemberController;
use Inertia\Inertia;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [AdminController::class, 'index'])->name('dashboard');
    Route::resource('members', MemberController::class);
    Route::post('/parents', [ClubParentController::class, 'store'])->name('parents.store');
});
