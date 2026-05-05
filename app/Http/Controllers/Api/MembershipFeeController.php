<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\MembershipFee;
use App\Models\User;
use App\Notifications\MembershipPaymentNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MembershipFeeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'members' => Member::all(),
            'allFees' => MembershipFee::with('member')
                ->orderBy('start_date', 'desc')
                ->get(),
            'userRole' => $request->user()?->role,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'member_id' => ['required', 'exists:members,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'payment_method' => ['required', 'in:cash,card'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
        ]);

        $fee = MembershipFee::create($validated)->load('member');
        $member = $fee->member;
        $actor = $request->user();

        if ($actor?->role === 'coach' && $member) {
            $admins = User::where('role', 'admin')->get();

            foreach ($admins as $admin) {
                $admin->notify(new MembershipPaymentNotification(
                    $actor->name.' recorded new payment for '.$member->name,
                    '/membership-fees?member='.$member->id.'&history=1'
                ));
            }
        }

        return response()->json([
            'message' => 'Payment recorded!',
            'fee' => $fee,
        ], 201);
    }

    public function getByMember(Member $member): JsonResponse
    {
        $fees = MembershipFee::where('member_id', $member->id)
            ->orderBy('start_date', 'desc')
            ->get();

        return response()->json(['fees' => $fees]);
    }
}
