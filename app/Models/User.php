<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use LogicException;

#[Fillable(['name', 'surname', 'phone', 'email', 'password', 'role', 'appearance', 'all_groups'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, SoftDeletes, TwoFactorAuthenticatable;

    /**
     * The notifications an admin can turn off (each kind on by default). Coaches
     * only get their own salary, which can't be turned off.
     */
    public const ADMIN_NOTIFICATIONS = ['member_changed', 'training_attendance', 'membership_payment', 'staff_joined'];

    /** Same default as the database: coaches see every group unless assigned some. */
    protected $attributes = ['all_groups' => true];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'all_groups' => 'boolean',
            'deactivated_at' => 'datetime',
            'notification_settings' => 'array',
        ];
    }

    /** The club's owner: an admin other admins can't deactivate or change. */
    public function isOwner(): bool
    {
        return $this->id !== null && Club::current()->owner_id === $this->id;
    }

    /** False only for a kind of notification this admin turned off. */
    public function wantsNotification(string $type): bool
    {
        if ($this->role !== 'admin' || ! in_array($type, self::ADMIN_NOTIFICATIONS, true)) {
            return true;
        }

        return ($this->notification_settings[$type] ?? true) !== false;
    }

    /**
     * Never removed from the database: a deleted staff account is only hidden,
     * because its trainings and salaries (the club's finances) depend on it.
     */
    public function forceDelete(): bool
    {
        throw new LogicException('Staff accounts are never removed from the database; delete() only hides them.');
    }

    /** A deactivated account can't log in until an admin activates it again. */
    public function isActive(): bool
    {
        return $this->deactivated_at === null;
    }

    /** Accounts that may log in (for notifications to admins, for example). */
    public function scopeActive(Builder $query): void
    {
        $query->whereNull('deactivated_at');
    }

    /** The devices where this person turned on push notifications. */
    public function pushSubscriptions(): HasMany
    {
        return $this->hasMany(PushSubscription::class);
    }

    public function trainings(): HasMany
    {
        return $this->hasMany(Training::class, 'coach_id');
    }

    /** The groups a coach is assigned to (unless they work with all groups). */
    public function coachGroups(): BelongsToMany
    {
        return $this->belongsToMany(Group::class, 'coach_groups')->withTimestamps();
    }

    /** @var list<int>|null */
    private ?array $visibleGroupIdsCache = null;

    /**
     * The main groups this user may see, add and edit; null means all of them
     * (admins, and coaches assigned to all groups).
     *
     * @return list<int>|null
     */
    public function visibleGroupIds(): ?array
    {
        if ($this->role !== 'coach' || $this->all_groups) {
            return null;
        }

        return $this->visibleGroupIdsCache ??= $this->coachGroups()
            ->pluck('groups.id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    /** A member of one of this user's groups, or of all groups (no single group). */
    public function canSeeMember(Member $member): bool
    {
        return $member->group_id === null || $this->canSeeGroup($member->group_id);
    }

    public function canSeeGroup(int|string|null $groupId): bool
    {
        $ids = $this->visibleGroupIds();

        return $ids === null || in_array((int) $groupId, $ids, true);
    }
}
