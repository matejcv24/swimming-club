<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\ClubController;
use App\Http\Controllers\ClubParentController;
use App\Http\Controllers\FamilyController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\MembershipFeeController;
use App\Http\Controllers\MonthlyReportController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfitController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\StaffInvitationController;
use App\Http\Controllers\TrainingController;
use App\Http\Controllers\UnpaidFeeController;
use Illuminate\Support\Facades\Route;

// An invitation link: the invited person sets their password and is logged in
Route::middleware('guest')->group(function () {
    Route::get('/invitation/{token}', [StaffInvitationController::class, 'show'])->name('invitation.show');
    Route::post('/invitation/{token}', [StaffInvitationController::class, 'accept'])
        ->middleware('throttle:10,1')
        ->name('invitation.accept');
});

// From a payment reminder: a parent sees the attendance and payments of the
// members the email was about (a signed link that expires; no login)
Route::get('/family', [FamilyController::class, 'show'])
    ->middleware(['signed', 'throttle:60,1'])
    ->name('family.show');

// The club's logo: also on the login and invitation pages, before anyone logs in
Route::get('/club/logo', [ClubController::class, 'logo'])->name('club.logo');

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
        // The club's name, email and logo: only admins change them
        Route::post('/club', [ClubController::class, 'update'])->name('club.update');
        Route::delete('/club/logo', [ClubController::class, 'destroyLogo'])->name('club.logo.destroy');

        Route::get('/staff', [StaffController::class, 'index'])->name('staff.index');

        // The club's groups: only admins add, rename or delete them
        Route::get('/groups', [GroupController::class, 'index'])->name('groups.index');
        Route::post('/groups', [GroupController::class, 'store'])->name('groups.store');
        Route::put('/groups/{group}', [GroupController::class, 'update'])->name('groups.update');
        Route::delete('/groups/{group}', [GroupController::class, 'destroy'])->name('groups.destroy');

        // Staff join by invitation (they set their own password)
        Route::post('/staff/invitations', [StaffInvitationController::class, 'store'])->name('staff.invitations.store');
        Route::post('/staff/invitations/{invitation}/resend', [StaffInvitationController::class, 'resend'])->name('staff.invitations.resend');
        Route::delete('/staff/invitations/{invitation}', [StaffInvitationController::class, 'destroy'])->name('staff.invitations.destroy');
        Route::put('/staff/{coach}', [StaffController::class, 'update'])->name('staff.update');
        Route::put('/staff/{coach}/active', [StaffController::class, 'setActive'])->name('staff.active');

        Route::put('/membership-fees/{membershipFee}', [MembershipFeeController::class, 'update'])->name('membership-fees.update');
        Route::delete('/members/{member}', [MemberController::class, 'destroy'])->name('members.destroy');

        // Payment reminders by email: a preview first, then sending (admins only)
        Route::get('/unpaid-fees/{member}/reminder', [UnpaidFeeController::class, 'preview'])->name('unpaid-fees.reminder.preview');
        Route::post('/unpaid-fees/{member}/reminder', [UnpaidFeeController::class, 'send'])
            ->middleware('throttle:30,1')
            ->name('unpaid-fees.reminder.send');

        Route::post('/salaries', [SalaryController::class, 'store'])->name('salaries.store');
        // Mistakes can be corrected from a person's salary history
        Route::put('/salaries/{salary}', [SalaryController::class, 'update'])->name('salaries.update');
        Route::delete('/salaries/{salary}', [SalaryController::class, 'destroy'])->name('salaries.destroy');
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
