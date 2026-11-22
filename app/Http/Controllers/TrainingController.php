<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Group;
use App\Models\Member;
use App\Models\Training;
use App\Models\User;
use App\Notifications\TrainingAttendanceNotification;
use App\Support\NotificationText;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class TrainingController extends Controller
{
    public function index()
    {
        $members = Member::visibleTo(Auth::user())
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        return inertia('trainings/index', [
            'members' => $members,
            // Only admins create, rename and delete groups
            'canManageGroups' => Auth::user()?->role === 'admin',
            // Admins and coaches of all groups get the "All" overview
            'canSeeAllGroups' => Auth::user()->visibleGroupIds() === null,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => ['required', 'date'],
            'group_id' => ['required', Rule::exists('groups', 'id')->whereNull('parent_id')],
            // Optional: a training of one subgroup (e.g. "18:00") instead of the whole group
            'subgroup_id' => ['nullable', Rule::exists('groups', 'id')->where('parent_id', (int) $request->input('group_id'))],
            // Present but may be empty: unticking everyone clears the day's attendance
            'member_ids' => ['present', 'array'],
            'member_ids.*' => ['exists:members,id'],
        ]);

        // Coaches record attendance only for their groups and their members. Members
        // already recorded on that day may stay, even if they have since moved to a
        // group the coach doesn't have (past attendance belongs to the day).
        abort_unless(Auth::user()->canSeeGroup($validated['group_id']), 403);
        $alreadyRecorded = $this->recordedOn($validated['date'], $validated['group_id'], $validated['subgroup_id'] ?? null);
        abort_if(
            Auth::user()->visibleGroupIds() !== null
                && Member::whereIn('id', $validated['member_ids'])
                    ->whereNotIn('id', $alreadyRecorded)
                    ->whereNotIn('group_id', Auth::user()->visibleGroupIds())
                    ->exists(),
            403,
        );

        // Everyone unticked: remove the day's attendance and its training record,
        // so the day shows as "No recorded members" again
        $subgroupId = $validated['subgroup_id'] ?? null;

        if (empty($validated['member_ids'])) {
            $existing = $this->trainingOn($validated['date'], $validated['group_id'], $subgroupId);

            if ($existing) {
                Attendance::where('training_id', $existing->id)->delete();
                $existing->delete();
            }
        }

        // Find or create the training session for this date and group (or subgroup)
        $training = null;

        if (! empty($validated['member_ids'])) {
            $training = $this->trainingOn($validated['date'], $validated['group_id'], $subgroupId)
                ?? Training::create([
                    'date' => $validated['date'],
                    'group_id' => $validated['group_id'],
                    'subgroup_id' => $subgroupId,
                    'coach_id' => Auth::id(),
                ]);
        }

        if ($training) {
            // Delete existing attendance for this training
            Attendance::where('training_id', $training->id)->delete();
        }

        // Re-create attendance records
        foreach ($validated['member_ids'] as $memberId) {
            Attendance::create([
                'training_id' => $training->id,
                'member_id' => $memberId,
                'present' => true,
            ]);
        }

        if (Auth::user()?->role === 'coach') {
            $admins = User::where('role', 'admin')->active()->get();
            $formattedDate = Carbon::parse($validated['date'])->format('d.m.Y');
            $groupName = Group::withTrashed()->find($validated['group_id'])?->name ?? 'group';

            if ($subgroupId) {
                $groupName .= ' · '.Group::withTrashed()->find($subgroupId)?->name;
            }

            foreach ($admins as $admin) {
                $admin->notify(new TrainingAttendanceNotification(
                    Auth::user()->name.' updated training attendance for '.$formattedDate.' ('.$groupName.')',
                    '/trainings?date='.$validated['date'].'&group='.$validated['group_id']
                        .($subgroupId ? '&subgroup='.$subgroupId : '').'&attendance=1',
                    NotificationText::make(':user updated training attendance for :date (:group)', [
                        'user' => Auth::user()->name,
                        'date' => $formattedDate,
                        'group' => $groupName,
                    ]),
                ));
            }
        }

        return back()->with('success', 'Attendance saved!');
    }

    public function getByDate(Request $request)
    {
        $validated = $request->validate([
            'date' => ['required', 'date'],
            // Without a group, the overview of every group ("All")
            'group_id' => [Rule::requiredIf(! $request->boolean('summary')), 'nullable', 'integer'],
            'subgroup_id' => ['nullable', 'integer'],
            'summary' => ['nullable', 'boolean'],
        ]);

        $groupId = isset($validated['group_id']) ? (int) $validated['group_id'] : null;

        // "All" is only for those who see every group
        abort_unless(
            $groupId === null ? Auth::user()->visibleGroupIds() === null : Auth::user()->canSeeGroup($groupId),
            403,
        );

        if ($request->boolean('summary')) {
            return response()->json(['sections' => $this->daySummary($validated['date'], $groupId)]);
        }

        $training = $this->trainingOn($validated['date'], $validated['group_id'], $validated['subgroup_id'] ?? null);

        if (! $training) {
            return response()->json(['member_ids' => [], 'attended' => []]);
        }

        // Who came that day, as recorded: also members who have since moved to
        // another group or stopped training, so a past day never loses anyone
        $attended = Member::whereIn('id', Attendance::where('training_id', $training->id)->select('member_id'))
            ->orderBy('name')
            ->get(['id', 'name', 'group_id', 'subgroup_id']);

        return response()->json([
            'member_ids' => $attended->pluck('id'),
            'attended' => $attended,
        ]);
    }

    /**
     * The days of a month with recorded attendance, for the calendar's dots: of
     * one subgroup, of a whole group (any of its subgroups too) or, without a
     * group, of every group.
     */
    public function recordedDays(Request $request)
    {
        $validated = $request->validate([
            'month' => ['required', 'date_format:Y-m'],
            'group_id' => ['nullable', 'integer'],
            'subgroup_id' => ['nullable', 'integer'],
        ]);

        $groupId = isset($validated['group_id']) ? (int) $validated['group_id'] : null;

        abort_unless(
            $groupId === null ? Auth::user()->visibleGroupIds() === null : Auth::user()->canSeeGroup($groupId),
            403,
        );

        $month = Carbon::createFromFormat('Y-m', $validated['month'])->startOfMonth();

        $days = Training::whereBetween('date', [$month->toDateString(), $month->copy()->endOfMonth()->toDateString()])
            ->whereNotNull('group_id')
            ->when($groupId !== null, fn ($query) => $query->where('group_id', $groupId))
            ->when($validated['subgroup_id'] ?? null, fn ($query, $subgroupId) => $query->where('subgroup_id', $subgroupId))
            ->whereHas('attendances')
            ->distinct()
            ->pluck('date')
            ->map(fn ($date) => Carbon::parse($date)->toDateString())
            ->unique()
            ->values();

        return response()->json(['days' => $days]);
    }

    /**
     * The members recorded on a group's (or subgroup's) training on a day.
     *
     * @return list<int>
     */
    private function recordedOn(string $date, int|string $groupId, int|string|null $subgroupId): array
    {
        $training = $this->trainingOn($date, $groupId, $subgroupId);

        return $training
            ? Attendance::where('training_id', $training->id)->pluck('member_id')->all()
            : [];
    }

    /**
     * Who came to a group's trainings on a day (or to every group's, without a
     * group): one section per group and subgroup, in their order, each group's
     * whole-group training after its subgroups.
     *
     * @return list<array{subgroup_id: int|null, name: string|null, members: list<array<string, mixed>>}>
     */
    private function daySummary(string $date, ?int $groupId): array
    {
        return Training::whereDate('date', $date)
            ->when($groupId !== null, fn ($query) => $query->where('group_id', $groupId))
            ->whereNotNull('group_id')
            ->with(['group', 'subgroup', 'attendances.member.parent'])
            ->get()
            ->sortBy(fn (Training $training) => [
                $training->group?->position ?? PHP_INT_MAX,
                $training->group_id,
                $training->subgroup ? 0 : 1,
                $training->subgroup?->position ?? 0,
                $training->subgroup_id ?? 0,
            ])
            ->map(fn (Training $training) => [
                'group_id' => $training->group_id,
                'group_name' => $training->group?->name,
                'subgroup_id' => $training->subgroup_id,
                'name' => $training->subgroup?->name,
                'members' => $training->attendances
                    ->filter(fn ($attendance) => $attendance->member)
                    // Everything the Member Details pop-up shows
                    ->map(fn ($attendance) => [
                        'id' => $attendance->member->id,
                        'name' => $attendance->member->name,
                        'status' => $attendance->member->status,
                        'group_id' => $attendance->member->group_id,
                        'subgroup_id' => $attendance->member->subgroup_id,
                        'parent' => $attendance->member->parent
                            ? ['name' => $attendance->member->parent->name, 'phone' => $attendance->member->parent->phone]
                            : null,
                    ])
                    ->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)
                    ->values()
                    ->all(),
            ])
            ->filter(fn (array $section) => $section['members'] !== [])
            ->values()
            ->all();
    }

    /** The training of a group (or one of its subgroups) on a day, if recorded. */
    private function trainingOn(string $date, int|string $groupId, int|string|null $subgroupId): ?Training
    {
        return Training::whereDate('date', $date)
            ->where('group_id', $groupId)
            ->when(
                $subgroupId,
                fn ($query) => $query->where('subgroup_id', $subgroupId),
                fn ($query) => $query->whereNull('subgroup_id'),
            )
            ->first();
    }
}
