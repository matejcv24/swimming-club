<?php

namespace App\Actions\Members;

use App\Models\Member;
use App\Models\User;
use App\Notifications\MemberChangedNotification;

class UpdateMember
{
    /**
     * @param  array{name: string, pool: string, status: string, parent_name: string, parent_email?: string|null, parent_phone: string}  $data
     */
    public function handle(Member $member, array $data, ?User $actor): Member
    {
        $changes = [];

        if ($member->name !== $data['name']) {
            $changes[] = 'name';
        }

        if ($member->pool !== $data['pool']) {
            $changes[] = 'pool';
        }

        if ($member->status !== $data['status']) {
            $changes[] = 'status';
        }

        if (($member->parent?->name ?? '') !== $data['parent_name']) {
            $changes[] = 'parent name';
        }

        if (($member->parent?->email ?? '') !== ($data['parent_email'] ?? null)) {
            $changes[] = 'parent email';
        }

        if (($member->parent?->phone ?? '') !== $data['parent_phone']) {
            $changes[] = 'parent phone';
        }

        $member->update([
            'name' => $data['name'],
            'pool' => $data['pool'],
            'status' => $data['status'],
        ]);

        if ($member->parent) {
            $member->parent->update([
                'name' => $data['parent_name'],
                'email' => $data['parent_email'] ?? null,
                'phone' => $data['parent_phone'],
            ]);
        }

        if ($actor?->role === 'coach' && count($changes) > 0) {
            $admins = User::where('role', 'admin')->get();
            $changeSummary = implode(', ', $changes);

            foreach ($admins as $admin) {
                $admin->notify(new MemberChangedNotification(
                    $actor->name.' updated '.$changeSummary.' for '.$member->name,
                    '/members?member='.$member->id
                ));
            }
        }

        return $member->load('parent');
    }
}
