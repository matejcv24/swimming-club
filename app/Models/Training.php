<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Training extends Model
{
    protected $fillable = ['coach_id', 'date', 'pool', 'group_id', 'subgroup_id', 'notes'];

    public function coach(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coach_id');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    /** Its group, even if the group has since been deleted (hidden). */
    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class)->withTrashed();
    }

    /** The subgroup it was for (none: the whole group), even if since deleted. */
    public function subgroup(): BelongsTo
    {
        return $this->belongsTo(Group::class, 'subgroup_id')->withTrashed();
    }
}
