<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Member;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class UnpaidFeeController extends Controller
{
    public function index(): JsonResponse
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
                $isUnpaid = ! $latestFee || Carbon::parse($latestFee->end_date)->lt($today);

                if (! $isUnpaid) {
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

        return response()->json([
            'bigPoolMembers' => $unpaidMembers
                ->filter(fn ($member) => $member['pool'] === 'big')
                ->values(),
            'smallPoolMembers' => $unpaidMembers
                ->filter(fn ($member) => $member['pool'] === 'small')
                ->values(),
        ]);
    }
}
