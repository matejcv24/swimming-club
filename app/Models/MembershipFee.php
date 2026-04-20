<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MembershipFee extends Model
{
    protected $fillable = ['member_id', 'amount', 'payment_method', 'start_date', 'end_date'];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'amount' => 'float',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }
}