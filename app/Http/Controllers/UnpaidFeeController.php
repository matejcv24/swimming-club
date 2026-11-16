<?php

namespace App\Http\Controllers;

use App\Models\Member;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class UnpaidFeeController extends Controller
{
    public function index()
    {
        $today = Carbon::today();

        // Each active member with only the end date of their latest fee
        $members = Member::visibleTo(Auth::user())
            ->where('status', 'active')
            ->with('parent:id,name,phone')
            ->withMax('membershipFees', 'end_date')
            ->get(['id', 'name', 'group_id', 'parent_id']);

        $unpaidMembers = $members
            ->map(function ($member) use ($today) {
                $latestEnd = $member->membership_fees_max_end_date;

                $isUnpaid = ! $latestEnd || Carbon::parse($latestEnd)->lt($today);

                if (! $isUnpaid) {
                    return null;
                }

                return [
                    'id' => $member->id,
                    'name' => $member->name,
                    'group_id' => $member->group_id,
                    'parentName' => $member->parent?->name,
                    'phone' => $member->parent?->phone,
                    'latest_end_date' => $latestEnd ? Carbon::parse($latestEnd)->toDateString() : null,
                ];
            })
            ->filter()
            ->values();

        // One list; the page splits it into the club's groups
        return inertia('unpaid-fees/index', [
            'unpaidMembers' => $unpaidMembers,
        ]);
    }
}