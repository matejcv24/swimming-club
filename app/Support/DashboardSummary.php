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

        // "Between 1 Jan and 31 Dec" rather than "year of the date is ...": the same
        // result, but the database finds the rows through its index instead of
        // reading every row
        $year = [
            Carbon::create($currentYear)->startOfYear()->toDateString(),
            Carbon::create($currentYear)->endOfYear()->toDateTimeString(),
        ];

        $membershipTotal = (float) MembershipFee::whereBetween('start_date', $year)->sum('amount');
        $salaryTotal = (float) Salary::whereBetween('month', $year)->sum('amount');
        $invoiceTotal = (float) Invoice::whereBetween('month', $year)->sum('amount');

        $coachSalaryTotal = $user->role === 'coach'
            ? (float) Salary::where('user_id', $user->id)->whereBetween('month', $year)->sum('amount')
            : 0.0;

        // One query: each active member with only the end date of their latest fee
        // (instead of loading every fee they ever paid), used for both counts.
        $activeMembers = Member::visibleTo($user)
            ->where('status', 'active')
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
