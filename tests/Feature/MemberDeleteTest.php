<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\ClubParent;
use App\Models\Member;
use App\Models\MembershipFee;
use App\Models\Training;
use App\Models\User;
use App\Notifications\MemberChangedNotification;
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
            'group_id' => $this->group('Small pool'),
            'status' => 'active',
            'parent_id' => $parent->id,
        ]);

        MembershipFee::create([
            'member_id' => $member->id,
            'member_name' => $member->name,
            'group_id' => $member->group_id,
            'amount' => 1500,
            'payment_method' => 'cash',
            'start_date' => '2026-10-01',
            'end_date' => '2026-10-31',
        ]);

        $training = Training::firstOrCreate(
            ['date' => '2026-10-20', 'group_id' => $this->group('Small pool')],
            ['coach_id' => User::factory()->create(['role' => 'coach'])->id],
        );
        Attendance::create(['training_id' => $training->id, 'member_id' => $member->id, 'present' => true]);

        return $member;
    }

    public function test_deleting_a_member_hides_them_but_keeps_payments_attendance_and_parent()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $member = $this->createMemberWithData('Duplicate');
        $other = $this->createMemberWithData('Keep Me');
        $parentId = $member->parent_id;

        $admin->notify(new MemberChangedNotification('Coach added a new member Duplicate', "/members?member={$member->id}"));

        $this->actingAs($admin)
            ->delete("/members/{$member->id}")
            ->assertSessionHasNoErrors();

        // Hidden from every list, never removed from the database
        $this->assertSoftDeleted($member);
        $this->assertSame(['Keep Me'], Member::pluck('name')->all());
        $this->actingAs($admin)->get('/members')->assertInertia(fn ($page) => $page
            ->has('members', 1)
            ->where('members.0.name', 'Keep Me'));

        // The club's money and history stay exactly as they were
        $this->assertDatabaseHas('membership_fees', ['member_id' => $member->id, 'amount' => 1500]);
        $this->assertDatabaseHas('attendances', ['member_id' => $member->id]);
        $this->assertDatabaseHas('parents', ['id' => $parentId]);
        $this->assertSame(3000.0, (float) MembershipFee::sum('amount'));
        $this->assertSame(1, $admin->notifications()->count());
        $this->assertSame('Duplicate', MembershipFee::where('member_id', $member->id)->first()->member->name);

        $this->assertModelExists($other);
    }

    public function test_a_member_can_never_be_removed_from_the_database()
    {
        $member = $this->createMemberWithData('Kept');

        $this->expectException(\LogicException::class);
        $member->forceDelete();
    }

    public function test_a_deleted_member_comes_back_with_their_history_from_the_duplicate_warning()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $member = $this->createMemberWithData('Ana Petrova');
        $this->actingAs($admin)->delete("/members/{$member->id}");

        // Adding the same child again (same name and parent phone) offers to bring them back
        $response = $this->actingAs($admin)->post('/members', ['name' => 'Ana Petrova', 'parent_phone' => '070000000']);
        $response->assertSessionHasErrors('duplicate');
        $match = json_decode(session('errors')->first('duplicate'), true)[0];
        $this->assertSame($member->id, $match['id']);
        $this->assertTrue($match['deleted']);

        $this->actingAs($admin)->post("/members/{$member->id}/restore")->assertSessionHasNoErrors();

        $this->assertNotSoftDeleted($member);
        $this->assertSame(1, MembershipFee::where('member_id', $member->id)->count());
        $this->assertSame(1, Member::count());
    }

    public function test_shared_parent_is_kept_when_another_member_uses_it()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $parent = ClubParent::create(['name' => 'Shared Parent', 'phone' => '070000000']);
        $first = $this->createMemberWithData('Sibling One', $parent);
        $this->createMemberWithData('Sibling Two', $parent);

        $this->actingAs($admin)->delete("/members/{$first->id}");

        $this->assertSoftDeleted($first);
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
