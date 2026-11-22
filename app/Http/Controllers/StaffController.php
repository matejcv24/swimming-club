<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StaffController extends Controller
{
    private const ROLES = ['admin', 'coach'];

    public function index()
    {
        // Active staff first, then deactivated; each by name
        $staff = User::whereIn('role', self::ROLES)
            ->with('coachGroups:id')
            ->orderByRaw('deactivated_at is not null')
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'active' => $user->isActive(),
                'deactivated_at' => $user->deactivated_at?->toDateString(),
                'is_self' => $user->is(Auth::user()),
                'all_groups' => $user->all_groups,
                'group_ids' => $user->coachGroups->pluck('id')->values(),
            ]);

        return inertia('staff/index', [
            'staff' => $staff,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(self::ROLES)],
            ...$this->groupRules($request->input('role') === 'coach'),
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => $validated['role'],
            // Admins see every group anyway
            'all_groups' => $validated['role'] === 'admin' || (bool) $validated['all_groups'],
        ]);

        $this->assignGroups($user, $validated);

        $user->forceFill(['email_verified_at' => now()])->save();

        return back()->with('success', 'Staff member created successfully!');
    }

    public function update(Request $request, User $coach)
    {
        abort_unless(in_array($coach->role, self::ROLES, true), 404);

        $isCoach = $coach->role === 'coach';

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($coach->id)],
            'password' => ['nullable', 'string', 'min:8'],
            ...$this->groupRules($isCoach),
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
     * everywhere) or activate it again. Nobody can deactivate themselves.
     */
    public function setActive(Request $request, User $coach)
    {
        abort_unless(in_array($coach->role, self::ROLES, true), 404);
        abort_if($coach->is(Auth::user()), 403);

        $validated = $request->validate(['active' => ['required', 'boolean']]);

        $coach->deactivated_at = $validated['active'] ? null : now();

        if (! $validated['active']) {
            $this->logOutEverywhere($coach);
        }

        $coach->save();

        return back()->with('success', $validated['active'] ? 'Account activated.' : 'Account deactivated.');
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
    private function groupRules(bool $isCoach): array
    {
        if (! $isCoach) {
            return [];
        }

        return [
            'all_groups' => ['required', 'boolean'],
            'group_ids' => ['exclude_if:all_groups,true', 'required', 'array', 'min:1'],
            'group_ids.*' => [
                'integer',
                Rule::exists('groups', 'id')->whereNull('deleted_at')->whereNull('parent_id'),
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
