<?php

namespace App\Models;

use App\Support\ClubAccess;
use App\Support\CurrentClub;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Club extends Model
{
    protected $fillable = ['name', 'slug', 'status', 'sport', 'sport_other', 'custom_domain', 'locale', 'email', 'logo_path'];

    /**
     * The club this request is for (see CurrentClub), or "not found" when none
     * can be decided. Never "the first club".
     */
    public static function current(): self
    {
        return CurrentClub::require();
    }

    /** A new club starts with the free demo (see ClubAccess). */
    protected static function booted(): void
    {
        static::created(fn (Club $club) => $club->subscription()->create([
            'status' => 'demo',
            'demo_ends_at' => now()->addMonths(ClubAccess::DEMO_MONTHS),
        ]));
    }

    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class);
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(ClubMembership::class);
    }

    /** The admin who owns the club (other admins can't deactivate or change them). */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /** Where the logo is shown from, changing whenever the club is saved. */
    public function logoUrl(): ?string
    {
        return $this->logo_path ? '/club/logo?club='.$this->id.'&v='.$this->updated_at?->timestamp : null;
    }
}
