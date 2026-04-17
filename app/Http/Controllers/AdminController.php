<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Member;
use App\Models\MembershipFee;
use App\Models\Training;

class AdminController extends Controller
{
    public function index()
    {
        return inertia('dashboard', [
            'totalMembers' => Member::count(),
            'totalTrainings' => Training::count(),
            'unpaidFees' => MembershipFee::count(),
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
