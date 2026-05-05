<?php

use App\Http\Controllers\Api\MemberController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth', 'verified', 'role:admin,coach'])->group(function () {
    Route::post('/members', [MemberController::class, 'store'])->name('api.members.store');
    Route::patch('/members/{member}', [MemberController::class, 'update'])->name('api.members.update');
});
