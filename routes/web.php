<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\ClubParentController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\MembershipFeeController;
use App\Http\Controllers\MonthlyReportController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfitController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\TrainingController;
use App\Http\Controllers\UnpaidFeeController;
use Illuminate\Support\Facades\Route;

// The bare address goes to the login page (logged-in users are sent on to the dashboard)
Route::redirect('/', '/login')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [AdminController::class, 'index'])->name('dashboard');
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');

    Route::middleware(['role:admin,coach'])->group(function () {
        // Only what the app uses: other URLs answer "not found", never an error
        Route::resource('members', MemberController::class)->only(['index', 'store', 'update']);
        Route::post('/parents', [ClubParentController::class, 'store'])->name('parents.store');
        Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance.index');
        Route::get('/attendance/by-member/{member}', [AttendanceController::class, 'byMember'])->name('attendance.byMember');

        Route::get('/trainings/by-date', [TrainingController::class, 'getByDate'])->name('trainings.byDate');
        Route::get('/trainings/days', [TrainingController::class, 'recordedDays'])->name('trainings.days');
        Route::resource('trainings', TrainingController::class)->only(['index', 'store']);

        Route::get('/membership-fees/by-member/{member}', [MembershipFeeController::class, 'getByMember'])
            ->name('membership-fees.byMember');
        Route::resource('membership-fees', MembershipFeeController::class)->only(['index', 'store']);

        Route::get('/unpaid-fees', [UnpaidFeeController::class, 'index'])->name('unpaid-fees.index');
    });

    Route::middleware(['role:admin'])->group(function () {
        Route::get('/staff', [StaffController::class, 'index'])->name('staff.index');

        // The club's groups: only admins add, rename or delete them
        Route::get('/groups', [GroupController::class, 'index'])->name('groups.index');
        Route::post('/groups', [GroupController::class, 'store'])->name('groups.store');
        Route::put('/groups/{group}', [GroupController::class, 'update'])->name('groups.update');
        Route::delete('/groups/{group}', [GroupController::class, 'destroy'])->name('groups.destroy');

        Route::post('/staff', [StaffController::class, 'store'])->name('staff.store');
        Route::put('/staff/{coach}', [StaffController::class, 'update'])->name('staff.update');
        Route::put('/staff/{coach}/active', [StaffController::class, 'setActive'])->name('staff.active');

        Route::put('/membership-fees/{membershipFee}', [MembershipFeeController::class, 'update'])->name('membership-fees.update');
        Route::delete('/members/{member}', [MemberController::class, 'destroy'])->name('members.destroy');

        Route::post('/salaries', [SalaryController::class, 'store'])->name('salaries.store');
        Route::get('/salaries/by-coach/{coach}', [SalaryController::class, 'getByCoach'])->name('salaries.byCoach');

        Route::get('/invoices', [AdminController::class, 'invoices'])->name('invoices.page');
        Route::post('/invoices', [InvoiceController::class, 'store'])->name('invoices.store');
        Route::get('/invoices/by-month/{month}', [InvoiceController::class, 'getByMonth'])->name('invoices.byMonth');
        Route::put('/invoices/{invoice}', [InvoiceController::class, 'update'])->name('invoices.update');
        Route::delete('/invoices/{invoice}', [InvoiceController::class, 'destroy'])->name('invoices.destroy');

        Route::get('/profit', [ProfitController::class, 'index'])->name('profit.index');

        Route::get('/reports/monthly', [MonthlyReportController::class, 'download'])->name('reports.monthly');
    });
});
