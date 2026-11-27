<?php

namespace App\Support;

use App\Models\ClubMembership;
use App\Models\ClubNotification;
use App\Models\User;

/**
 * The "My clubs" list of the avatar menu: only for someone active in two or more
 * clubs. Each club with its logo, the person's role there, whether it's the one
 * they are working in, and how many unread notifications wait there.
 */
class MyClubs
{
    /** @return list<array{id: int, name: string, logo_url: ?string, role: string, current: bool, unread: int}> */
    public static function for(User $user): array
    {
        $memberships = ClubMembership::query()
            ->with('club')
            ->where('user_id', $user->id)
            ->whereNull('deactivated_at')
            ->orderBy('id')
            ->get();

        if ($memberships->count() < 2) {
            return [];
        }

        $unread = ClubNotification::withoutGlobalScope('club')
            ->where('notifiable_type', $user::class)
            ->where('notifiable_id', $user->id)
            ->whereNull('read_at')
            ->selectRaw('club_id, count(*) as unread')
            ->groupBy('club_id')
            ->pluck('unread', 'club_id');

        $currentId = CurrentClub::id();

        return $memberships->map(fn (ClubMembership $membership) => [
            'id' => $membership->club_id,
            'name' => $membership->club->name,
            'logo_url' => $membership->club->logoUrl(),
            'role' => $membership->role,
            'current' => $membership->club_id === $currentId,
            'unread' => (int) ($unread[$membership->club_id] ?? 0),
        ])->values()->all();
    }
}
