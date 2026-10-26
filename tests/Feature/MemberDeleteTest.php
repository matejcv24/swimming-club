<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\ClubParent;
use App\Models\Member;
use App\Models\MembershipFee;
use App\Models\Training;
use App\Models\User;
use App\Notifications\MemberChangedNotification;
use App\Notifications\MembershipPaymentNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MemberDeleteTest extends TestCase
{
    use RefreshDatabase;

    private function createMemberWithData(string $name, ?ClubParent $parent = null): Member
    {
        $parent ??= ClubParent::create(['name' => "Parent of {$name}", 'phone' => '070000000']);

        $member = Member::create([
            'name' => $name,
            'pool' => 'small',
            'status' => 'active',
            'parent_id' => $parent->id,
        ]);

        MembershipFee::create([
            'member_id' => $member->id,
            'member_name' => $member->name,
            'pool' => $member->pool,
            'amount' => 1500,
            'payment_method' => 'cash',
            'start_date' => '2026-10-01',
            'end_date' => '2026-10-31',
        ]);

        $training = Training::firstOrCreate(
            ['date' => '2026-10-20', 'pool' => 'small'],
            ['coach_id' => User::factory()->create(['role' => 'coach'])->id],
        );
        Attendance::create(['training_id' => $training->id, 'member_id' => $member->id, 'present' => true]);

        return $member;
    }

    public function test_admin_can_delete_member_with_all_related_data()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $member = $this->createMemberWithData('Duplicate');
        $other = $this->createMemberWithData('Keep Me');
        $parentId = $member->parent_id;

        $admin->notify(new MemberChangedNotification('Coach added a new member Duplicate', "/members?member={$member->id}"));
        $admin->notify(new MembershipPaymentNotification('Coach recorded new payment for Duplicate', "/membership-fees?member={$member->id}&history=1"));
        $admin->notify(new MemberChangedNotification('Coach added a new member Keep Me', "/members?member={$other->id}"));

        $this->actingAs($admin)
            ->delete("/members/{$member->id}")
            ->assertSessionHasNoErrors();

        $this->assertModelMissing($member);
        $this->assertDatabaseMissing('membership_fees', ['member_id' => $member->id]);
        $this->assertDatabaseMissing('attendances', ['member_id' => $member->id]);
        $this->assertDatabaseMissing('parents', ['id' => $parentId]);
        $this->assertSame(1, $admin->notifications()->count());
        $this->assertSame("/members?member={$other->id}", $admin->notifications()->first()->data['url']);

        $this->assertModelExists($other);
        $this->assertDatabaseHas('membership_fees', ['member_id' => $other->id]);
        $this->assertDatabaseHas('attendances', ['member_id' => $other->id]);
        $this->assertDatabaseHas('parents', ['id' => $other->parent_id]);
    }

    public function test_shared_parent_is_kept_when_another_member_uses_it()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $parent = ClubParent::create(['name' => 'Shared Parent', 'phone' => '070000000']);
        $first = $this->createMemberWithData('Sibling One', $parent);
        $this->createMemberWithData('Sibling Two', $parent);

        $this->actingAs($admin)->delete("/members/{$first->id}");

        $this->assertModelMissing($first);
        $this->assertDatabaseHas('parents', ['id' => $parent->id]);
    }

    public function test_coach_cannot_delete_member()
    {
        $coach = User::factory()->create(['role' => 'coach']);
        $member = $this->createMemberWithData('Protected');

        $this->actingAs($coach)
            ->delete("/members/{$member->id}")
            ->assertForbidden();

        $this->assertModelExists($member);
        $this->assertDatabaseHas('membership_fees', ['member_id' => $member->id]);
    }

    public function test_members_page_tells_frontend_the_user_role()
    {
        $coach = User::factory()->create(['role' => 'coach']);

        $this->actingAs($coach)->get('/members')
            ->assertInertia(fn ($page) => $page->where('userRole', 'coach'));
    }
}
