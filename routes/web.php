<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\MembershipFeeController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfitController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\TrainingController;
use App\Http\Controllers\UnpaidFeeController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/claim-coach-account/{coach}', [StaffController::class, 'showClaimForm'])
    ->name('claim-coach-account')
    ->middleware('signed');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [AdminController::class, 'index'])->name('dashboard');
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');

    Route::middleware(['role:admin,coach'])->group(function () {
        Route::get('/members', [MemberController::class, 'index'])->name('members.index');
        Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance.index');

        Route::get('/trainings', [TrainingController::class, 'index'])->name('trainings.index');

        Route::get('/membership-fees', [MembershipFeeController::class, 'index'])->name('membership-fees.index');

        Route::get('/unpaid-fees', [UnpaidFeeController::class, 'index'])->name('unpaid-fees.index');
    });

    Route::middleware(['role:admin'])->group(function () {
        Route::get('/staff', [StaffController::class, 'index'])->name('staff.index');

        Route::get('/invoices', [AdminController::class, 'invoices'])->name('invoices.page');

        Route::get('/profit', [ProfitController::class, 'index'])->name('profit.index');
    });
});
