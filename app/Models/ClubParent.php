<?php

namespace App\Models;

use App\Models\Concerns\BelongsToClub;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClubParent extends Model
{
    use BelongsToClub;

    protected $table = 'parents';

    protected $fillable = [
        'name',
        'email',
        'phone',
        'user_id',
        'invited_at',
        'claimed_at',
    ];

    protected $casts = [
        'invited_at' => 'datetime',
        'claimed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(Member::class, 'parent_id');
    }
}
