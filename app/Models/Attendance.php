<?php

namespace App\Models;

use App\Models\Concerns\BelongsToClub;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use BelongsToClub;

    protected $fillable = [
        'training_id',
        'member_id',
        'present',
    ];

    protected $casts = [
        'present' => 'boolean',
    ];

    public function training(): BelongsTo
    {
        return $this->belongsTo(Training::class);
    }

    /** The member, also after they were deleted (hidden): their history stays. */
    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class)->withTrashed();
    }
}
