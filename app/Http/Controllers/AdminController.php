<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Member;
use App\Models\MembershipFee;
use App\Models\Salary;
use Carbon\Carbon;

class AdminController extends Controller
{
    public function index()
    {
        $currentYear = now()->year;
        $today = Carbon::today();

        $membershipTotal = (float) MembershipFee::whereYear('start_date', $currentYear)->sum('amount');
        $salaryTotal = (float) Salary::whereYear('month', $currentYear)->sum('amount');
        $invoiceTotal = (float) Invoice::whereYear('month', $currentYear)->sum('amount');

        $profitTotal = $membershipTotal - $salaryTotal - $invoiceTotal;

        $unpaidFees = Member::with([
            'membershipFees' => function ($query) {
                $query->orderBy('end_date', 'desc');
            },
        ])
            ->get()
            ->filter(function ($member) use ($today) {
                $latestFee = $member->membershipFees->first();

                return !$latestFee || Carbon::parse($latestFee->end_date)->lt($today);
            })
            ->count();

        return inertia('dashboard', [
            'unpaidFees' => $unpaidFees,
            'invoiceTotal' => $invoiceTotal,
            'profitTotal' => $profitTotal,
        ]);
    }

    public function invoices()
    {
        $invoices = Invoice::orderBy('month', 'desc')->get();

        return inertia('invoices/index', [
            'invoices' => $invoices,
            'csrf_token' => csrf_token(),
        ]);
    }
}