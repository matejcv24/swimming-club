<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Club;
use App\Models\Member;
use App\Models\MembershipFee;
use App\Support\CurrentClub;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

/**
 * The page a payment reminder links to: a parent (or an adult member) sees the
 * attendance and payments of the members the email was about. No login: the
 * link is signed (it can't be changed to show anyone else) and expires.
 */
class FamilyController extends Controller
{
    /** How long a link in an email keeps working. */
    public const VALID_DAYS = 60;

    /** How far back attendance is shown. */
    private const ATTENDANCE_MONTHS = 12;

    /** @param  list<int>  $memberIds */
    public static function link(array $memberIds): string
    {
        return URL::temporarySignedRoute(
            'family.show',
            now()->addDays(self::VALID_DAYS),
            ['club' => CurrentClub::id(), 'members' => implode(',', $memberIds)],
        );
    }

    /**
     * The link names its club (signed, so it can't be changed); links sent before
     * clubs were separated have none and use the club of this address.
     */
    public function show(Request $request)
    {
        if ($request->query('club') === null) {
            return $this->showFor($request);
        }

        $club = Club::find((int) $request->query('club'));
        abort_if($club === null, 404);

        // Drawn inside, so everything on the page (the club's name too) is that club's
        return CurrentClub::runFor($club, fn () => $this->showFor($request)->toResponse($request));
    }

    private function showFor(Request $request)
    {
        abort_if(CurrentClub::id() === null, 404);

        $ids = collect(explode(',', (string) $request->query('members')))
            ->map(fn ($id) => (int) $id)
            ->filter()
            ->unique()
            ->take(10);

        $members = Member::with('group:id,name')
            ->whereIn('id', $ids)
            ->orderBy('name')
            ->get()
            ->map(fn (Member $member) => $this->details($member))
            ->values();

        abort_if($members->isEmpty(), 404);

        return inertia('public/family', [
            'members' => $members,
            'expiresAt' => Carbon::createFromTimestamp((int) $request->query('expires'))->toDateString(),
        ]);
    }

    /** @return array<string, mixed> */
    private function details(Member $member): array
    {
        $fees = MembershipFee::where('member_id', $member->id)
            ->orderByDesc('end_date')
            ->get(['start_date', 'end_date', 'amount']);

        $paidUntil = $fees->max('end_date');

        // Trainings attended, newest first, grouped by month
        $dates = Attendance::query()
            ->join('trainings', 'trainings.id', '=', 'attendances.training_id')
            ->where('attendances.member_id', $member->id)
            ->where('attendances.present', true)
            ->where('trainings.date', '>=', now()->subMonths(self::ATTENDANCE_MONTHS - 1)->startOfMonth()->toDateString())
            ->orderByDesc('trainings.date')
            ->pluck('trainings.date')
            ->map(fn ($date) => Carbon::parse($date)->toDateString())
            ->unique()
            ->values();

        return [
            'id' => $member->id,
            'name' => $member->name,
            'group' => $member->group?->name,
            'paid_until' => $paidUntil ? Carbon::parse($paidUntil)->toDateString() : null,
            'late' => ! $paidUntil || Carbon::parse($paidUntil)->lt(Carbon::today()),
            'fees' => $fees->map(fn (MembershipFee $fee) => [
                'start_date' => $fee->start_date?->toDateString(),
                'end_date' => $fee->end_date?->toDateString(),
                'amount' => $fee->amount,
            ])->values(),
            'attendance' => $dates
                ->groupBy(fn (string $date) => substr($date, 0, 7))
                ->map(fn ($days, $month) => ['month' => $month, 'dates' => $days->values()])
                ->values(),
        ];
    }
}
