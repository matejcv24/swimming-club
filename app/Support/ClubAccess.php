<?php

namespace App\Support;

use App\Models\Club;
use Carbon\CarbonInterface;

/**
 * What a club may do right now, worked out from its subscription's dates:
 *
 * - demo:      the free 3 months; everything works.
 * - active:    paid until a date; everything works.
 * - grace:     the end has passed by up to 3 days; everything still works.
 * - read_only: after that (or suspended): everything can be seen, nothing can be
 *              added, changed or deleted. Nothing is ever deleted because of it.
 * - comped:    free for good (Hydra); everything works, no banners.
 */
class ClubAccess
{
    public const DEMO_MONTHS = 3;

    public const GRACE_DAYS = 3;

    /** Days before the end when the banner starts reminding. */
    public const REMIND_DAYS = 14;

    public function __construct(
        public readonly string $state,
        public readonly ?CarbonInterface $endsAt,
    ) {}

    public static function for(?Club $club): self
    {
        $subscription = $club?->subscription;

        // No subscription row (should not happen): treated as free, never locked out by a gap
        if (! $subscription || $subscription->status === 'comped') {
            return new self('comped', null);
        }

        if ($subscription->status === 'suspended') {
            return new self('read_only', null);
        }

        $endsAt = $subscription->status === 'demo' ? $subscription->demo_ends_at : $subscription->current_period_ends_at;

        if ($endsAt === null || now()->lt($endsAt)) {
            return new self($subscription->status === 'demo' ? 'demo' : 'active', $endsAt);
        }

        if (now()->lt($endsAt->copy()->addDays(self::GRACE_DAYS))) {
            return new self('grace', $endsAt);
        }

        return new self('read_only', $endsAt);
    }

    public static function current(): self
    {
        return self::for(CurrentClub::get());
    }

    public function canWrite(): bool
    {
        return $this->state !== 'read_only';
    }

    /**
     * What the banner needs: the state, the end date, how many days are left (of
     * the demo or period, or of the grace). Null when there's nothing to say.
     *
     * @return array{state: string, ends_at: ?string, days_left: ?int}|null
     */
    public function banner(): ?array
    {
        $daysLeft = $this->endsAt ? (int) ceil(now()->diffInDays($this->endsAt, false)) : null;

        $show = match ($this->state) {
            'demo', 'active' => $daysLeft !== null && $daysLeft <= self::REMIND_DAYS,
            'grace', 'read_only' => true,
            default => false,
        };

        if (! $show) {
            return null;
        }

        if ($this->state === 'grace') {
            $daysLeft = (int) ceil(now()->diffInDays($this->endsAt->copy()->addDays(self::GRACE_DAYS), false));
        }

        return [
            'state' => $this->state,
            'ends_at' => $this->endsAt?->toDateString(),
            'days_left' => $daysLeft,
        ];
    }
}
