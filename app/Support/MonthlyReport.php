<?php

namespace App\Support;

use App\Models\Invoice;
use App\Models\MembershipFee;
use App\Models\Salary;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * Everything that happened financially in one month: membership fees,
 * invoices and salaries. Uses the same month rules as the Profit page:
 * fees count in the month of their start date, invoices and salaries in
 * the month they were recorded for.
 */
class MonthlyReport
{
    private const POOL_ORDER = ['big' => 0, 'small' => 1];

    public static function for(int $year, int $month): array
    {
        $start = CarbonImmutable::create($year, $month, 1)->startOfDay();
        $next = $start->addMonth();
        $inMonth = fn ($query, string $column) => $query
            ->where($column, '>=', $start->toDateString())
            ->where($column, '<', $next->toDateString());

        $fees = MembershipFee::with('member:id,name')
            ->tap(fn ($q) => $inMonth($q, 'start_date'))
            ->get()
            ->map(fn (MembershipFee $fee) => [
                'member' => $fee->member?->name ?? $fee->member_name,
                'pool' => $fee->pool,
                'start_date' => $fee->start_date,
                'end_date' => $fee->end_date,
                'payment_method' => $fee->payment_method,
                'amount' => (float) $fee->amount,
            ]);

        $feesByPool = $fees
            ->groupBy('pool')
            ->sortBy(fn ($rows, $pool) => self::POOL_ORDER[$pool] ?? 99)
            ->map(fn (Collection $rows, $pool) => [
                'pool' => $pool,
                'rows' => $rows->sortBy('member', SORT_NATURAL | SORT_FLAG_CASE)->values(),
                'total' => $rows->sum('amount'),
            ])
            ->values();

        $invoices = Invoice::query()
            ->tap(fn ($q) => $inMonth($q, 'month'))
            ->get()
            ->map(fn (Invoice $invoice) => [
                'pool' => $invoice->pool,
                'amount' => (float) $invoice->amount,
            ])
            ->sortBy(fn ($row) => self::POOL_ORDER[$row['pool']] ?? 99)
            ->values();

        $salaries = Salary::with('user:id,name')
            ->tap(fn ($q) => $inMonth($q, 'month'))
            ->get()
            ->map(fn (Salary $salary) => [
                'coach' => $salary->user?->name ?? 'Unknown coach',
                'amount' => (float) $salary->amount,
            ])
            ->sortBy('coach', SORT_NATURAL | SORT_FLAG_CASE)
            ->values();

        $totals = [
            'fees' => $fees->sum('amount'),
            'invoices' => $invoices->sum('amount'),
            'salaries' => $salaries->sum('amount'),
        ];
        $totals['profit'] = $totals['fees'] - $totals['invoices'] - $totals['salaries'];

        return [
            'month' => $start,
            'feesByPool' => $feesByPool,
            'feeCount' => $fees->count(),
            'feesByMethod' => [
                'cash' => $fees->where('payment_method', 'cash')->sum('amount'),
                'card' => $fees->where('payment_method', 'card')->sum('amount'),
            ],
            'invoices' => $invoices,
            'salaries' => $salaries,
            'totals' => $totals,
        ];
    }
}
