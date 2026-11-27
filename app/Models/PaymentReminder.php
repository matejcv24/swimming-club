<?php

namespace App\Models;

use App\Models\Concerns\BelongsToClub;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A payment reminder emailed for a member late with their fee. */
class PaymentReminder extends Model
{
    use BelongsToClub;

    protected $fillable = ['member_id', 'email', 'sent_by', 'sent_at'];

    protected function casts(): array
    {
        return ['sent_at' => 'datetime'];
    }

    /** The member, also after they were deleted (hidden): their history stays. */
    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class)->withTrashed();
    }
}
