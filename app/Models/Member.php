<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Member extends Model
{
    /**
     * Only members of the groups the user may see (coaches see their own groups).
     * Members of all groups (no single group) are in everyone's groups.
     */
    public function scopeVisibleTo($query, User $user)
    {
        $ids = $user->visibleGroupIds();

        return $ids === null
            ? $query
            : $query->where(fn ($q) => $q->whereIn('group_id', $ids)->orWhereNull('group_id'));
    }

    /** Trains in every group rather than in one. */
    public function inAllGroups(): bool
    {
        return $this->group_id === null;
    }

    protected $fillable = ['name', 'phone', 'email', 'date_of_birth', 'pool', 'group_id', 'subgroup_id', 'status', 'parent_id'];

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

    /** Its group, even if the group has since been deleted (hidden). */
    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class)->withTrashed();
    }

    /** Optional subgroup of the member's group (e.g. "18:00"). */
    public function subgroup(): BelongsTo
    {
        return $this->belongsTo(Group::class, 'subgroup_id')->withTrashed();
    }
}
