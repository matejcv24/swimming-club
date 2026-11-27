<?php

namespace App\Models;

use App\Models\Concerns\BelongsToClub;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Salary extends Model
{
    use BelongsToClub;

    protected $fillable = ['user_id', 'amount', 'month'];

    protected $casts = [
        'month' => 'date',
    ];

    public function user(): BelongsTo
    {
        // Also a deleted (hidden) staff account: its salaries stay in the finances
        return $this->belongsTo(User::class)->withTrashed();
    }
}
