<?php

use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\MembershipFeeController;
use App\Http\Controllers\Api\TrainingController;
use App\Http\Controllers\Api\UnpaidFeeController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth', 'verified', 'role:admin,coach'])->group(function () {
    Route::get('/members', [MemberController::class, 'index'])->name('api.members.index');
    Route::post('/members', [MemberController::class, 'store'])->name('api.members.store');
    Route::patch('/members/{member}', [MemberController::class, 'update'])->name('api.members.update');

    Route::get('/membership-fees', [MembershipFeeController::class, 'index'])->name('api.membership-fees.index');
    Route::post('/membership-fees', [MembershipFeeController::class, 'store'])->name('api.membership-fees.store');
    Route::get('/membership-fees/by-member/{member}', [MembershipFeeController::class, 'getByMember'])->name('api.membership-fees.by-member');

    Route::get('/trainings', [TrainingController::class, 'index'])->name('api.trainings.index');
    Route::post('/trainings', [TrainingController::class, 'store'])->name('api.trainings.store');
    Route::get('/trainings/by-date', [TrainingController::class, 'getByDate'])->name('api.trainings.by-date');

    Route::get('/unpaid-fees', [UnpaidFeeController::class, 'index'])->name('api.unpaid-fees.index');
});
