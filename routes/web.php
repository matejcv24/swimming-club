<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\ClubParentController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\MembershipFeeController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfitController;
use App\Http\Controllers\SalaryController;
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

Route::post('/claim-coach-account/{coach}', [StaffController::class, 'claimAccount'])
    ->name('claim-coach-account.store')
    ->middleware('signed');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [AdminController::class, 'index'])->name('dashboard');
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');

    Route::middleware(['role:admin,coach'])->group(function () {
        Route::get('/members', [MemberController::class, 'index'])->name('members.index');
        Route::post('/parents', [ClubParentController::class, 'store'])->name('parents.store');
        Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance.index');

        Route::get('/trainings/by-date', [TrainingController::class, 'getByDate'])->name('trainings.byDate');
        Route::resource('trainings', TrainingController::class);

        Route::get('/membership-fees/by-member/{member}', [MembershipFeeController::class, 'getByMember'])
            ->name('membership-fees.byMember');
        Route::resource('membership-fees', MembershipFeeController::class);

        Route::get('/unpaid-fees', [UnpaidFeeController::class, 'index'])->name('unpaid-fees.index');
    });

    Route::middleware(['role:admin'])->group(function () {
        Route::get('/staff', [StaffController::class, 'index'])->name('staff.index');
        Route::post('/staff', [StaffController::class, 'store'])->name('staff.store');

        Route::post('/salaries', [SalaryController::class, 'store'])->name('salaries.store');
        Route::get('/salaries/by-coach/{coach}', [SalaryController::class, 'getByCoach'])->name('salaries.byCoach');

        Route::get('/invoices', [AdminController::class, 'invoices'])->name('invoices.page');
        Route::post('/invoices', [InvoiceController::class, 'store'])->name('invoices.store');
        Route::get('/invoices/by-month/{month}', [InvoiceController::class, 'getByMonth'])->name('invoices.byMonth');
        Route::put('/invoices/{invoice}', [InvoiceController::class, 'update'])->name('invoices.update');
        Route::delete('/invoices/{invoice}', [InvoiceController::class, 'destroy'])->name('invoices.destroy');

        Route::get('/profit', [ProfitController::class, 'index'])->name('profit.index');
    });
});
