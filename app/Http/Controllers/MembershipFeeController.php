<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\MembershipFee;
use Illuminate\Http\Request;

class MembershipFeeController extends Controller
{
    public function index()
    {
        $members = Member::all();

        return inertia('membership-fees/index', [
            'members' => $members,
        ]);
    }

public function store(Request $request)
{
    $validated = $request->validate([
        'member_id'      => ['required', 'exists:members,id'],
        'amount'         => ['required', 'numeric', 'min:0'],
        'payment_method' => ['required', 'in:cash,card'],
        'start_date'     => ['required', 'date'],
        'end_date'       => ['required', 'date', 'after:start_date'],
    ]);

    MembershipFee::create($validated);

    return back()->with('success', 'Payment recorded!');
}
    public function getByMember(Member $member)
    {
        $fees = MembershipFee::where('member_id', $member->id)
            ->orderBy('start_date', 'desc')
            ->get();

        return response()->json(['fees' => $fees]);
    }
}