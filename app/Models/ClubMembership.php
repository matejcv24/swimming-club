<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * A person's place in one club: their role there, the groups they work with,
 * their settings, and whether the club has deactivated or removed them.
 * One person can be a member of several clubs.
 */
class ClubMembership extends Model
{
    use SoftDeletes;

    protected $table = 'club_user';

    protected $fillable = ['club_id', 'user_id', 'role', 'all_groups', 'notification_settings', 'deactivated_at'];

    protected $attributes = ['role' => 'coach', 'all_groups' => true];

    protected function casts(): array
    {
        return [
            'all_groups' => 'boolean',
            'notification_settings' => 'array',
            'deactivated_at' => 'datetime',
        ];
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withTrashed();
    }
}
