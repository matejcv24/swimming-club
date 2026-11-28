<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Member;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function index()
    {
        $userRole = Auth::user()->role;
        $currentMonthStart = Carbon::now()->startOfMonth();
        $currentMonthEnd = Carbon::now()->endOfMonth();

        $members = Member::visibleTo(Auth::user())
            ->where('status', 'active')
            ->select(['id', 'name', 'group_id'])
            ->withCount([
                'attendances as current_month_attendances_count' => function ($query) use ($currentMonthStart, $currentMonthEnd) {
                    $query->whereHas('training', function ($trainingQuery) use ($currentMonthStart, $currentMonthEnd) {
                        $trainingQuery->whereBetween('date', [$currentMonthStart->toDateString(), $currentMonthEnd->toDateString()]);
                    })->where('present', true);
                },
            ])
            ->orderBy('name')
            ->get();

        // A member's history is loaded when they are opened (byMember), instead of
        // sending every attendance the club ever recorded with the page
        return Inertia::render('attendance/index', [
            'userRole' => $userRole,
            'members' => $members,
        ]);
    }

    /** The training days a member came to, newest first. */
    public function byMember(Member $member)
    {
        abort_unless(Auth::user()->canSeeMember($member), 403);

        $rows = Attendance::query()
            ->join('trainings', 'trainings.id', '=', 'attendances.training_id')
            ->where('attendances.member_id', $member->id)
            ->where('attendances.present', true)
            ->orderByDesc('trainings.date')
            ->get(['attendances.id', 'trainings.date', 'trainings.group_id', 'trainings.subgroup_id'])
            // The group and time slot too, so each date says where it was
            ->map(fn ($row) => [
                'id' => $row->id,
                'date' => $row->date,
                'group_id' => $row->group_id,
                'subgroup_id' => $row->subgroup_id,
            ]);

        return response()->json(['attendances' => $rows]);
    }
}
