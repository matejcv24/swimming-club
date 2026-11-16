<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StaffController extends Controller
{
    public function index()
    {
        $staff = User::where('role', 'coach')
            ->with('coachGroups:id')
            ->orderBy('name')
            ->get()
            ->map(fn (User $coach) => [
                'id' => $coach->id,
                'name' => $coach->name,
                'email' => $coach->email,
                'all_groups' => $coach->all_groups,
                'group_ids' => $coach->coachGroups->pluck('id')->values(),
            ]);

        return inertia('staff/index', [
            'staff' => $staff,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            ...$this->groupRules(),
        ]);

        $coach = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => 'coach',
            'all_groups' => (bool) $validated['all_groups'],
        ]);

        $this->assignGroups($coach, $validated);

        $coach->forceFill(['email_verified_at' => now()])->save();

        return back()->with('success', 'Coach created successfully!');
    }

    public function update(Request $request, User $coach)
    {
        abort_unless($coach->role === 'coach', 404);

        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', Rule::unique('users', 'email')->ignore($coach->id)],
            'password' => ['nullable', 'string', 'min:8'],
            ...$this->groupRules(),
        ]);

        $coach->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'all_groups' => (bool) $validated['all_groups'],
        ]);

        if (!empty($validated['password'])) {
            $coach->password = $validated['password'];
            $coach->setRememberToken(Str::random(60));

            // Log the coach out everywhere so the old password stops working immediately
            if (config('session.driver') === 'database') {
                DB::table(config('session.table', 'sessions'))->where('user_id', $coach->id)->delete();
            }
        }

        $coach->save();
        $this->assignGroups($coach, $validated);

        return back()->with('success', 'Coach updated successfully!');
    }

    /**
     * A coach works with all groups, or with at least one chosen main group.
     *
     * @return array<string, array<int, mixed>>
     */
    private function groupRules(): array
    {
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
    private function assignGroups(User $coach, array $validated): void
    {
        $coach->coachGroups()->sync($validated['all_groups'] ? [] : $validated['group_ids']);
    }
}
