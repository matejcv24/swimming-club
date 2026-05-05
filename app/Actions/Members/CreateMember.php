<?php

namespace App\Actions\Members;

use App\Models\ClubParent;
use App\Models\Member;
use App\Models\User;
use App\Notifications\MemberChangedNotification;

class CreateMember
{
    /**
     * @param  array{name: string, pool: string, parent_name: string, parent_email?: string|null, parent_phone: string}  $data
     */
    public function handle(array $data, ?User $actor): Member
    {
        $parent = ClubParent::create([
            'name' => $data['parent_name'],
            'email' => $data['parent_email'] ?? null,
            'phone' => $data['parent_phone'],
        ]);

        $member = Member::create([
            'name' => $data['name'],
            'pool' => $data['pool'],
            'status' => 'active',
            'parent_id' => $parent->id,
        ]);

        if ($actor?->role === 'coach') {
            $admins = User::where('role', 'admin')->get();

            foreach ($admins as $admin) {
                $admin->notify(new MemberChangedNotification(
                    $actor->name.' added a new member '.$member->name,
                    '/members?member='.$member->id
                ));
            }
        }

        return $member->load('parent');
    }
}
