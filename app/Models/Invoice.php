<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    protected $fillable = ['month', 'pool', 'group_id', 'amount'];
    protected $casts = [
        'month' => 'date:Y-m-d',
        'amount' => 'decimal:2',
    ];

    /** Its group, even if the group has since been deleted (hidden). */
    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class)->withTrashed();
    }
}
