<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\MembershipFee;
use App\Models\User;
use App\Notifications\MembershipPaymentNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class MembershipFeeController extends Controller
{
    public function index()
    {
        $members = Member::visibleTo(Auth::user())->get(['id', 'name', 'group_id', 'status']);

        return inertia('membership-fees/index', [
            'members' => $members,
            // The payment history (it grows every month) follows right after the page,
            // so the pop-up opens at once; a placeholder shows until it arrives
            'allFees' => Inertia::defer(fn () => MembershipFee::query()
                ->with(['member:id,name', 'group:id,name'])
                // Coaches see the payments of members in their groups
                ->when(
                    Auth::user()->visibleGroupIds() !== null,
                    fn ($query) => $query->whereHas('member', fn ($member) => $member->visibleTo(Auth::user())),
                )
                ->orderBy('start_date', 'desc')
                ->get(['id', 'member_id', 'member_name', 'group_id', 'amount', 'payment_method', 'start_date', 'end_date'])),
            'userRole' => Auth::user()->role,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'member_id' => [
                'required',
                Rule::exists('members', 'id')->where('status', 'active'),
                // Coaches record payments only for members of their groups
                function ($attribute, $value, $fail) {
                    if (! Auth::user()->canSeeGroup(Member::find($value)?->group_id)) {
                        $fail('This member is not in one of your groups.');
                    }
                },
            ],
            'amount' => ['required', 'numeric', 'min:0'],
            'payment_method' => ['required', 'in:cash,card'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
        ]);

        $member = Member::findOrFail($validated['member_id']);

        MembershipFee::create([
            ...$validated,
            'member_name' => $member->name,
            'group_id' => $member->group_id,
        ]);

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

    public function update(Request $request, MembershipFee $membershipFee)
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0'],
            'payment_method' => ['required', 'in:cash,card'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
        ]);

        $membershipFee->update($validated);

        return back()->with('success', 'Payment updated!');
    }

    public function getByMember(Member $member)
    {
        abort_unless(Auth::user()->canSeeGroup($member->group_id), 403);

        $fees = MembershipFee::where('member_id', $member->id)
            ->orderBy('start_date', 'desc')
            ->get();

        return response()->json(['fees' => $fees]);
    }
}
