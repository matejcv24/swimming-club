<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Support\CurrentClub;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
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

    /** The role in the current club goes to the pages with the rest of the account. */
    protected $appends = ['role'];

    /**
     * Role, groups, settings and the active state belong to a club membership, not
     * to the person. Values set on the user wait here until it's saved.
     *
     * @var array<string, mixed>
     */
    private array $pendingMembership = [];

    private ?ClubMembership $membershipCache = null;

    protected static function booted(): void
    {
        static::saved(fn (User $user) => $user->saveMembership());
    }

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
        ];
    }

    /** The bell's notifications, of the current club only (newest first). */
    public function notifications(): MorphMany
    {
        return $this->morphMany(ClubNotification::class, 'notifiable')->latest();
    }

    /** Every club this person works in (removed ones not included). */
    public function memberships(): HasMany
    {
        return $this->hasMany(ClubMembership::class);
    }

    /** This person's membership in the current club, if they have one. */
    public function membership(): ?ClubMembership
    {
        $clubId = CurrentClub::id();

        if ($clubId === null || $this->id === null) {
            return null;
        }

        if ($this->membershipCache?->club_id !== $clubId) {
            $this->membershipCache = $this->memberships()->where('club_id', $clubId)->first();
        }

        return $this->membershipCache;
    }

    /** admin or coach in the current club (null: not in this club). */
    protected function role(): Attribute
    {
        return $this->membershipAttribute('role');
    }

    /** A coach working with every group of the club. */
    protected function allGroups(): Attribute
    {
        return $this->membershipAttribute('all_groups');
    }

    /** When the club deactivated this person (null: active). */
    protected function deactivatedAt(): Attribute
    {
        return $this->membershipAttribute('deactivated_at');
    }

    /** The kinds of notifications an admin turned on or off in this club. */
    protected function notificationSettings(): Attribute
    {
        return $this->membershipAttribute('notification_settings');
    }

    /**
     * Reads from and writes to the membership. (No return type on purpose:
     * Eloquent would take a method returning Attribute for an attribute itself.)
     *
     * @return Attribute<mixed, mixed>
     */
    private function membershipAttribute(string $key)
    {
        return Attribute::make(
            get: fn () => array_key_exists($key, $this->pendingMembership)
                ? $this->membershipValue($key, $this->pendingMembership[$key])
                : $this->membership()?->{$key},
            set: function ($value) use ($key) {
                $this->pendingMembership[$key] = $value;

                return [];
            },
        )->withoutObjectCaching();
    }

    /** A waiting value read the same way the saved one would be. */
    private function membershipValue(string $key, mixed $value): mixed
    {
        $membership = new ClubMembership;
        $membership->{$key} = $value;

        return $membership->{$key};
    }

    /**
     * Saves the waiting role, groups, settings or state into the membership in the
     * current club. A new person gets one there (a coach unless told otherwise); a
     * person removed from the club earlier is brought back.
     */
    private function saveMembership(): void
    {
        $clubId = CurrentClub::id();
        $pending = $this->pendingMembership;
        $this->pendingMembership = [];

        if ($clubId === null || ($pending === [] && ! $this->wasRecentlyCreated)) {
            return;
        }

        $membership = $this->memberships()->withTrashed()->firstOrNew(['club_id' => $clubId]);

        // Someone of another club is added to this one only with a role
        if (! $membership->exists && ! $this->wasRecentlyCreated && ! array_key_exists('role', $pending)) {
            return;
        }

        $membership->fill($pending);

        if ($membership->trashed()) {
            $membership->deleted_at = null;
        }

        $membership->save();
        $this->membershipCache = $membership;
    }

    /** Removes this person from the current club's team; their data there stays. */
    public function leaveCurrentClub(): void
    {
        $this->membership()?->delete();
        $this->membershipCache = null;
    }

    /**
     * People of the current club (optionally with these roles).
     *
     * @param  string|list<string>|null  $roles
     */
    public function scopeInCurrentClub(Builder $query, string|array|null $roles = null): void
    {
        $query->whereHas('memberships', fn (Builder $membership) => $membership
            ->where('club_id', CurrentClub::id())
            ->when($roles !== null, fn (Builder $q) => $q->whereIn('role', (array) $roles)));
    }

    /** "/staff/{coach}": only someone of the current club; anyone else is not found. */
    public function resolveRouteBinding($value, $field = null)
    {
        return $this->newQuery()->inCurrentClub()->where($field ?? $this->getRouteKeyName(), $value)->first();
    }

    /** The club's owner: an admin other admins can't deactivate or change. */
    public function isOwner(): bool
    {
        return $this->id !== null && CurrentClub::get()?->owner_id === $this->id;
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

    /**
     * In the current club and not deactivated there. Someone with no place in the
     * club is not active either, so they can't work in it.
     */
    public function isActive(): bool
    {
        return $this->membership() !== null && $this->deactivated_at === null;
    }

    /** Active in at least one club: only then can this person sign in. */
    public function canWorkInAnyClub(): bool
    {
        return $this->memberships()->whereNull('deactivated_at')->exists();
    }

    /** People who may work in the current club (for notifications to admins, for example). */
    public function scopeActive(Builder $query): void
    {
        $query->whereHas('memberships', fn (Builder $membership) => $membership
            ->where('club_id', CurrentClub::id())
            ->whereNull('deactivated_at'));
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
