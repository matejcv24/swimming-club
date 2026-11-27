<?php

namespace App\Http\Controllers;

use App\Mail\StaffInvitationMail;
use App\Models\Club;
use App\Models\Group;
use App\Models\Invitation;
use App\Models\User;
use App\Notifications\StaffJoinedNotification;
use App\Support\CurrentClub;
use App\Support\NotificationText;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Staff join by invitation: an admin enters name, email, role (and a coach's
 * groups), the person gets a link by email (or the admin copies it and sends it
 * by Viber), and sets their own password there.
 */
class StaffInvitationController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            // Someone removed from the team, or working in another club, can be invited
            'email' => ['required', 'email', 'max:255', function ($attribute, $value, $fail) {
                if ($this->memberOfThisClub(mb_strtolower(trim((string) $value)))) {
                    $fail(__('This email already has an account.'));
                }
            }],
            'role' => ['required', Rule::in(StaffController::ROLES)],
            ...StaffController::groupRules($request->input('role') === 'coach'),
        ]);

        $email = mb_strtolower(trim($validated['email']));

        $invitation = DB::transaction(function () use ($validated, $email) {
            // Inviting the same email again replaces the earlier invitation
            Invitation::pending()->where('email', $email)->delete();

            $invitation = new Invitation([
                'name' => trim($validated['name']),
                'email' => $email,
                'role' => $validated['role'],
                // Admins see every group anyway
                'all_groups' => $validated['role'] === 'admin' || (bool) ($validated['all_groups'] ?? false),
                'group_ids' => $validated['role'] === 'coach' && ! ($validated['all_groups'] ?? false)
                    ? array_values(array_map('intval', $validated['group_ids']))
                    : [],
                'invited_by' => Auth::id(),
            ]);
            $invitation->renew();
            $invitation->save();

            return $invitation;
        });

        $sent = $this->send($invitation);

        return back()->with('success', $sent ? 'Invitation sent!' : 'The email could not be sent. Copy the link and send it yourself.');
    }

    /** Sends the email again; an expired link works for another few days. */
    public function resend(Invitation $invitation)
    {
        abort_if($invitation->accepted_at !== null, 404);

        $invitation->extend();
        $invitation->save();

        $sent = $this->send($invitation);

        return back()->with('success', $sent ? 'Invitation sent again!' : 'The email could not be sent. Copy the link and send it yourself.');
    }

    public function destroy(Invitation $invitation)
    {
        abort_if($invitation->accepted_at !== null, 404);

        $invitation->delete();

        return back()->with('success', 'Invitation cancelled.');
    }

    /** The page the link opens: who is invited, and the password fields. */
    public function show(Request $request, string $token)
    {
        $invitation = Invitation::findUsable($token);

        if (! $invitation) {
            return inertia('auth/accept-invitation', ['invitation' => null, 'token' => null]);
        }

        // The page is the inviting club's (its name and logo)
        return CurrentClub::runFor($invitation->club, fn () => $this->page($invitation, $token)->toResponse($request));
    }

    private function page(Invitation $invitation, string $token)
    {
        return inertia('auth/accept-invitation', [
            'invitation' => [
                'name' => $invitation->name,
                'email' => $invitation->email,
                'role' => $invitation->role,
                'club' => Club::current()->name,
                'existing_account' => User::where('email', $invitation->email)->exists(),
            ],
            'token' => $token,
        ]);
    }

    /** The invited person sets their password: their account is made and they are in. */
    public function accept(Request $request, string $token)
    {
        $invitation = Invitation::findUsable($token);

        if (! $invitation) {
            return redirect('/invitation/'.$token);
        }

        // Everything happens in the inviting club; afterwards they work in it
        $response = CurrentClub::runFor($invitation->club, fn () => $this->acceptFor($request, $invitation));
        $request->session()->put(CurrentClub::SESSION_KEY, $invitation->club_id);
        CurrentClub::forget();

        return $response;
    }

    private function acceptFor(Request $request, Invitation $invitation)
    {
        if ($this->memberOfThisClub($invitation->email)) {
            throw ValidationException::withMessages(['password' => __('This email already has an account. Log in instead.')]);
        }

        // Someone working in another club joins with the password they already have
        $existing = User::where('email', $invitation->email)->first();

        if ($existing) {
            $request->validate(['password' => ['required', 'string']]);

            if (! $existing->password || ! Hash::check($request->input('password'), $existing->password)) {
                throw ValidationException::withMessages(['password' => __('The password is incorrect.')]);
            }
        } else {
            $request->validate(['password' => ['required', 'confirmed', Password::defaults()]]);
        }

        $user = DB::transaction(function () use ($invitation, $request, $existing) {
            $membership = [
                'role' => $invitation->role,
                'all_groups' => $invitation->all_groups,
                'deactivated_at' => null,
            ];

            if ($existing) {
                $user = $existing->forceFill($membership);
            } else {
                $details = [
                    'name' => $invitation->name,
                    'email' => $invitation->email,
                    'password' => $request->input('password'),
                ];

                // Someone whose account was deleted earlier comes back to the same
                // account, so their old trainings and salaries are theirs again
                $user = User::onlyTrashed()->where('email', $invitation->email)->first();

                if ($user) {
                    $user->restore();
                    $user->fill($details);
                } else {
                    $user = new User($details);
                }

                $user->forceFill([...$membership, 'email_verified_at' => now()]);
            }

            $user->save();

            // Only groups that still exist
            if ($user->role === 'coach' && ! $user->all_groups) {
                $user->coachGroups()->sync(
                    Group::whereIn('id', $invitation->group_ids ?? [])->whereNull('parent_id')->pluck('id'),
                );
            }

            $invitation->forceFill(['accepted_at' => now()])->save();

            return $user;
        });

        $this->notifyJoined($invitation, $user);

        Auth::login($user);
        $request->session()->regenerate();

        return redirect('/dashboard');
    }

    /**
     * Tells the admin who sent the invitation and the club's owner (once, if
     * that's the same person) that the new person is on the team.
     */
    private function notifyJoined(Invitation $invitation, User $user): void
    {
        $recipients = User::active()
            ->whereKey(array_filter([$invitation->invited_by, Club::current()->owner_id]))
            ->whereKeyNot($user->id)
            ->get();

        $text = NotificationText::make(':name accepted the invitation and joined the team as :role.', [
            'name' => $user->name,
            'role' => $user->role,
        ]);

        foreach ($recipients as $recipient) {
            $recipient->notify(new StaffJoinedNotification(
                "{$user->name} accepted the invitation and joined the team as {$user->role}.",
                '/staff',
                $text,
            ));
        }
    }

    /** Already on this club's team (removed people and other clubs' people are not). */
    private function memberOfThisClub(string $email): bool
    {
        return User::where('email', $email)->inCurrentClub()->exists();
    }

    /** True when the email went out; on failure the admin copies the link instead. */
    private function send(Invitation $invitation): bool
    {
        try {
            Mail::to($invitation->email)->send(
                new StaffInvitationMail($invitation, Club::current(), Auth::user()?->name ?? Club::current()->name),
            );

            $invitation->forceFill(['email_sent_at' => now(), 'email_failed_at' => null])->save();

            return true;
        } catch (Throwable $e) {
            report($e);
            $invitation->forceFill(['email_failed_at' => now()])->save();

            return false;
        }
    }
}
