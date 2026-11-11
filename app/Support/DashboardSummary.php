<?php

namespace App\Support;

use App\Models\Invoice;
use App\Models\Member;
use App\Models\MembershipFee;
use App\Models\Salary;
use App\Models\User;
use Carbon\Carbon;

/**
 * The numbers on the dashboard cards. Used by the dashboard itself and by the
 * pop-up pages, which show the dashboard behind their pop-up.
 */
class DashboardSummary
{
    public static function for(User $user): array
    {
        $currentYear = now()->year;
        $today = Carbon::today();

        $membershipTotal = (float) MembershipFee::whereYear('start_date', $currentYear)->sum('amount');
        $salaryTotal = (float) Salary::whereYear('month', $currentYear)->sum('amount');
        $invoiceTotal = (float) Invoice::whereYear('month', $currentYear)->sum('amount');

        $coachSalaryTotal = $user->role === 'coach'
            ? (float) Salary::where('user_id', $user->id)->whereYear('month', $currentYear)->sum('amount')
            : 0.0;

        $unpaidFees = Member::where('status', 'active')
            ->with(['membershipFees' => fn ($query) => $query->orderBy('end_date', 'desc')])
            ->get()
            ->filter(function ($member) use ($today) {
                $latestFee = $member->membershipFees->first();

                return ! $latestFee || Carbon::parse($latestFee->end_date)->lt($today);
            })
            ->count();

        return [
            'userRole' => $user->role,
            'activeMembers' => Member::where('status', 'active')->count(),
            'unpaidFees' => $unpaidFees,
            'invoiceTotal' => $invoiceTotal,
            'profitTotal' => $membershipTotal - $salaryTotal - $invoiceTotal,
            'coachSalaryTotal' => $coachSalaryTotal,
        ];
    }
}
