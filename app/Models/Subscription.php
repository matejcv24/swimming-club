<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** What a club may do, and until when (see ClubAccess). One per club. */
class Subscription extends Model
{
    protected $fillable = ['club_id', 'status', 'demo_ends_at', 'current_period_ends_at', 'plan', 'price'];

    protected function casts(): array
    {
        return [
            'demo_ends_at' => 'datetime',
            'current_period_ends_at' => 'datetime',
            'price' => 'decimal:2',
        ];
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }
}
