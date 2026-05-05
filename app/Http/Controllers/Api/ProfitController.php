<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\MembershipFee;
use App\Models\Salary;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class ProfitController extends Controller
{
    public function index(): JsonResponse
    {
        $monthlyData = [];

        $membershipFees = MembershipFee::select('amount', 'start_date')->get();
        $salaries = Salary::select('amount', 'month')->get();
        $invoices = Invoice::select('amount', 'month')->get();

        foreach ($membershipFees as $fee) {
            $monthKey = Carbon::parse($fee->start_date)->startOfMonth()->format('Y-m-d');

            if (! isset($monthlyData[$monthKey])) {
                $monthlyData[$monthKey] = $this->emptyMonth($monthKey);
            }

            $monthlyData[$monthKey]['memberships'] += (float) $fee->amount;
        }

        foreach ($salaries as $salary) {
            $monthKey = Carbon::parse($salary->month)->startOfMonth()->format('Y-m-d');

            if (! isset($monthlyData[$monthKey])) {
                $monthlyData[$monthKey] = $this->emptyMonth($monthKey);
            }

            $monthlyData[$monthKey]['salaries'] += (float) $salary->amount;
        }

        foreach ($invoices as $invoice) {
            $monthKey = Carbon::parse($invoice->month)->startOfMonth()->format('Y-m-d');

            if (! isset($monthlyData[$monthKey])) {
                $monthlyData[$monthKey] = $this->emptyMonth($monthKey);
            }

            $monthlyData[$monthKey]['invoices'] += (float) $invoice->amount;
        }

        foreach ($monthlyData as $month => $data) {
            $monthlyData[$month]['profit'] =
                $data['memberships'] - $data['salaries'] - $data['invoices'];
        }

        krsort($monthlyData);

        return response()->json([
            'profits' => array_values($monthlyData),
        ]);
    }

    private function emptyMonth(string $month): array
    {
        return [
            'month' => $month,
            'memberships' => 0,
            'salaries' => 0,
            'invoices' => 0,
            'profit' => 0,
        ];
    }
}
