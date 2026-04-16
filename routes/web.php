<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\TrainingController;
use App\Http\Controllers\MembershipFeeController;
use App\Http\Controllers\ClubParentController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\Auth\ClaimAccountController;
use App\Http\Controllers\Auth\ClaimCoachAccountController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SalaryController;

// Redirect home to dashboard
Route::get('/', function () {
    return redirect('/dashboard');
});

// Claim parent account (public - no auth required)
Route::get('/claim-account/{parent}', [ClaimAccountController::class, 'show'])
    ->name('claim.account');
Route::post('/claim-account/{parent}', [ClaimAccountController::class, 'store'])
    ->name('claim.account.store');

// Claim coach account (public - no auth required)
Route::get('/claim-coach-account/{coach}', [ClaimCoachAccountController::class, 'show'])
    ->name('claim.coach.account');
Route::post('/claim-coach-account/{coach}', [ClaimCoachAccountController::class, 'store'])
    ->name('claim.coach.account.store');

// Protected routes (must be logged in)
Route::middleware(['auth'])->group(function () {

    // Dashboard
    Route::get('/dashboard', [AdminController::class, 'index'])->name('dashboard');

    // Members
    Route::resource('members', MemberController::class);

    // Parents
    Route::post('/parents', [ClubParentController::class, 'store'])->name('parents.store');

    // Trainings + Attendance
    Route::get('/trainings/by-date', [TrainingController::class, 'getByDate'])->name('trainings.byDate');
    Route::resource('trainings', TrainingController::class);

    // Membership Fees
    Route::get('/membership-fees/by-member/{member}', [MembershipFeeController::class, 'getByMember'])
        ->name('membership-fees.byMember');
    Route::resource('membership-fees', MembershipFeeController::class);

    // Staff
    Route::get('/staff', [StaffController::class, 'index'])->name('staff.index');
    Route::post('/staff', [StaffController::class, 'store'])->name('staff.store');

    // Salaries
Route::post('/salaries', [SalaryController::class, 'store'])->name('salaries.store');
Route::get('/salaries/by-coach/{coach}', [SalaryController::class, 'getByCoach'])->name('salaries.byCoach');

});