<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    /**
     * Display all invoices grouped by month
     */
    public function index()
    {
        $invoices = Invoice::orderBy('month', 'desc')->get();
        
        return response()->json([
            'invoices' => $invoices,
        ]);
    }

    /**
     * Get invoices for a specific month
     */
    public function getByMonth($month)
    {
        $invoices = Invoice::where('month', '=', $month)->get();
        
        $big = $invoices->firstWhere('pool', 'big')?->amount ?? 0;
        $small = $invoices->firstWhere('pool', 'small')?->amount ?? 0;
        
        return response()->json([
            'big_pool' => $big,
            'small_pool' => $small,
            'total' => $big + $small,
        ]);
    }

    /**
     * Store a new invoice
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'month' => 'required|date_format:Y-m-d',
            'pool' => 'required|in:big,small',
            'amount' => 'required|numeric|min:0',
        ]);

        $existing = Invoice::where('month', $validated['month'])
            ->where('pool', $validated['pool'])
            ->first();

        if ($existing) {
            // Update if already exists
            $existing->update(['amount' => $validated['amount']]);
            return response()->json($existing, 200);
        }

        $invoice = Invoice::create($validated);

        return response()->json($invoice, 201);
    }

    /**
     * Update an existing invoice
     */
    public function update(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
        ]);

        $invoice->update($validated);

        return response()->json($invoice, 200);
    }

    /**
     * Delete an invoice
     */
    public function destroy(Invoice $invoice)
    {
        $invoice->delete();

        return response()->json(null, 204);
    }
}
