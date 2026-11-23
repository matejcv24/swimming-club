<?php

namespace App\Http\Controllers;

use App\Models\ClubParent;
use App\Models\Member;
use App\Models\User;
use App\Notifications\MemberChangedNotification;
use App\Support\NotificationText;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class MemberController extends Controller
{
    public function index()
    {
        $members = Member::visibleTo(Auth::user())->with('parent')->get();

        return inertia('members/index', [
            'members' => $members,
            'userRole' => Auth::user()->role,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            // Empty: the member trains in all groups
            'group_id' => [
                'nullable',
                Rule::exists('groups', 'id')->whereNull('deleted_at')->whereNull('parent_id'),
                // Coaches add and move members only within their groups
                function ($attribute, $value, $fail) {
                    if (! Auth::user()->canSeeGroup($value)) {
                        $fail(__('Choose one of your groups.'));
                    }
                },
            ],
            // Optional, and only a subgroup of the chosen group
            'subgroup_id' => [
                'nullable',
                Rule::exists('groups', 'id')->whereNull('deleted_at')->where('parent_id', (int) $request->input('group_id')),
            ],
            'status' => ['nullable', 'in:active,inactive'],
            // A parent's details are optional
            'parent_name' => ['nullable', 'string', 'max:255'],
            'parent_phone' => ['nullable', 'string', 'max:20'],
        ]);

        $parent = $this->newParent($validated);

        $member = Member::create([
            'name' => $validated['name'],
            'group_id' => $validated['group_id'] ?? null,
            // A subgroup belongs to one group, so all groups means none
            'subgroup_id' => isset($validated['group_id']) ? ($validated['subgroup_id'] ?? null) : null,
            'status' => $validated['status'] ?? 'active',
            'parent_id' => $parent?->id,
        ]);

        if (Auth::user()?->role === 'coach') {
            $admins = User::where('role', 'admin')->active()->get();

            foreach ($admins as $admin) {
                $admin->notify(new MemberChangedNotification(
                    Auth::user()->name.' added a new member '.$member->name,
                    '/members?member='.$member->id,
                    NotificationText::make(':user added a new member :member', [
                        'user' => Auth::user()->name,
                        'member' => $member->name,
                    ]),
                ));
            }
        }

        return back()->with('success', 'Member added successfully!');
    }

    public function update(Request $request, Member $member)
    {
        abort_unless(Auth::user()->canSeeMember($member), 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            // Empty: the member trains in all groups
            'group_id' => [
                'nullable',
                Rule::exists('groups', 'id')->whereNull('deleted_at')->whereNull('parent_id'),
                // Coaches add and move members only within their groups
                function ($attribute, $value, $fail) {
                    if (! Auth::user()->canSeeGroup($value)) {
                        $fail(__('Choose one of your groups.'));
                    }
                },
            ],
            // Optional, and only a subgroup of the chosen group
            'subgroup_id' => [
                'nullable',
                Rule::exists('groups', 'id')->whereNull('deleted_at')->where('parent_id', (int) $request->input('group_id')),
            ],
            'status' => ['required', 'in:active,inactive'],
            // A parent's details are optional
            'parent_name' => ['nullable', 'string', 'max:255'],
            'parent_phone' => ['nullable', 'string', 'max:20'],
        ]);

        $changes = [];

        if ($member->name !== $validated['name']) {
            $changes[] = 'name';
        }

        if ((int) $member->group_id !== (int) ($validated['group_id'] ?? 0)) {
            $changes[] = 'group';
        }

        if ((int) $member->subgroup_id !== (int) ($validated['subgroup_id'] ?? 0)) {
            $changes[] = 'subgroup';
        }

        if ($member->status !== $validated['status']) {
            $changes[] = 'status';
        }

        if (($member->parent?->name ?? '') !== ($validated['parent_name'] ?? '')) {
            $changes[] = 'parent name';
        }

        if (($member->parent?->phone ?? '') !== ($validated['parent_phone'] ?? '')) {
            $changes[] = 'parent phone';
        }

        $member->update([
            'name' => $validated['name'],
            'group_id' => $validated['group_id'] ?? null,
            // A subgroup belongs to one group, so all groups means none
            'subgroup_id' => isset($validated['group_id']) ? ($validated['subgroup_id'] ?? null) : null,
            'status' => $validated['status'],
        ]);

        if ($member->parent) {
            $member->parent->update([
                'name' => $validated['parent_name'] ?? '',
                'phone' => $validated['parent_phone'] ?? null,
            ]);
        } elseif ($parent = $this->newParent($validated)) {
            // Parent details added later
            $member->update(['parent_id' => $parent->id]);
        }

        if (Auth::user()?->role === 'coach' && count($changes) > 0) {
            $admins = User::where('role', 'admin')->active()->get();
            $changeSummary = implode(', ', $changes);

            foreach ($admins as $admin) {
                $admin->notify(new MemberChangedNotification(
                    Auth::user()->name.' updated '.$changeSummary.' for '.$member->name,
                    '/members?member='.$member->id,
                    NotificationText::make(':user updated :changes for :member', [
                        'user' => Auth::user()->name,
                        'changes' => $changes,
                        'member' => $member->name,
                    ]),
                ));
            }
        }

        return back()->with('success', 'Member updated!');
    }

    public function destroy(Member $member)
    {
        DB::transaction(function () use ($member) {
            $member->attendances()->delete();
            $member->membershipFees()->delete();

            // Remove notifications that link to this member, they would point to nothing
            DatabaseNotification::query()
                ->where('data', 'like', '%member='.$member->id.'%')
                ->get()
                ->filter(function (DatabaseNotification $notification) use ($member) {
                    parse_str((string) parse_url($notification->data['url'] ?? '', PHP_URL_QUERY), $query);

                    return (int) ($query['member'] ?? 0) === $member->id;
                })
                ->each->delete();

            $parent = $member->parent;

            $member->delete();

            if ($parent && ! $parent->members()->exists()) {
                $parent->delete();
            }
        });

        return back()->with('success', 'Member deleted!');
    }

    /**
     * A parent record for the given details, or none when both are left empty.
     *
     * @param  array<string, mixed>  $validated
     */
    private function newParent(array $validated): ?ClubParent
    {
        if (blank($validated['parent_name'] ?? null) && blank($validated['parent_phone'] ?? null)) {
            return null;
        }

        return ClubParent::create([
            'name' => $validated['parent_name'] ?? '',
            'phone' => $validated['parent_phone'] ?? null,
        ]);
    }
}
