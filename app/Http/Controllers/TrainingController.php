<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Member;
use App\Models\Training;
use App\Models\User;
use App\Notifications\TrainingAttendanceNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TrainingController extends Controller
{
    public function index()
    {
        $members = Member::where('status', 'active')
            ->orderBy('name')
            ->get();

        return inertia('trainings/index', [
            'members' => $members,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date'         => ['required', 'date'],
            'pool'         => ['required', 'in:big,small'],
            'member_ids'   => ['required', 'array'],
            'member_ids.*' => ['exists:members,id'],
        ]);

        // Find or create training session for this date and pool
        $training = Training::firstOrCreate(
            [
                'date' => $validated['date'],
                'pool' => $validated['pool'],
            ],
            [
                'coach_id' => Auth::id(),
            ]
        );

        // Delete existing attendance for this training
        Attendance::where('training_id', $training->id)->delete();

        // Re-create attendance records
        foreach ($validated['member_ids'] as $memberId) {
            Attendance::create([
                'training_id' => $training->id,
                'member_id'   => $memberId,
                'present'     => true,
            ]);
        }

        if (Auth::user()?->role === 'coach') {
            $admins = User::where('role', 'admin')->get();
            $formattedDate = \Carbon\Carbon::parse($validated['date'])->format('d.m.Y');
            $poolLabel = $validated['pool'] === 'big' ? 'Big Pool' : 'Small Pool';

            foreach ($admins as $admin) {
                $admin->notify(new TrainingAttendanceNotification(
                    Auth::user()->name . ' updated training attendance for ' . $formattedDate . ' (' . $poolLabel . ')',
                    '/trainings?date=' . $validated['date'] . '&pool=' . $validated['pool'] . '&attendance=1'
                ));
            }
        }

        return back()->with('success', 'Attendance saved!');
    }

    public function getByDate(Request $request)
    {
        $validated = $request->validate([
            'date' => ['required', 'date'],
            'pool' => ['required', 'in:big,small'],
        ]);

        $training = Training::where('date', $validated['date'])
            ->where('pool', $validated['pool'])
            ->first();

        if (!$training) {
            return response()->json(['member_ids' => []]);
        }

        $memberIds = Attendance::where('training_id', $training->id)
            ->pluck('member_id');

        return response()->json(['member_ids' => $memberIds]);
    }
}
