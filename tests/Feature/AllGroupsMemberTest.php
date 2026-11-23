<?php

namespace Tests\Feature;

use App\Models\ClubParent;
use App\Models\Group;
use App\Models\Member;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** A member without a single group trains in all groups. */
class AllGroupsMemberTest extends TestCase
{
    use RefreshDatabase;

    private function memberOfAllGroups(): Member
    {
        $parent = ClubParent::create(['name' => 'Parent', 'phone' => '070000000']);

        return Member::create(['name' => 'Ana', 'group_id' => null, 'status' => 'active', 'parent_id' => $parent->id]);
    }

    public function test_a_new_member_can_be_in_all_groups_and_then_has_no_subgroup()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $evening = Group::create(['name' => '18:00', 'parent_id' => $this->group('Small pool')])->id;

        $data = ['name' => 'Ana', 'group_id' => '', 'parent_name' => 'Parent', 'parent_phone' => '070000000'];

        // A subgroup belongs to one group, so it can't go with all groups
        $this->actingAs($admin)->post('/members', [...$data, 'subgroup_id' => $evening])
            ->assertSessionHasErrors('subgroup_id');

        $this->actingAs($admin)->post('/members', [...$data, 'subgroup_id' => ''])
            ->assertSessionHasNoErrors();

        $ana = Member::where('name', 'Ana')->firstOrFail();
        $this->assertNull($ana->group_id);
        $this->assertNull($ana->subgroup_id);
    }

    public function test_every_coach_sees_edits_and_records_a_member_of_all_groups()
    {
        $coach = User::factory()->create(['role' => 'coach', 'all_groups' => false]);
        $coach->coachGroups()->sync([$this->group('Small pool')]);
        $ana = $this->memberOfAllGroups();

        $this->assertTrue(Member::visibleTo($coach)->whereKey($ana->id)->exists());

        $this->actingAs($coach)->put("/members/{$ana->id}", [
            'name' => 'Ana K.',
            'group_id' => '',
            'status' => 'active',
            'parent_name' => 'Parent',
            'parent_phone' => '070000000',
        ])->assertSessionHasNoErrors();
        $this->assertSame('Ana K.', $ana->fresh()->name);

        // Attendance in the coach's group, and her history
        $this->actingAs($coach)->post('/trainings', [
            'date' => '2026-11-20',
            'group_id' => $this->group('Small pool'),
            'member_ids' => [$ana->id],
        ])->assertSessionHasNoErrors();
        $this->actingAs($coach)->getJson("/attendance/by-member/{$ana->id}")->assertOk()->assertJsonCount(1, 'attendances');
    }

    public function test_a_payment_of_a_member_of_all_groups_has_no_group()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $ana = $this->memberOfAllGroups();

        $this->actingAs($admin)->post('/membership-fees', [
            'member_id' => $ana->id,
            'amount' => 1500,
            'payment_method' => 'cash',
            'start_date' => '2026-11-01',
            'end_date' => '2026-11-30',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('membership_fees', ['member_id' => $ana->id, 'group_id' => null]);
    }

    public function test_parent_details_are_optional()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->post('/members', ['name' => 'Ana', 'group_id' => ''])
            ->assertSessionHasNoErrors();
        $ana = Member::where('name', 'Ana')->firstOrFail();
        $this->assertNull($ana->parent_id);

        // Added later, then cleared again
        $edit = ['name' => 'Ana', 'group_id' => '', 'status' => 'active'];
        $this->actingAs($admin)->put("/members/{$ana->id}", [...$edit, 'parent_phone' => '070111222'])
            ->assertSessionHasNoErrors();
        $this->assertSame('070111222', $ana->fresh()->parent->phone);

        $this->actingAs($admin)->put("/members/{$ana->id}", $edit)->assertSessionHasNoErrors();
        $this->assertNull($ana->fresh()->parent->phone);
        $this->actingAs($admin)->get('/members')->assertOk();
    }
}
