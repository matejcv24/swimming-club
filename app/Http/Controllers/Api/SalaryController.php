<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Salary;
use App\Models\User;
use App\Notifications\SalaryAddedNotification;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalaryController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'month' => ['required', 'date'],
        ]);

        $salary = Salary::create($validated);
        $coach = User::find($validated['user_id']);

        if ($coach && $coach->role === 'coach') {
            $monthLabel = Carbon::parse($validated['month'])->format('F Y');

            $coach->notify(new SalaryAddedNotification(
                $monthLabel.' salary: '.number_format((float) $validated['amount'], 2).' MKD',
                '/staff'
            ));
        }

        return response()->json([
            'message' => 'Salary recorded!',
            'salary' => $salary,
        ], 201);
    }

    public function getByCoach(User $coach): JsonResponse
    {
        $salaries = Salary::where('user_id', $coach->id)
            ->orderBy('month', 'desc')
            ->get();

        return response()->json(['salaries' => $salaries]);
    }
}
