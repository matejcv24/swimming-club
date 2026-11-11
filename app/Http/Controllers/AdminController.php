<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\MembershipFee;
use App\Models\Salary;
use App\Support\DashboardSummary;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class AdminController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $coachSalaries = $user->role === 'coach'
            ? Salary::where('user_id', $user->id)->orderBy('month', 'desc')->get()
            : collect();

        // Earliest year with any fee, invoice or salary: the first year offered in the monthly report dialog
        $reportFirstYear = $user->role === 'admin'
            ? collect([
                MembershipFee::min('start_date'),
                Invoice::min('month'),
                Salary::min('month'),
            ])->filter()->map(fn ($date) => Carbon::parse($date)->year)->min()
            : null;

        return inertia('dashboard', [
            ...DashboardSummary::for($user),
            'coachSalaries' => $coachSalaries,
            'reportFirstYear' => $reportFirstYear,
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
