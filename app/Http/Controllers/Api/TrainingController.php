<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Member;
use App\Models\Training;
use App\Models\User;
use App\Notifications\TrainingAttendanceNotification;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrainingController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'members' => Member::where('status', 'active')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date'],
            'pool' => ['required', 'in:big,small'],
            'member_ids' => ['required', 'array'],
            'member_ids.*' => ['exists:members,id'],
        ]);

        $training = Training::firstOrCreate(
            [
                'date' => $validated['date'],
                'pool' => $validated['pool'],
            ],
            [
                'coach_id' => $request->user()?->id,
            ]
        );

        Attendance::where('training_id', $training->id)->delete();

        foreach ($validated['member_ids'] as $memberId) {
            Attendance::create([
                'training_id' => $training->id,
                'member_id' => $memberId,
                'present' => true,
            ]);
        }

        $actor = $request->user();

        if ($actor?->role === 'coach') {
            $admins = User::where('role', 'admin')->get();
            $formattedDate = Carbon::parse($validated['date'])->format('d.m.Y');
            $poolLabel = $validated['pool'] === 'big' ? 'Big Pool' : 'Small Pool';

            foreach ($admins as $admin) {
                $admin->notify(new TrainingAttendanceNotification(
                    $actor->name.' updated training attendance for '.$formattedDate.' ('.$poolLabel.')',
                    '/trainings?date='.$validated['date'].'&pool='.$validated['pool'].'&attendance=1'
                ));
            }
        }

        return response()->json([
            'message' => 'Attendance saved!',
            'training' => $training,
            'member_ids' => $validated['member_ids'],
        ]);
    }

    public function getByDate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date'],
            'pool' => ['required', 'in:big,small'],
        ]);

        $training = Training::where('date', $validated['date'])
            ->where('pool', $validated['pool'])
            ->first();

        if (! $training) {
            return response()->json(['member_ids' => []]);
        }

        $memberIds = Attendance::where('training_id', $training->id)
            ->pluck('member_id');

        return response()->json(['member_ids' => $memberIds]);
    }
}
