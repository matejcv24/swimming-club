<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\Member;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;
use Illuminate\Validation\ValidationException;

/**
 * Admins manage the club's groups (e.g. "Big pool") and their subgroups (e.g.
 * "18:00"). Coaches can use them but not change them (see routes/web.php).
 */
class GroupController extends Controller
{
    /**
     * The Groups pop-up over the dashboard (the groups come with every page), with
     * the club's active members for each group's "N members" list.
     */
    public function index()
    {
        // Active members only: the lists show who is in a group now
        $members = Member::with('parent')
            ->where('status', 'active')
            ->orderBy('name')
            ->get()
            ->map(fn (Member $member) => [
                'id' => $member->id,
                'name' => $member->name,
                'status' => $member->status,
                'group_id' => $member->group_id,
                'subgroup_id' => $member->subgroup_id,
                'parent' => $member->parent
                    ? ['name' => $member->parent->name, 'phone' => $member->parent->phone]
                    : null,
            ]);

        return inertia('groups/index', ['members' => $members]);
    }

    public function store(Request $request): RedirectResponse
    {
        $parentId = $request->integer('parent_id') ?: null;

        $validated = $request->validate([
            // A subgroup belongs to a main group (subgroups have no subgroups)
            'parent_id' => [
                'nullable',
                Rule::exists('groups', 'id')->whereNull('deleted_at')->whereNull('parent_id'),
            ],
            'name' => ['required', 'string', 'max:60', $this->uniqueName($parentId)],
        ]);

        Group::create([
            'name' => trim($validated['name']),
            'parent_id' => $parentId,
            'position' => (int) Group::where('parent_id', $parentId)->max('position') + 1,
        ]);

        return back();
    }

    public function update(Request $request, Group $group): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:60', $this->uniqueName($group->parent_id)->ignore($group->id)],
        ]);

        $group->update(['name' => trim($validated['name'])]);

        return back();
    }

    /**
     * Delete (hide) a group or subgroup. Its members first move to another group
     * or subgroup, so nobody is left in a deleted one; past trainings, payments
     * and invoices keep showing the deleted group's name. Deleting a main group
     * also deletes its subgroups.
     */
    public function destroy(Request $request, Group $group): RedirectResponse
    {
        $removedIds = $group->isSubgroup()
            ? [$group->id]
            : [$group->id, ...$group->subgroups()->pluck('id')];

        $members = Member::query()->where(
            fn ($query) => $group->isSubgroup()
                ? $query->where('subgroup_id', $group->id)
                : $query->where('group_id', $group->id)
        );
        $hasMembers = $members->clone()->exists();

        // 'all': into all groups (no single group), so even the last group can go
        $toAllGroups = $request->input('move_to_group_id') === 'all';

        $validated = $request->validate([
            'move_to_group_id' => $toAllGroups ? ['required'] : [
                Rule::requiredIf($hasMembers),
                'nullable',
                Rule::exists('groups', 'id')->whereNull('deleted_at'),
                Rule::notIn($removedIds),
            ],
        ]);

        if ($hasMembers && empty($validated['move_to_group_id'])) {
            throw ValidationException::withMessages(['move_to_group_id' => __('Choose where its members go.')]);
        }

        DB::transaction(function () use ($validated, $hasMembers, $members, $removedIds, $toAllGroups) {
            if ($hasMembers && $toAllGroups) {
                $members->update(['group_id' => null, 'subgroup_id' => null]);
            } elseif ($hasMembers) {
                $target = Group::findOrFail($validated['move_to_group_id']);

                // Moving into a subgroup also puts them in its main group
                $members->update($target->isSubgroup()
                    ? ['group_id' => $target->parent_id, 'subgroup_id' => $target->id]
                    : ['group_id' => $target->id, 'subgroup_id' => null]);
            }

            Group::whereIn('id', $removedIds)->get()->each->delete();
        });

        return back();
    }

    /**
     * Names are unique among the groups in use, and subgroup names among their
     * group's subgroups ("18:00" may exist in several groups).
     */
    private function uniqueName(?int $parentId): Unique
    {
        return Rule::unique('groups', 'name')
            ->whereNull('deleted_at')
            ->where(fn ($query) => $parentId === null
                ? $query->whereNull('parent_id')
                : $query->where('parent_id', $parentId));
    }
}
