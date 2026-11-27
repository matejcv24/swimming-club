<?php

namespace App\Models;

use App\Models\Concerns\BelongsToClub;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * A club-made group (e.g. "Mon-Wed-Fri", "Big pool") or, when it has a parent, a
 * subgroup of one (e.g. "Big pool" → "18:00"). Deleting one only hides it, so
 * past trainings, payments and invoices keep their group's name.
 */
class Group extends Model
{
    use BelongsToClub, SoftDeletes;

    protected $fillable = ['name', 'position', 'parent_id'];

    /** Members of a main group. */
    public function members(): HasMany
    {
        return $this->hasMany(Member::class);
    }

    /** Members of a subgroup. */
    public function subgroupMembers(): HasMany
    {
        return $this->hasMany(Member::class, 'subgroup_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Group::class, 'parent_id');
    }

    public function subgroups(): HasMany
    {
        return $this->hasMany(Group::class, 'parent_id')->orderBy('position')->orderBy('id');
    }

    public function isSubgroup(): bool
    {
        return $this->parent_id !== null;
    }

    /** The main groups a club currently uses, in their order. */
    public static function ordered()
    {
        return static::query()->whereNull('parent_id')->orderBy('position')->orderBy('id');
    }
}
