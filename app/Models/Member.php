<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Member extends Model
{
    protected $fillable = ['name', 'date_of_birth', 'pool', 'parent_id'];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(ClubParent::class, 'parent_id');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function membershipFees(): HasMany
    {
        return $this->hasMany(MembershipFee::class);
    }
}