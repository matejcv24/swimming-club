<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\MembershipFee;
use App\Models\Salary;

class AdminController extends Controller
{
public function index()
{
    $currentYear = now()->year;

    $membershipTotal = (float) MembershipFee::whereYear('start_date', $currentYear)->sum('amount');
    $salaryTotal = (float) Salary::whereYear('month', $currentYear)->sum('amount');
    $invoiceTotal = (float) Invoice::whereYear('month', $currentYear)->sum('amount');

    $profitTotal = $membershipTotal - $salaryTotal - $invoiceTotal;

    return inertia('dashboard', [
        'unpaidFees' => MembershipFee::count(),
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