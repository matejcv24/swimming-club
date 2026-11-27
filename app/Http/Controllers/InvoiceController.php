<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Support\ClubRule;
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
     * Invoices for one month: one line per group (or without a group) and the total
     */
    public function getByMonth($month)
    {
        $invoices = Invoice::with('group')->where('month', '=', $month)->get();

        return response()->json([
            'invoices' => $invoices->map(fn (Invoice $invoice) => [
                'id' => $invoice->id,
                'group_id' => $invoice->group_id,
                'group_name' => $invoice->group?->name,
                'amount' => (float) $invoice->amount,
            ])->values(),
            'total' => (float) $invoices->sum('amount'),
        ]);
    }

    /**
     * Record a month's invoice, for one group or for no group in particular.
     * There is one invoice per month per group (or per month without a group):
     * recording it again updates the amount.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'month' => 'required|date_format:Y-m-d',
            'group_id' => ['nullable', ClubRule::exists('groups')->whereNull('deleted_at')->whereNull('parent_id')],
            'amount' => 'required|numeric|min:0',
        ]);

        $groupId = $validated['group_id'] ?? null;

        $existing = Invoice::where('month', $validated['month'])
            ->when($groupId, fn ($query) => $query->where('group_id', $groupId), fn ($query) => $query->whereNull('group_id'))
            ->first();

        if ($existing) {
            $existing->update(['amount' => $validated['amount']]);

            return response()->json($existing, 200);
        }

        $invoice = Invoice::create([
            'month' => $validated['month'],
            'group_id' => $groupId,
            'amount' => $validated['amount'],
        ]);

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
