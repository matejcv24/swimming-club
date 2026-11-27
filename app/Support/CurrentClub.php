<?php

namespace App\Support;

use App\Models\Club;
use App\Models\ClubMembership;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * The one place that decides which club a request (or a job) is for. Nothing
 * else may guess it.
 *
 * 1. Set explicitly with runFor() (emails, jobs, the family page, tests).
 * 2. A signed-in person: the club they chose this session, else their first
 *    club (active memberships first). Someone with no club gets none.
 * 3. Nobody signed in: the club whose own domain this is; while the app has a
 *    single club, that club.
 *
 * When no club can be decided the answer is null, and club data is not shown
 * (it never falls back to "all clubs").
 */
class CurrentClub
{
    /** Session key of the club a person with several clubs is working in. */
    public const SESSION_KEY = 'club_id';

    /** @var list<Club|null> Clubs set by runFor(), innermost last */
    private array $stack = [];

    /** @var array<string, int|null> Club id per signed-in person or host */
    private array $resolved = [];

    public static function get(): ?Club
    {
        return app(self::class)->club();
    }

    public static function id(): ?int
    {
        return self::get()?->id;
    }

    /** The club, or "not found" when none can be decided. */
    public static function require(): Club
    {
        return self::get() ?? throw new NotFoundHttpException;
    }

    /**
     * Runs the callback for the given club (null: for no club), and always puts
     * back the club that was current before.
     *
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    public static function runFor(?Club $club, callable $callback): mixed
    {
        $current = app(self::class);
        $current->stack[] = $club;

        try {
            return $callback();
        } finally {
            array_pop($current->stack);
        }
    }

    /** Forgets what was worked out, after the club or the signed-in person changed. */
    public static function forget(): void
    {
        $current = app(self::class);
        $current->resolved = [];
        $current->clubs = [];
    }

    public function club(): ?Club
    {
        if ($this->stack !== []) {
            return end($this->stack);
        }

        $user = Auth::guard('web')->user();
        $key = $user ? 'user:'.$user->getAuthIdentifier().':'.session(self::SESSION_KEY) : 'host:'.request()->getHost();

        if (! array_key_exists($key, $this->resolved)) {
            $this->resolved[$key] = $user ? $this->clubIdOf($user) : $this->clubIdOfHost();
        }

        $id = $this->resolved[$key];

        return $id ? ($this->clubs[$id] ??= Club::find($id)) : null;
    }

    /** @var array<int, Club|null> */
    private array $clubs = [];

    private function clubIdOf(Authenticatable $user): ?int
    {
        $memberships = ClubMembership::query()
            ->where('user_id', $user->getAuthIdentifier())
            ->orderByRaw('deactivated_at is not null')
            ->orderBy('id')
            ->get(['club_id', 'deactivated_at']);

        // The club chosen in "My clubs", while they are still active there
        $chosen = (int) session(self::SESSION_KEY);
        $active = $memberships->whereNull('deactivated_at')->pluck('club_id')->map(fn ($id) => (int) $id);

        return $active->contains($chosen) ? $chosen : ($memberships->first() ? (int) $memberships->first()->club_id : null);
    }

    private function clubIdOfHost(): ?int
    {
        $id = Club::query()->where('custom_domain', request()->getHost())->value('id');

        if ($id) {
            return (int) $id;
        }

        $ids = Club::query()->limit(2)->pluck('id');

        return $ids->count() === 1 ? (int) $ids->first() : null;
    }
}
