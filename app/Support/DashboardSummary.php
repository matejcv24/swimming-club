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

        // One query: each active member with only the end date of their latest fee
        // (instead of loading every fee they ever paid), used for both counts.
        $activeMembers = Member::where('status', 'active')
            ->withMax('membershipFees', 'end_date')
            ->get(['id']);

        $unpaidFees = $activeMembers
            ->filter(fn ($member) => ! $member->membership_fees_max_end_date
                || Carbon::parse($member->membership_fees_max_end_date)->lt($today))
            ->count();

        return [
            'userRole' => $user->role,
            'activeMembers' => $activeMembers->count(),
            'unpaidFees' => $unpaidFees,
            'invoiceTotal' => $invoiceTotal,
            'profitTotal' => $membershipTotal - $salaryTotal - $invoiceTotal,
            'coachSalaryTotal' => $coachSalaryTotal,
        ];
    }
}
