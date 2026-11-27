<?php

namespace App\Models;

use App\Models\Concerns\BelongsToClub;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MembershipFee extends Model
{
    use BelongsToClub;

    protected $fillable = ['member_id', 'member_name', 'pool', 'group_id', 'amount', 'payment_method', 'start_date', 'end_date'];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'amount' => 'float',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    /** Its group, even if the group has since been deleted (hidden). */
    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class)->withTrashed();
    }
}
