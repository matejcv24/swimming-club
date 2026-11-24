<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Club extends Model
{
    protected $fillable = ['name', 'email', 'logo_path'];

    /**
     * The club the app is used by. One club for now; when more clubs join, this is
     * where the club of the logged-in person is found instead.
     */
    public static function current(): self
    {
        return static::query()->first() ?? static::create(['name' => config('app.name') ?: 'SC Hydra']);
    }

    /** The admin who owns the club (other admins can't deactivate or change them). */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /** Where the logo is shown from, changing whenever the club is saved. */
    public function logoUrl(): ?string
    {
        return $this->logo_path ? '/club/logo?v='.$this->updated_at?->timestamp : null;
    }
}
