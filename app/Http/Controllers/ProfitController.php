<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\MembershipFee;
use App\Models\Salary;
use Carbon\Carbon;

class ProfitController extends Controller
{
    public function index()
    {
        $monthlyData = [];

        $membershipFees = MembershipFee::select('amount', 'start_date')->get();
        $salaries = Salary::select('amount', 'month')->get();
        $invoices = Invoice::select('amount', 'month')->get();

        foreach ($membershipFees as $fee) {
            $monthKey = Carbon::parse($fee->start_date)->startOfMonth()->format('Y-m-d');

            if (!isset($monthlyData[$monthKey])) {
                $monthlyData[$monthKey] = [
                    'month' => $monthKey,
                    'memberships' => 0,
                    'salaries' => 0,
                    'invoices' => 0,
                    'profit' => 0,
                ];
            }

            $monthlyData[$monthKey]['memberships'] += (float) $fee->amount;
        }

        foreach ($salaries as $salary) {
            $monthKey = Carbon::parse($salary->month)->startOfMonth()->format('Y-m-d');

            if (!isset($monthlyData[$monthKey])) {
                $monthlyData[$monthKey] = [
                    'month' => $monthKey,
                    'memberships' => 0,
                    'salaries' => 0,
                    'invoices' => 0,
                    'profit' => 0,
                ];
            }

            $monthlyData[$monthKey]['salaries'] += (float) $salary->amount;
        }

        foreach ($invoices as $invoice) {
            $monthKey = Carbon::parse($invoice->month)->startOfMonth()->format('Y-m-d');

            if (!isset($monthlyData[$monthKey])) {
                $monthlyData[$monthKey] = [
                    'month' => $monthKey,
                    'memberships' => 0,
                    'salaries' => 0,
                    'invoices' => 0,
                    'profit' => 0,
                ];
            }

            $monthlyData[$monthKey]['invoices'] += (float) $invoice->amount;
        }

        foreach ($monthlyData as $month => $data) {
            $monthlyData[$month]['profit'] =
                $data['memberships'] - $data['salaries'] - $data['invoices'];
        }

        krsort($monthlyData);

        return inertia('profit/index', [
            'profits' => array_values($monthlyData),
        ]);
    }
}