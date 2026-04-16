<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\ClubParentController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\MembershipFeeController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\StaffController;
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
    Route::get('/membership-fees/by-member/{member}', [MembershipFeeController::class, 'getByMember'])
        ->name('membership-fees.byMember');
    Route::resource('membership-fees', MembershipFeeController::class);
    Route::get('/staff', [StaffController::class, 'index'])->name('staff.index');
    Route::post('/staff', [StaffController::class, 'store'])->name('staff.store');
    Route::post('/salaries', [SalaryController::class, 'store'])->name('salaries.store');
    Route::get('/salaries/by-coach/{coach}', [SalaryController::class, 'getByCoach'])->name('salaries.byCoach');
});
