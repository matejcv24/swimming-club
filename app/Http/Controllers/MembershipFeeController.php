<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\MembershipFee;
use App\Models\User;
use App\Notifications\MembershipPaymentNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MembershipFeeController extends Controller
{
    public function index()
    {
        $members = Member::all();

        $allFees = MembershipFee::with('member')
            ->orderBy('start_date', 'desc')
            ->get();

        return inertia('membership-fees/index', [
            'members' => $members,
            'allFees' => $allFees,
            'userRole' => Auth::user()->role,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'member_id' => ['required', 'exists:members,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'payment_method' => ['required', 'in:cash,card'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
        ]);

        $fee = MembershipFee::create($validated);
        $member = Member::find($validated['member_id']);

        if (Auth::user()?->role === 'coach' && $member) {
            $admins = User::where('role', 'admin')->get();

            foreach ($admins as $admin) {
                $admin->notify(new MembershipPaymentNotification(
                    Auth::user()->name . ' recorded new payment for ' . $member->name,
                    '/membership-fees?member=' . $member->id . '&history=1'
                ));
            }
        }

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
