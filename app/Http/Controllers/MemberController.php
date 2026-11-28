<?php

namespace App\Http\Controllers;

use App\Models\ClubParent;
use App\Models\Member;
use App\Models\User;
use App\Notifications\MemberChangedNotification;
use App\Support\ClubRule;
use App\Support\DuplicateMembers;
use App\Support\NotificationText;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class MemberController extends Controller
{
    public function index()
    {
        // The latest fee's end date says whether this month is paid (the list's pill)
        $members = Member::visibleTo(Auth::user())
            ->with('parent')
            ->withMax('membershipFees', 'end_date')
            ->get();

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
                ClubRule::exists('groups')->whereNull('deleted_at')->whereNull('parent_id'),
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
                ClubRule::exists('groups')->whereNull('deleted_at')->where('parent_id', (int) $request->input('group_id')),
            ],
            'status' => ['nullable', 'in:active,inactive'],
            // The member's own contact details and a parent's are all optional
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'parent_name' => ['nullable', 'string', 'max:255'],
            'parent_phone' => ['nullable', 'string', 'max:20'],
            'parent_email' => ['nullable', 'email', 'max:255'],
            // Saving although the same member seems to exist already (asked twice)
            'confirm_duplicate' => ['sometimes', 'boolean'],
        ]);

        $this->refuseDuplicate($request, $validated);

        $parent = $this->newParent($validated);

        $member = Member::create([
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'group_id' => $validated['group_id'] ?? null,
            // A subgroup belongs to one group, so all groups means none
            'subgroup_id' => isset($validated['group_id']) ? ($validated['subgroup_id'] ?? null) : null,
            'status' => $validated['status'] ?? 'active',
            'parent_id' => $parent?->id,
        ]);

        if (Auth::user()?->role === 'coach') {
            $admins = User::inCurrentClub('admin')->active()->get();

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
                ClubRule::exists('groups')->whereNull('deleted_at')->whereNull('parent_id'),
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
                ClubRule::exists('groups')->whereNull('deleted_at')->where('parent_id', (int) $request->input('group_id')),
            ],
            'status' => ['required', 'in:active,inactive'],
            // The member's own contact details and a parent's are all optional
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'parent_name' => ['nullable', 'string', 'max:255'],
            'parent_phone' => ['nullable', 'string', 'max:20'],
            'parent_email' => ['nullable', 'email', 'max:255'],
            // Saving although the same member seems to exist already (asked twice)
            'confirm_duplicate' => ['sometimes', 'boolean'],
        ]);

        // Only a changed name or contact can make it match another member
        $identityChanged = $member->name !== $validated['name']
            || ($member->phone ?? '') !== ($validated['phone'] ?? '')
            || ($member->email ?? '') !== ($validated['email'] ?? '')
            || ($member->parent?->phone ?? '') !== ($validated['parent_phone'] ?? '')
            || ($member->parent?->email ?? '') !== ($validated['parent_email'] ?? '');

        if ($identityChanged) {
            $this->refuseDuplicate($request, $validated, $member);
        }

        $changes = [];

        if ($member->name !== $validated['name']) {
            $changes[] = 'name';
        }

        if (($member->phone ?? '') !== ($validated['phone'] ?? '')) {
            $changes[] = 'phone';
        }

        if (($member->email ?? '') !== ($validated['email'] ?? '')) {
            $changes[] = 'email';
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

        if (($member->parent?->email ?? '') !== ($validated['parent_email'] ?? '')) {
            $changes[] = 'parent email';
        }

        $member->update([
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'group_id' => $validated['group_id'] ?? null,
            // A subgroup belongs to one group, so all groups means none
            'subgroup_id' => isset($validated['group_id']) ? ($validated['subgroup_id'] ?? null) : null,
            'status' => $validated['status'],
        ]);

        if ($member->parent) {
            $member->parent->update([
                'name' => $validated['parent_name'] ?? '',
                'phone' => $validated['parent_phone'] ?? null,
                'email' => $validated['parent_email'] ?? null,
            ]);
        } elseif ($parent = $this->newParent($validated)) {
            // Parent details added later
            $member->update(['parent_id' => $parent->id]);
        }

        if (Auth::user()?->role === 'coach' && count($changes) > 0) {
            $admins = User::inCurrentClub('admin')->active()->get();
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

    /**
     * Removes a member from the lists. Only the member is hidden: their payments,
     * attendance, parent and notifications stay exactly as they are, so the
     * club's profit, reports and totals don't change.
     */
    public function destroy(Member $member)
    {
        $member->delete();

        return back()->with('success', 'Member deleted!');
    }

    /** Brings a deleted member back, with all of their history (from the duplicate warning). */
    public function restore(int $member)
    {
        $found = Member::onlyTrashed()->findOrFail($member);
        abort_unless(Auth::user()->canSeeMember($found), 403);

        $found->restore();

        return back()->with('success', 'Member restored.');
    }

    /**
     * Stops the save when the member almost certainly exists already (same name
     * and the same phone or email, own or parent's), unless the person confirmed
     * twice that it's a different member. The matches go back to the form.
     *
     * @param  array<string, mixed>  $validated
     */
    private function refuseDuplicate(Request $request, array $validated, ?Member $member = null): void
    {
        if ($request->boolean('confirm_duplicate')) {
            return;
        }

        $matches = DuplicateMembers::find($validated, $member?->id);

        if ($matches->isNotEmpty()) {
            throw ValidationException::withMessages([
                'duplicate' => json_encode(DuplicateMembers::forWarning($matches, Auth::user()), JSON_UNESCAPED_UNICODE),
            ]);
        }
    }

    /**
     * A parent record for the given details, or none when both are left empty.
     *
     * @param  array<string, mixed>  $validated
     */
    private function newParent(array $validated): ?ClubParent
    {
        if (blank($validated['parent_name'] ?? null) && blank($validated['parent_phone'] ?? null) && blank($validated['parent_email'] ?? null)) {
            return null;
        }

        return ClubParent::create([
            'name' => $validated['parent_name'] ?? '',
            'phone' => $validated['parent_phone'] ?? null,
            'email' => $validated['parent_email'] ?? null,
        ]);
    }
}
