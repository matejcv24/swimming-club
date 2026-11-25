<?php

use App\Http\Controllers\Settings\AppearanceController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Support\Facades\Route;

// Account settings: one page (name, email, password; admins also notifications)
Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    // Light / dark is saved from the switch in the top bar or the avatar menu
    Route::patch('settings/appearance', [AppearanceController::class, 'update'])->name('appearance.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::patch('settings/notifications', [ProfileController::class, 'updateNotifications'])
        ->name('notification-settings.update');

    // The old separate pages now live on the one account settings page
    Route::get('settings/security', fn () => redirect('/settings/profile'))->name('security.edit');
    Route::get('settings/appearance', fn () => redirect('/settings/profile'))->name('appearance.edit');
});
