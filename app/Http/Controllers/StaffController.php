<?php

namespace App\Http\Controllers;

use App\Models\Club;
use App\Models\Invitation;
use App\Models\Salary;
use App\Models\User;
use App\Support\ClubRule;
use App\Support\CurrentClub;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StaffController extends Controller
{
    public const ROLES = ['admin', 'coach'];

    public function index()
    {
        $ownerId = Club::current()->owner_id;

        // The months each person has a salary for (YYYY-MM)
        $salaryMonths = Salary::get(['user_id', 'month'])
            ->groupBy('user_id')
            ->map(fn ($salaries) => $salaries->map(fn (Salary $salary) => $salary->month->format('Y-m'))->unique()->values());
        $thisMonth = now()->format('Y-m');

        // The club's staff: active first, then deactivated; each by name
        $staff = User::query()
            ->select('users.*')
            ->join('club_user', fn ($join) => $join
                ->on('club_user.user_id', '=', 'users.id')
                ->where('club_user.club_id', CurrentClub::id())
                ->whereNull('club_user.deleted_at'))
            ->whereIn('club_user.role', self::ROLES)
            ->with('coachGroups:id')
            ->orderByRaw('club_user.deactivated_at is not null')
            ->orderBy('users.name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'active' => $user->isActive(),
                'deactivated_at' => $user->deactivated_at?->toDateString(),
                'is_self' => $user->is(Auth::user()),
                'is_owner' => $user->id === $ownerId,
                'all_groups' => $user->all_groups,
                'group_ids' => $user->coachGroups->pluck('id')->values(),
                'salary_this_month' => $salaryMonths->get($user->id)?->contains($thisMonth) ?? false,
                'salary_months' => $salaryMonths->get($user->id) ?? [],
            ]);

        // Invitations not accepted yet, newest first
        $invitations = Invitation::pending()->latest()->get()->map(fn (Invitation $invitation) => [
            'id' => $invitation->id,
            'name' => $invitation->name,
            'email' => $invitation->email,
            'role' => $invitation->role,
            'all_groups' => $invitation->all_groups,
            'group_ids' => $invitation->group_ids ?? [],
            'invited_at' => $invitation->created_at?->toIso8601String(),
            'expired' => $invitation->isExpired(),
            'email_failed' => $invitation->email_failed_at !== null,
            'link' => $invitation->link(),
        ]);

        return inertia('staff/index', [
            'staff' => $staff,
            'invitations' => $invitations,
        ]);
    }

    public function update(Request $request, User $coach)
    {
        abort_unless(in_array($coach->role, self::ROLES, true), 404);
        // Only the owner changes the owner's details
        abort_if($coach->isOwner() && ! $coach->is(Auth::user()), 403);

        $isCoach = $coach->role === 'coach';

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($coach->id)],
            'password' => ['nullable', 'string', 'min:8'],
            ...self::groupRules($isCoach),
        ]);

        $coach->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'all_groups' => ! $isCoach || (bool) $validated['all_groups'],
        ]);

        if (! empty($validated['password'])) {
            $coach->password = $validated['password'];
            // A new password logs them out everywhere, so the old one stops working
            $this->logOutEverywhere($coach);
        }

        $coach->save();
        $this->assignGroups($coach, $validated);

        return back()->with('success', 'Staff member updated successfully!');
    }

    /**
     * Deactivate a staff account (it can no longer log in, and is logged out
     * everywhere) or activate it again. Nobody can deactivate themselves or the
     * club's owner.
     */
    public function setActive(Request $request, User $coach)
    {
        abort_unless(in_array($coach->role, self::ROLES, true), 404);
        abort_if($coach->is(Auth::user()) || $coach->isOwner(), 403);

        $validated = $request->validate(['active' => ['required', 'boolean']]);

        $coach->deactivated_at = $validated['active'] ? null : now();

        if (! $validated['active']) {
            $this->logOutEverywhere($coach);
        }

        $coach->save();

        return back()->with('success', $validated['active'] ? 'Account activated.' : 'Account deactivated.');
    }

    /**
     * Removes a deactivated person from the team list. Only the account is
     * hidden: the row stays in the database, so their trainings, attendance and
     * salaries (and with them the club's finances) stay exactly as they are.
     */
    public function destroy(User $coach)
    {
        abort_unless(in_array($coach->role, self::ROLES, true), 404);
        abort_if($coach->is(Auth::user()) || $coach->isOwner(), 403);
        // Only someone already deactivated
        abort_if($coach->isActive(), 422, __('Deactivate the account first.'));

        $this->logOutEverywhere($coach);
        $coach->save();
        $coach->leaveCurrentClub();

        // No other club left: the account itself is hidden too (never removed)
        if (! $coach->memberships()->exists()) {
            $coach->pushSubscriptions()->delete();
            $coach->delete();
        }

        return back()->with('success', 'Account deleted.');
    }

    private function logOutEverywhere(User $user): void
    {
        $user->setRememberToken(Str::random(60));

        if (config('session.driver') === 'database') {
            DB::table(config('session.table', 'sessions'))->where('user_id', $user->id)->delete();
        }
    }

    /**
     * A coach works with all groups, or with at least one chosen main group.
     * Admins have no groups to choose.
     *
     * @return array<string, array<int, mixed>>
     */
    public static function groupRules(bool $isCoach): array
    {
        if (! $isCoach) {
            return [];
        }

        return [
            'all_groups' => ['required', 'boolean'],
            'group_ids' => ['exclude_if:all_groups,true', 'required', 'array', 'min:1'],
            'group_ids.*' => [
                'integer',
                ClubRule::exists('groups')->whereNull('deleted_at')->whereNull('parent_id'),
            ],
        ];
    }

    /** @param  array<string, mixed>  $validated */
    private function assignGroups(User $user, array $validated): void
    {
        $user->coachGroups()->sync(
            $user->role === 'coach' && ! ($validated['all_groups'] ?? true) ? $validated['group_ids'] : [],
        );
    }
}
