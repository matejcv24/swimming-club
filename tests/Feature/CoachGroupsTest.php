<?php

namespace Tests\Feature;

use App\Models\ClubParent;
use App\Models\Member;
use App\Models\MembershipFee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CoachGroupsTest extends TestCase
{
    use RefreshDatabase;

    private function member(string $name, int $groupId): Member
    {
        $parent = ClubParent::create(['name' => 'Parent of '.$name, 'phone' => '070000000']);

        return Member::create(['name' => $name, 'group_id' => $groupId, 'status' => 'active', 'parent_id' => $parent->id]);
    }

    /** A coach assigned only to the Small pool. */
    private function smallPoolCoach(): User
    {
        $coach = User::factory()->create(['role' => 'coach', 'all_groups' => false]);
        $coach->coachGroups()->sync([$this->group('Small pool')]);

        return $coach;
    }

    public function test_admin_creates_a_coach_with_groups_and_groups_are_required()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $small = $this->group('Small pool');
        $big = $this->group('Big pool');
        $data = ['name' => 'Coach', 'email' => 'coach@example.com', 'password' => 'secret-pass'];

        $this->actingAs($admin)->post('/staff', $data)->assertSessionHasErrors('all_groups');
        $this->actingAs($admin)->post('/staff', [...$data, 'all_groups' => false, 'group_ids' => []])->assertSessionHasErrors('group_ids');

        $this->actingAs($admin)->post('/staff', [...$data, 'all_groups' => false, 'group_ids' => [$small, $big]])->assertSessionHasNoErrors();

        $coach = User::where('email', 'coach@example.com')->firstOrFail();
        $this->assertFalse($coach->all_groups);
        $this->assertEqualsCanonicalizing([$small, $big], $coach->coachGroups()->pluck('groups.id')->all());

        $this->actingAs($admin)->get('/staff')->assertInertia(fn (Assert $page) => $page
            ->where('staff.0.all_groups', false)
            ->has('staff.0.group_ids', 2));
    }

    public function test_admin_changes_a_coachs_groups()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $coach = $this->smallPoolCoach();
        $big = $this->group('Big pool');

        $this->actingAs($admin)->put("/staff/{$coach->id}", ['name' => $coach->name, 'email' => $coach->email, 'all_groups' => false, 'group_ids' => [$big]])
            ->assertSessionHasNoErrors();
        $this->assertSame([$big], $coach->fresh()->visibleGroupIds());

        $this->actingAs($admin)->put("/staff/{$coach->id}", ['name' => $coach->name, 'email' => $coach->email, 'all_groups' => true])
            ->assertSessionHasNoErrors();
        $this->assertNull($coach->fresh()->visibleGroupIds());
        $this->assertSame(0, $coach->coachGroups()->count());
    }

    public function test_a_coach_only_sees_members_of_their_groups()
    {
        $coach = $this->smallPoolCoach();
        $this->member('Big Bojan', $this->group('Big pool'));
        $ana = $this->member('Small Ana', $this->group('Small pool'));

        $this->actingAs($coach)->get('/members')->assertInertia(fn (Assert $page) => $page
            ->has('members', 1)
            ->where('members.0.name', 'Small Ana')
            ->has('groups', 1)
            ->where('groups.0.name', 'Small pool'));

        foreach (['/trainings', '/attendance'] as $url) {
            $this->actingAs($coach)->get($url)->assertInertia(fn (Assert $page) => $page
                ->has('members', 1)
                ->where('members.0.id', $ana->id));
        }

        $this->actingAs($coach)->get('/unpaid-fees')->assertInertia(fn (Assert $page) => $page
            ->has('unpaidMembers', 1)
            ->where('unpaidMembers.0.name', 'Small Ana'));

        $this->actingAs($coach)->get('/dashboard')->assertInertia(fn (Assert $page) => $page
            ->where('activeMembers', 1));
    }

    public function test_a_coach_cannot_add_or_edit_outside_their_groups()
    {
        $coach = $this->smallPoolCoach();
        $big = $this->group('Big pool');
        $small = $this->group('Small pool');
        $bojan = $this->member('Big Bojan', $big);
        $ana = $this->member('Small Ana', $small);
        $member = ['name' => 'X', 'status' => 'active', 'parent_name' => 'P', 'parent_phone' => '070000000'];

        // Members
        $this->actingAs($coach)->post('/members', [...$member, 'group_id' => $big])->assertSessionHasErrors('group_id');
        $this->actingAs($coach)->post('/members', [...$member, 'group_id' => $small])->assertSessionHasNoErrors();
        $this->actingAs($coach)->put("/members/{$bojan->id}", [...$member, 'group_id' => $big])->assertForbidden();
        $this->actingAs($coach)->put("/members/{$ana->id}", [...$member, 'group_id' => $big])->assertSessionHasErrors('group_id');

        // Trainings
        $this->actingAs($coach)->post('/trainings', ['date' => '2026-11-10', 'group_id' => $big, 'member_ids' => [$bojan->id]])->assertForbidden();
        $this->actingAs($coach)->getJson("/trainings/by-date?date=2026-11-10&group_id={$big}")->assertForbidden();
        $this->actingAs($coach)->post('/trainings', ['date' => '2026-11-10', 'group_id' => $small, 'member_ids' => [$bojan->id]])->assertForbidden();
        $this->actingAs($coach)->post('/trainings', ['date' => '2026-11-10', 'group_id' => $small, 'member_ids' => [$ana->id]])->assertSessionHasNoErrors();

        // Payments
        $fee = ['amount' => 2000, 'payment_method' => 'cash', 'start_date' => '2026-11-01', 'end_date' => '2026-11-30'];
        $this->actingAs($coach)->post('/membership-fees', [...$fee, 'member_id' => $bojan->id])->assertSessionHasErrors('member_id');
        $this->actingAs($coach)->post('/membership-fees', [...$fee, 'member_id' => $ana->id])->assertSessionHasNoErrors();
        $this->actingAs($coach)->getJson("/membership-fees/by-member/{$bojan->id}")->assertForbidden();
    }

    public function test_a_coach_only_sees_payments_of_their_groups()
    {
        $coach = $this->smallPoolCoach();
        $bojan = $this->member('Big Bojan', $this->group('Big pool'));
        $ana = $this->member('Small Ana', $this->group('Small pool'));

        foreach ([$bojan, $ana] as $member) {
            MembershipFee::create(['member_id' => $member->id, 'member_name' => $member->name, 'group_id' => $member->group_id, 'amount' => 2000, 'payment_method' => 'cash', 'start_date' => '2026-11-01', 'end_date' => '2026-11-30']);
        }

        $this->actingAs($coach)->get('/membership-fees')->assertInertia(fn (Assert $page) => $page
            ->has('members', 1)
            ->missing('allFees')
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->has('allFees', 1)
                ->where('allFees.0.member_name', 'Small Ana')));
    }

    public function test_all_groups_day_overview_is_only_for_those_who_see_every_group()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $big = $this->group('Big pool');
        $small = $this->group('Small pool');
        $evening = \App\Models\Group::create(['name' => '18:00', 'parent_id' => $big, 'position' => 1])->id;
        $bojan = $this->member('Big Bojan', $big);
        $ana = $this->member('Small Ana', $small);

        $this->actingAs($admin)->post('/trainings', ['date' => '2026-11-10', 'group_id' => $small, 'member_ids' => [$ana->id]]);
        $this->actingAs($admin)->post('/trainings', ['date' => '2026-11-10', 'group_id' => $big, 'subgroup_id' => $evening, 'member_ids' => [$bojan->id]]);
        $this->actingAs($admin)->post('/trainings', ['date' => '2026-11-10', 'group_id' => $big, 'member_ids' => [$bojan->id]]);

        // Every group, in the groups' order: a group's subgroups before its whole-group training
        $this->actingAs($admin)->getJson('/trainings/by-date?date=2026-11-10&summary=1')
            ->assertJsonCount(3, 'sections')
            ->assertJsonPath('sections.0.group_name', 'Big pool')
            ->assertJsonPath('sections.0.name', '18:00')
            ->assertJsonPath('sections.1.group_name', 'Big pool')
            ->assertJsonPath('sections.1.name', null)
            ->assertJsonPath('sections.2.group_name', 'Small pool')
            ->assertJsonPath('sections.2.members.0.name', 'Small Ana');

        $allGroupsCoach = User::factory()->create(['role' => 'coach']);
        $this->actingAs($allGroupsCoach)->getJson('/trainings/by-date?date=2026-11-10&summary=1')->assertJsonCount(3, 'sections');
        $this->actingAs($allGroupsCoach)->get('/trainings')->assertInertia(fn (Assert $page) => $page->where('canSeeAllGroups', true));

        $coach = $this->smallPoolCoach();
        $this->actingAs($coach)->getJson('/trainings/by-date?date=2026-11-10&summary=1')->assertForbidden();
        $this->actingAs($coach)->get('/trainings')->assertInertia(fn (Assert $page) => $page->where('canSeeAllGroups', false));
        // A single group's day still works for them
        $this->actingAs($coach)->getJson("/trainings/by-date?date=2026-11-10&group_id={$small}&summary=1")->assertJsonCount(1, 'sections');

        // Without a group and not an overview, the group is required
        $this->actingAs($admin)->getJson('/trainings/by-date?date=2026-11-10')->assertJsonValidationErrors('group_id');
    }

    public function test_coaches_with_all_groups_and_admins_see_everyone()
    {
        $this->member('Big Bojan', $this->group('Big pool'));
        $this->member('Small Ana', $this->group('Small pool'));

        foreach ([User::factory()->create(['role' => 'coach']), User::factory()->create(['role' => 'admin'])] as $user) {
            $this->actingAs($user)->get('/members')->assertInertia(fn (Assert $page) => $page
                ->has('members', 2)
                ->has('groups', 2));
        }
    }
}
