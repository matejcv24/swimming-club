<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

#[Fillable(['name', 'surname', 'phone', 'email', 'password', 'role', 'appearance', 'all_groups'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

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
        ];
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

    public function canSeeGroup(int|string|null $groupId): bool
    {
        $ids = $this->visibleGroupIds();

        return $ids === null || in_array((int) $groupId, $ids, true);
    }
}
