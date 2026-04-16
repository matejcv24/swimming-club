<?php

namespace App\Http\Controllers;

use App\Models\Salary;
use App\Models\User;
use Illuminate\Http\Request;

class SalaryController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'amount'  => ['required', 'numeric', 'min:0'],
            'month'   => ['required', 'date'],
        ]);

        Salary::create($validated);

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