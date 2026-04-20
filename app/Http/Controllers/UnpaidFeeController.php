<?php

namespace App\Http\Controllers;

use App\Models\Member;
use Carbon\Carbon;

class UnpaidFeeController extends Controller
{
    public function index()
    {
        $today = Carbon::today();

$members = Member::where('status', 'active')
    ->with([
        'parent',
        'membershipFees' => function ($query) {
            $query->orderBy('end_date', 'desc');
        },
    ])
    ->get();

        $unpaidMembers = $members
            ->map(function ($member) use ($today) {
                $latestFee = $member->membershipFees->first();

                $isUnpaid = !$latestFee || Carbon::parse($latestFee->end_date)->lt($today);

                if (!$isUnpaid) {
                    return null;
                }

                return [
                    'id' => $member->id,
                    'name' => $member->name,
                    'pool' => $member->pool,
                    'parentName' => $member->parent?->name,
                    'phone' => $member->parent?->phone,
                    'latest_end_date' => $latestFee?->end_date,
                ];
            })
            ->filter()
            ->values();

        $bigPoolMembers = $unpaidMembers
            ->filter(fn ($member) => $member['pool'] === 'big')
            ->values();

        $smallPoolMembers = $unpaidMembers
            ->filter(fn ($member) => $member['pool'] === 'small')
            ->values();

        return inertia('unpaid-fees/index', [
            'bigPoolMembers' => $bigPoolMembers,
            'smallPoolMembers' => $smallPoolMembers,
        ]);
    }
}