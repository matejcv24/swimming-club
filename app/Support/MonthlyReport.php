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
    public static function for(int $year, int $month): array
    {
        $start = CarbonImmutable::create($year, $month, 1)->startOfDay();
        $next = $start->addMonth();
        $inMonth = fn ($query, string $column) => $query
            ->where($column, '>=', $start->toDateString())
            ->where($column, '<', $next->toDateString());

        // Groups in the club's order; rows without a group come last
        $order = fn ($group) => $group ? [$group->position, $group->id] : [PHP_INT_MAX, PHP_INT_MAX];

        $fees = MembershipFee::with(['member:id,name', 'group'])
            ->tap(fn ($q) => $inMonth($q, 'start_date'))
            ->get()
            ->map(fn (MembershipFee $fee) => [
                'member' => $fee->member?->name ?? $fee->member_name,
                'group' => $fee->group?->name,
                'group_order' => $order($fee->group),
                'start_date' => $fee->start_date,
                'end_date' => $fee->end_date,
                'payment_method' => $fee->payment_method,
                'amount' => (float) $fee->amount,
            ]);

        $feesByGroup = $fees
            ->groupBy(fn ($row) => $row['group'] ?? '')
            ->sortBy(fn (Collection $rows) => $rows->first()['group_order'])
            ->map(fn (Collection $rows) => [
                'group' => $rows->first()['group'],
                'rows' => $rows->sortBy('member', SORT_NATURAL | SORT_FLAG_CASE)->values(),
                'total' => $rows->sum('amount'),
            ])
            ->values();

        $invoices = Invoice::with('group')
            ->tap(fn ($q) => $inMonth($q, 'month'))
            ->get()
            ->sortBy(fn (Invoice $invoice) => $order($invoice->group))
            ->map(fn (Invoice $invoice) => [
                'group' => $invoice->group?->name,
                'amount' => (float) $invoice->amount,
            ])
            ->values();

        $salaries = Salary::with('user:id,name')
            ->tap(fn ($q) => $inMonth($q, 'month'))
            ->get()
            ->map(fn (Salary $salary) => [
                'coach' => $salary->user?->name ?? __('Unknown coach'),
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
            'feesByGroup' => $feesByGroup,
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
