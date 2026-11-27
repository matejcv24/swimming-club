<?php

namespace App\Models;

use App\Models\Concerns\BelongsToClub;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * An invitation to join the club's staff: a link, valid for a few days, where
 * the invited person sets their own password.
 */
class Invitation extends Model
{
    use BelongsToClub;

    /** How long a link works. */
    public const VALID_DAYS = 7;

    protected $fillable = ['name', 'email', 'role', 'all_groups', 'group_ids', 'invited_by'];

    protected $hidden = ['token', 'token_hash'];

    protected function casts(): array
    {
        return [
            'all_groups' => 'boolean',
            'group_ids' => 'array',
            'token' => 'encrypted',
            'expires_at' => 'datetime',
            'email_sent_at' => 'datetime',
            'email_failed_at' => 'datetime',
            'accepted_at' => 'datetime',
        ];
    }

    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by')->withTrashed();
    }

    /** Not accepted yet (expired ones included, so they can be sent again). */
    public function scopePending(Builder $query): void
    {
        $query->whereNull('accepted_at');
    }

    /** A fresh secret, and the link works for another few days. */
    public function renew(): void
    {
        $token = Str::random(48);

        $this->forceFill([
            'token' => $token,
            'token_hash' => self::hash($token),
            'expires_at' => now()->addDays(self::VALID_DAYS),
        ]);
    }

    /** Extends the same link (the one already sent keeps working). */
    public function extend(): void
    {
        $this->forceFill(['expires_at' => now()->addDays(self::VALID_DAYS)]);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function link(): string
    {
        return url('/invitation/'.$this->token);
    }

    public static function hash(string $token): string
    {
        return hash('sha256', $token);
    }

    /**
     * The open invitation behind a link, if the link still works. The link itself
     * says which club it is for, so it's looked up in every club.
     */
    public static function findUsable(string $token): ?self
    {
        $invitation = static::query()->withoutGlobalScope('club')->pending()->where('token_hash', self::hash($token))->first();

        return $invitation && ! $invitation->isExpired() ? $invitation : null;
    }
}
