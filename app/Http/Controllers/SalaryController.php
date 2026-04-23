<?php

namespace App\Http\Controllers;

use App\Models\Salary;
use App\Models\User;
use Illuminate\Http\Request;
use App\Notifications\SalaryAddedNotification;
use Carbon\Carbon;

class SalaryController extends Controller
{
public function store(Request $request)
{
    $validated = $request->validate([
        'user_id' => ['required', 'exists:users,id'],
        'amount'  => ['required', 'numeric', 'min:0'],
        'month'   => ['required', 'date'],
    ]);

    $salary = Salary::create($validated);

    $coach = User::find($validated['user_id']);

    if ($coach && $coach->role === 'coach') {
        $monthLabel = Carbon::parse($validated['month'])->format('F Y');
        $coach->notify(new SalaryAddedNotification(
            $monthLabel . ' salary: ' . number_format((float) $validated['amount'], 2) . ' MKD',
            '/staff'
        ));
    }

    return back()->with('success', 'Salary recorded!');
}

    public function getByCoach(User $coach)
    {
        $salaries = Salary::where('user_id', $coach->id)
            ->orderBy('month', 'desc')
            ->get();

        return response()->json(['salaries' => $salaries]);
    }
}