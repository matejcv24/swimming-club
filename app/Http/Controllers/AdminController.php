<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Member;
use App\Models\MembershipFee;
use App\Models\Salary;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class AdminController extends Controller
{
    public function index()
    {
        $currentYear = now()->year;
        $today = Carbon::today();
        $user = Auth::user();

        $membershipTotal = (float) MembershipFee::whereYear('start_date', $currentYear)->sum('amount');
        $salaryTotal = (float) Salary::whereYear('month', $currentYear)->sum('amount');
        $invoiceTotal = (float) Invoice::whereYear('month', $currentYear)->sum('amount');
        $coachSalaries = $user->role === 'coach'
            ? Salary::where('user_id', $user->id)->orderBy('month', 'desc')->get()
            : collect();
        $coachSalaryTotal = (float) $coachSalaries
            ->filter(fn ($salary) => Carbon::parse($salary->month)->year === $currentYear)
            ->sum('amount');

        $profitTotal = $membershipTotal - $salaryTotal - $invoiceTotal;

        $unpaidFees = Member::where('status', 'active')
            ->with([
                'membershipFees' => function ($query) {
                    $query->orderBy('end_date', 'desc');
                },
            ])
            ->get()
            ->filter(function ($member) use ($today) {
                $latestFee = $member->membershipFees->first();

                return ! $latestFee || Carbon::parse($latestFee->end_date)->lt($today);
            })
            ->count();

        return inertia('dashboard', [
            'userRole' => $user->role,
            'activeMembers' => Member::where('status', 'active')->count(),
            'unpaidFees' => $unpaidFees,
            'invoiceTotal' => $invoiceTotal,
            'profitTotal' => $profitTotal,
            'coachSalaryTotal' => $coachSalaryTotal,
            'coachSalaries' => $coachSalaries,
        ]);
    }

    public function invoices()
    {
        return inertia('invoices/index');
    }
}
