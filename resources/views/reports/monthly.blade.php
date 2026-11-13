@php
    $money = function (float $value): string {
        $formatted = number_format($value, 2, '.', ',');

        return str_ends_with($formatted, '.00') ? substr($formatted, 0, -3) : $formatted;
    };
    $poolName = fn (?string $pool) => $pool ? ucfirst($pool).' pool' : 'No pool';
    $monthName = $month->format('F Y');
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>SC Hydra - Monthly report - {{ $monthName }}</title>
    <style>
        @page {
            margin: 36px 40px 56px;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 9.5px;
            color: #1f2937;
        }

        /* Full-bleed navy band on the first page only */
        .header {
            margin: -36px -40px 0;
            background: #001031;
            color: #fff;
            padding: 22px 40px;
        }

        .header table {
            width: 100%;
            border-collapse: collapse;
        }

        .header img {
            width: 74px;
        }

        .header .club {
            font-size: 10px;
            letter-spacing: 2px;
            color: #8fc9e8;
        }

        .header .title {
            margin-top: 4px;
            font-size: 22px;
            font-weight: bold;
        }

        .header .meta {
            text-align: right;
            font-size: 9px;
            color: #b8c4dd;
            line-height: 1.6;
        }

        .header .period {
            font-size: 15px;
            font-weight: bold;
            color: #fff;
        }

        .content {
            padding-top: 24px;
        }

        h2 {
            margin: 26px 0 10px;
            padding-bottom: 5px;
            border-bottom: 2px solid #1690c8;
            color: #001031;
            font-size: 13px;
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        h2.first {
            margin-top: 0;
        }

        h3 {
            margin: 14px 0 6px;
            color: #1690c8;
            font-size: 11px;
        }

        /* Summary tiles */
        .tiles {
            width: 100%;
            border-collapse: separate;
            border-spacing: 8px 0;
            margin: 0 -8px;
        }

        .tile {
            width: 25%;
            padding: 12px 12px 10px;
            border: 1px solid #d6e6f1;
            border-top: 3px solid #1690c8;
            background: #f5fafd;
            vertical-align: top;
        }


        .tile .label {
            font-size: 8.5px;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #5b6b82;
        }

        .tile .value {
            margin-top: 6px;
            font-size: 15px;
            font-weight: bold;
        }

        .tile .unit {
            font-size: 9px;
            font-weight: normal;
        }

        .positive {
            color: #15803d;
        }

        .negative {
            color: #dc2626;
        }

        .breakdown {
            margin-top: 10px;
            color: #5b6b82;
            line-height: 1.7;
        }

        .breakdown strong {
            color: #1f2937;
        }

        /* Data tables */
        table.data {
            width: 100%;
            border-collapse: collapse;
        }

        table.data th {
            background: #001031;
            color: #fff;
            font-size: 8.5px;
            font-weight: bold;
            letter-spacing: 0.5px;
            text-align: left;
            text-transform: uppercase;
            padding: 6px 8px;
        }

        table.data td {
            padding: 5px 8px;
            border-bottom: 1px solid #e5edf3;
        }

        table.data tbody tr:nth-child(even) td {
            background: #f5fafd;
        }

        table.data tr {
            page-break-inside: avoid;
        }

        .num,
        table.data th.num {
            text-align: right;
            white-space: nowrap;
        }

        /* Short sections (invoices, salaries) move to the next page whole instead of splitting */
        .keep-together {
            page-break-inside: avoid;
        }

        .muted {
            color: #6b7280;
        }

        .capitalize {
            text-transform: capitalize;
        }

        table.data tfoot td {
            border-bottom: 0;
            padding-top: 7px;
            font-weight: bold;
            color: #001031;
        }

        .grand-total {
            margin-top: 10px;
            padding: 8px 10px;
            background: #e8f3fa;
            color: #001031;
            font-size: 11px;
            font-weight: bold;
        }

        .grand-total td {
            padding: 0;
        }

        .empty {
            padding: 12px;
            border: 1px dashed #c5dceb;
            color: #6b7280;
            text-align: center;
        }

        .footer {
            position: fixed;
            bottom: -40px;
            left: 0;
            right: 0;
            padding-top: 8px;
            border-top: 1px solid #d6e6f1;
            font-size: 8px;
            color: #6b7280;
        }

        /* "Page X of Y" is stamped on each page by MonthlyReportController after rendering */
    </style>
</head>
<body>
    <div class="footer">
        SC Hydra &middot; Monthly report {{ $monthName }} &middot; Generated {{ $generatedAt->format('d.m.Y H:i') }} by {{ $generatedBy }}
    </div>

    <div class="header">
        <table>
            <tr>
                <td style="width: 90px; vertical-align: middle;"><img src="{{ $logo }}" alt=""></td>
                <td style="vertical-align: middle;">
                    <div class="club">HYDRA SWIMMING CLUB</div>
                    <div class="title">Monthly report</div>
                </td>
                <td class="meta" style="vertical-align: middle;">
                    <div class="period">{{ $monthName }}</div>
                    {{ $month->format('d.m.Y') }} &ndash; {{ $month->endOfMonth()->format('d.m.Y') }}
                </td>
            </tr>
        </table>
    </div>

    <div class="content">
        {{-- Summary --}}
        <h2 class="first">Summary</h2>
        <table class="tiles">
            <tr>
                <td class="tile">
                    <div class="label">Membership fees</div>
                    <div class="value">{{ $money($totals['fees']) }} <span class="unit">MKD</span></div>
                </td>
                <td class="tile">
                    <div class="label">Invoices</div>
                    <div class="value">{{ $totals['invoices'] > 0 ? '-' : '' }}{{ $money($totals['invoices']) }} <span class="unit">MKD</span></div>
                </td>
                <td class="tile">
                    <div class="label">Salaries</div>
                    <div class="value">{{ $totals['salaries'] > 0 ? '-' : '' }}{{ $money($totals['salaries']) }} <span class="unit">MKD</span></div>
                </td>
                <td class="tile">
                    <div class="label">Profit</div>
                    <div class="value {{ $totals['profit'] < 0 ? 'negative' : 'positive' }}">{{ $money($totals['profit']) }} <span class="unit">MKD</span></div>
                </td>
            </tr>
        </table>

        <div class="breakdown">
            <strong>{{ $feeCount }}</strong> membership {{ $feeCount === 1 ? 'payment' : 'payments' }}
            &middot; Cash <strong>{{ $money($feesByMethod['cash']) }} MKD</strong>
            &middot; Card <strong>{{ $money($feesByMethod['card']) }} MKD</strong>
            @foreach ($feesByPool as $group)
                &middot; {{ $poolName($group['pool']) }} <strong>{{ $money($group['total']) }} MKD</strong>
            @endforeach
        </div>

        {{-- 1. Membership fees --}}
        <h2>1. Membership fees</h2>

        @forelse ($feesByPool as $group)
            <h3>{{ $poolName($group['pool']) }} &middot; {{ $group['rows']->count() }} {{ $group['rows']->count() === 1 ? 'payment' : 'payments' }}</h3>
            <table class="data">
                <thead>
                    <tr>
                        <th style="width: 6%;">#</th>
                        <th>Member</th>
                        <th style="width: 15%;">Start date</th>
                        <th style="width: 15%;">End date</th>
                        <th style="width: 11%;">Method</th>
                        <th class="num" style="width: 17%;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($group['rows'] as $fee)
                        <tr>
                            <td class="muted">{{ $loop->iteration }}</td>
                            <td>{{ $fee['member'] }}</td>
                            <td>{{ $fee['start_date']?->format('d.m.Y') }}</td>
                            <td>{{ $fee['end_date']?->format('d.m.Y') }}</td>
                            <td class="capitalize">{{ $fee['payment_method'] }}</td>
                            <td class="num">{{ $money($fee['amount']) }} MKD</td>
                        </tr>
                    @endforeach
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="5" class="num">{{ $poolName($group['pool']) }} subtotal</td>
                        <td class="num">{{ $money($group['total']) }} MKD</td>
                    </tr>
                </tfoot>
            </table>
        @empty
            <div class="empty">No membership fees recorded for {{ $monthName }}.</div>
        @endforelse

        @if ($feesByPool->isNotEmpty())
            <table class="grand-total" style="width: 100%;">
                <tr>
                    <td>Total membership fees</td>
                    <td class="num">{{ $money($totals['fees']) }} MKD</td>
                </tr>
            </table>
        @endif

        {{-- 2. Invoices --}}
        <div class="keep-together">
        <h2>2. Invoices</h2>

        @if ($invoices->isEmpty())
            <div class="empty">No invoices recorded for {{ $monthName }}.</div>
        @else
            <table class="data">
                <thead>
                    <tr>
                        <th>Group</th>
                        <th class="num" style="width: 25%;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($invoices as $invoice)
                        <tr>
                            <td>{{ $poolName($invoice['pool']) }}</td>
                            <td class="num">{{ $money($invoice['amount']) }} MKD</td>
                        </tr>
                    @endforeach
                </tbody>
                <tfoot>
                    <tr>
                        <td class="num">Total invoices</td>
                        <td class="num">{{ $money($totals['invoices']) }} MKD</td>
                    </tr>
                </tfoot>
            </table>
        @endif

        </div>

        {{-- 3. Salaries --}}
        <div class="keep-together">
        <h2>3. Salaries</h2>

        @if ($salaries->isEmpty())
            <div class="empty">No salaries recorded for {{ $monthName }}.</div>
        @else
            <table class="data">
                <thead>
                    <tr>
                        <th>Coach</th>
                        <th class="num" style="width: 25%;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($salaries as $salary)
                        <tr>
                            <td>{{ $salary['coach'] }}</td>
                            <td class="num">{{ $money($salary['amount']) }} MKD</td>
                        </tr>
                    @endforeach
                </tbody>
                <tfoot>
                    <tr>
                        <td class="num">Total salaries</td>
                        <td class="num">{{ $money($totals['salaries']) }} MKD</td>
                    </tr>
                </tfoot>
            </table>
        @endif
        </div>
    </div>
</body>
</html>
