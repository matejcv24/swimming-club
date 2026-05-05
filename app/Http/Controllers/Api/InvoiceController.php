<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'invoices' => Invoice::orderBy('month', 'desc')->get(),
        ]);
    }

    public function getByMonth(string $month): JsonResponse
    {
        $invoices = Invoice::where('month', $month)->get();

        $big = $invoices->firstWhere('pool', 'big')?->amount ?? 0;
        $small = $invoices->firstWhere('pool', 'small')?->amount ?? 0;

        return response()->json([
            'big_pool' => $big,
            'small_pool' => $small,
            'total' => $big + $small,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'month' => ['required', 'date_format:Y-m-d'],
            'pool' => ['required', 'in:big,small'],
            'amount' => ['required', 'numeric', 'min:0'],
        ]);

        $existing = Invoice::where('month', $validated['month'])
            ->where('pool', $validated['pool'])
            ->first();

        if ($existing) {
            $existing->update(['amount' => $validated['amount']]);

            return response()->json($existing);
        }

        $invoice = Invoice::create($validated);

        return response()->json($invoice, 201);
    }

    public function update(Request $request, Invoice $invoice): JsonResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0'],
        ]);

        $invoice->update($validated);

        return response()->json($invoice);
    }

    public function destroy(Invoice $invoice): JsonResponse
    {
        $invoice->delete();

        return response()->json(null, 204);
    }
}
