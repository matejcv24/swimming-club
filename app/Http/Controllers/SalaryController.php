<?php

namespace App\Http\Controllers;

use App\Models\Salary;
use App\Models\User;
use App\Notifications\SalaryAddedNotification;
use App\Support\NotificationText;
use Carbon\Carbon;
use Illuminate\Http\Request;

class SalaryController extends Controller
{
    public function store(Request $request)
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
            $amount = rtrim(rtrim(number_format((float) $validated['amount'], 2), '0'), '.');
            $coach->notify(new SalaryAddedNotification(
                $monthLabel.' salary: '.$amount.' MKD',
                '/dashboard?salary=1',
                NotificationText::make(':month salary: :amount MKD', [
                    'month' => Carbon::parse($validated['month'])->toDateString(),
                    'amount' => $amount,
                ]),
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
