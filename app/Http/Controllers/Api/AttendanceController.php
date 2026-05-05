<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Member;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class AttendanceController extends Controller
{
    public function index(): JsonResponse
    {
        $currentMonthStart = Carbon::now()->startOfMonth();
        $currentMonthEnd = Carbon::now()->endOfMonth();

        $members = Member::where('status', 'active')
            ->withCount([
                'attendances as current_month_attendances_count' => function ($query) use ($currentMonthStart, $currentMonthEnd) {
                    $query->whereHas('training', function ($trainingQuery) use ($currentMonthStart, $currentMonthEnd) {
                        $trainingQuery->whereBetween('date', [$currentMonthStart->toDateString(), $currentMonthEnd->toDateString()]);
                    })->where('present', true);
                },
            ])
            ->orderBy('name')
            ->get();

        $attendanceRows = Attendance::with(['member', 'training'])
            ->where('present', true)
            ->whereHas('member', function ($query) {
                $query->where('status', 'active');
            })
            ->get()
            ->map(function ($attendance) {
                return [
                    'id' => $attendance->id,
                    'member_id' => $attendance->member_id,
                    'member_name' => $attendance->member?->name,
                    'pool' => $attendance->member?->pool,
                    'date' => $attendance->training?->date,
                ];
            })
            ->filter(fn ($row) => $row['member_id'] && $row['date'])
            ->values();

        return response()->json([
            'members' => $members,
            'attendanceRows' => $attendanceRows,
        ]);
    }
}
