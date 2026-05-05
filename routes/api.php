<?php

use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\MembershipFeeController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth', 'verified', 'role:admin,coach'])->group(function () {
    Route::get('/members', [MemberController::class, 'index'])->name('api.members.index');
    Route::post('/members', [MemberController::class, 'store'])->name('api.members.store');
    Route::patch('/members/{member}', [MemberController::class, 'update'])->name('api.members.update');

    Route::get('/membership-fees', [MembershipFeeController::class, 'index'])->name('api.membership-fees.index');
    Route::post('/membership-fees', [MembershipFeeController::class, 'store'])->name('api.membership-fees.store');
    Route::get('/membership-fees/by-member/{member}', [MembershipFeeController::class, 'getByMember'])->name('api.membership-fees.by-member');
});
