<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\User;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Account settings: everyone changes their name, email and password here;
 * admins also choose which notifications they get. Nobody deletes their own
 * account (admins remove deactivated staff on the team page; the data stays).
 */
class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            // Admins only: each kind of notification, on or off
            'notificationSettings' => $user->role === 'admin'
                ? collect(User::ADMIN_NOTIFICATIONS)->mapWithKeys(fn (string $type) => [$type => $user->wantsNotification($type)])
                : null,
        ]);
    }

    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return to_route('profile.edit');
    }

    /** An admin turns kinds of notifications on or off (bell and push together). */
    public function updateNotifications(Request $request): RedirectResponse
    {
        abort_unless($request->user()->role === 'admin', 403);

        $validated = $request->validate(
            collect(User::ADMIN_NOTIFICATIONS)->mapWithKeys(fn (string $type) => [$type => ['required', 'boolean']])->all(),
        );

        $request->user()->forceFill([
            'notification_settings' => collect($validated)->map(fn ($on) => (bool) $on)->all(),
        ])->save();

        return back();
    }
}
