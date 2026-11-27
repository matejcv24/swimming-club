<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\ClubParent;
use App\Models\Group;
use App\Models\Member;
use App\Models\Training;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SubgroupTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function subgroup(string $name, int $parentId): int
    {
        return Group::create(['name' => $name, 'parent_id' => $parentId, 'position' => 1])->id;
    }

    private function member(string $name, int $groupId, ?int $subgroupId = null): Member
    {
        $parent = ClubParent::create(['name' => 'Parent of '.$name, 'phone' => '070000000']);

        return Member::create([
            'name' => $name,
            'group_id' => $groupId,
            'subgroup_id' => $subgroupId,
            'status' => 'active',
            'parent_id' => $parent->id,
        ]);
    }

    public function test_admin_adds_subgroups_and_they_are_shared_under_their_group()
    {
        $admin = $this->admin();
        $big = $this->group('Big pool');
        $small = $this->group('Small pool');

        $this->actingAs($admin)->post('/groups', ['name' => '18:00', 'parent_id' => $big])->assertSessionHasNoErrors();
        $this->actingAs($admin)->post('/groups', ['name' => '19:00', 'parent_id' => $big])->assertSessionHasNoErrors();
        // The same name may be used under another group, but not twice in one
        $this->actingAs($admin)->post('/groups', ['name' => '18:00', 'parent_id' => $small])->assertSessionHasNoErrors();
        $this->actingAs($admin)->post('/groups', ['name' => '18:00', 'parent_id' => $big])->assertSessionHasErrors('name');

        $eighteen = Group::where('name', '18:00')->where('parent_id', $big)->value('id');
        $this->member('Ana', $big, $eighteen);

        // Subgroups of subgroups are not allowed
        $this->actingAs($admin)->post('/groups', ['name' => 'Lane 1', 'parent_id' => $eighteen])->assertSessionHasErrors('parent_id');

        $this->actingAs($admin)
            ->get('/trainings')
            ->assertInertia(fn (Assert $page) => $page
                ->has('groups', 2)
                ->where('groups.0.name', 'Big pool')
                ->where('groups.0.subgroups.0.name', '18:00')
                ->where('groups.0.subgroups.0.members_count', 1)
                ->where('groups.0.subgroups.1.name', '19:00')
                ->where('groups.1.subgroups.0.name', '18:00')
                ->where('canManageGroups', true));
    }

    public function test_coaches_cannot_add_subgroups()
    {
        $coach = User::factory()->create(['role' => 'coach']);

        $this->actingAs($coach)->post('/groups', ['name' => '18:00', 'parent_id' => $this->group('Big pool')])->assertForbidden();
        $this->actingAs($coach)->get('/trainings')->assertInertia(fn (Assert $page) => $page->where('canManageGroups', false));
    }

    public function test_a_member_subgroup_must_belong_to_their_group()
    {
        $admin = $this->admin();
        $big = $this->group('Big pool');
        $small = $this->group('Small pool');
        $bigEvening = $this->subgroup('18:00', $big);
        $member = $this->member('Ana', $big);

        $data = ['name' => 'Ana', 'status' => 'active', 'parent_name' => 'Parent', 'parent_phone' => '070000000'];

        $this->actingAs($admin)->put("/members/{$member->id}", [...$data, 'group_id' => $small, 'subgroup_id' => $bigEvening])
            ->assertSessionHasErrors('subgroup_id');
        // A subgroup cannot be used as a main group
        $this->actingAs($admin)->put("/members/{$member->id}", [...$data, 'group_id' => $bigEvening])
            ->assertSessionHasErrors('group_id');

        $this->actingAs($admin)->put("/members/{$member->id}", [...$data, 'group_id' => $big, 'subgroup_id' => $bigEvening])
            ->assertSessionHasNoErrors();
        $this->assertSame($bigEvening, $member->fresh()->subgroup_id);

        $this->actingAs($admin)->put("/members/{$member->id}", [...$data, 'group_id' => $big, 'subgroup_id' => null])
            ->assertSessionHasNoErrors();
        $this->assertNull($member->fresh()->subgroup_id);
    }

    public function test_deleting_a_subgroup_moves_its_members_where_chosen()
    {
        $admin = $this->admin();
        $big = $this->group('Big pool');
        $small = $this->group('Small pool');
        $eighteen = $this->subgroup('18:00', $big);
        $smallNineteen = $this->subgroup('19:00', $small);
        $ana = $this->member('Ana', $big, $eighteen);
        $bojan = $this->member('Bojan', $big, $eighteen);

        $this->actingAs($admin)->delete("/groups/{$eighteen}")->assertSessionHasErrors('move_to_group_id');
        $this->actingAs($admin)->delete("/groups/{$eighteen}", ['move_to_group_id' => $eighteen])->assertSessionHasErrors('move_to_group_id');

        // Into another group's subgroup: their main group follows
        $this->actingAs($admin)->delete("/groups/{$eighteen}", ['move_to_group_id' => $smallNineteen])->assertSessionHasNoErrors();

        $this->assertSoftDeleted('groups', ['id' => $eighteen]);
        foreach ([$ana, $bojan] as $member) {
            $this->assertSame($small, $member->fresh()->group_id);
            $this->assertSame($smallNineteen, $member->fresh()->subgroup_id);
        }
    }

    public function test_deleting_a_subgroup_can_move_members_back_to_the_whole_group()
    {
        $admin = $this->admin();
        $big = $this->group('Big pool');
        $eighteen = $this->subgroup('18:00', $big);
        $ana = $this->member('Ana', $big, $eighteen);

        $this->actingAs($admin)->delete("/groups/{$eighteen}", ['move_to_group_id' => $big])->assertSessionHasNoErrors();

        $this->assertSame($big, $ana->fresh()->group_id);
        $this->assertNull($ana->fresh()->subgroup_id);
    }

    public function test_deleting_a_group_deletes_its_subgroups_and_moves_members()
    {
        $admin = $this->admin();
        $big = $this->group('Big pool');
        $small = $this->group('Small pool');
        $eighteen = $this->subgroup('18:00', $big);
        $ana = $this->member('Ana', $big, $eighteen);

        // Its own subgroup is not a valid destination
        $this->actingAs($admin)->delete("/groups/{$big}", ['move_to_group_id' => $eighteen])->assertSessionHasErrors('move_to_group_id');

        $this->actingAs($admin)->delete("/groups/{$big}", ['move_to_group_id' => $small])->assertSessionHasNoErrors();

        $this->assertSoftDeleted('groups', ['id' => $big]);
        $this->assertSoftDeleted('groups', ['id' => $eighteen]);
        $this->assertSame($small, $ana->fresh()->group_id);
        $this->assertNull($ana->fresh()->subgroup_id);
    }

    public function test_whole_group_overview_lists_who_came_per_subgroup()
    {
        $admin = $this->admin();
        $big = $this->group('Big pool');
        $nineteen = $this->subgroup('19:00', $big);
        $eighteen = Group::create(['name' => '18:00', 'parent_id' => $big, 'position' => 0])->id;
        // No subgroup of their own: they can still be recorded in any subgroup
        $ana = $this->member('Ana', $big);
        $bojan = $this->member('Bojan', $big, $nineteen);
        $cvete = $this->member('Cvete', $big);

        $this->actingAs($admin)->post('/trainings', ['date' => '2026-11-10', 'group_id' => $big, 'subgroup_id' => $nineteen, 'member_ids' => [$bojan->id]]);
        $this->actingAs($admin)->post('/trainings', ['date' => '2026-11-10', 'group_id' => $big, 'subgroup_id' => $eighteen, 'member_ids' => [$cvete->id, $ana->id]]);
        $this->actingAs($admin)->post('/trainings', ['date' => '2026-11-10', 'group_id' => $big, 'member_ids' => [$ana->id]]);

        $this->actingAs($admin)->getJson("/trainings/by-date?date=2026-11-10&group_id={$big}&summary=1")
            ->assertJsonCount(3, 'sections')
            ->assertJsonPath('sections.0.name', '18:00')
            ->assertJsonPath('sections.0.members.*.name', ['Ana', 'Cvete'])
            ->assertJsonPath('sections.1.name', '19:00')
            ->assertJsonPath('sections.1.members.*.name', ['Bojan'])
            ->assertJsonPath('sections.2.subgroup_id', null)
            ->assertJsonPath('sections.2.members.*.name', ['Ana'])
            // Everything the Member Details pop-up shows
            ->assertJsonPath('sections.1.members.0', [
                'id' => $bojan->id,
                'name' => 'Bojan',
                'status' => 'active',
                'group_id' => $big,
                'subgroup_id' => $nineteen,
                'parent' => ['name' => 'Parent of Bojan', 'phone' => '070000000'],
            ]);

        $this->actingAs($admin)->getJson("/trainings/by-date?date=2026-11-11&group_id={$big}&summary=1")
            ->assertExactJson(['sections' => []]);
    }

    public function test_attendance_is_kept_per_subgroup()
    {
        $admin = $this->admin();
        $big = $this->group('Big pool');
        $eighteen = $this->subgroup('18:00', $big);
        $nineteen = $this->subgroup('19:00', $big);
        $ana = $this->member('Ana', $big, $eighteen);
        $bojan = $this->member('Bojan', $big, $nineteen);

        $this->actingAs($admin)->post('/trainings', ['date' => '2026-11-10', 'group_id' => $big, 'subgroup_id' => $eighteen, 'member_ids' => [$ana->id]])
            ->assertSessionHasNoErrors();
        $this->actingAs($admin)->post('/trainings', ['date' => '2026-11-10', 'group_id' => $big, 'subgroup_id' => $nineteen, 'member_ids' => [$bojan->id]])
            ->assertSessionHasNoErrors();

        $this->assertSame(2, Training::count());
        $this->actingAs($admin)->getJson("/trainings/by-date?date=2026-11-10&group_id={$big}&subgroup_id={$eighteen}")
            ->assertJson(['member_ids' => [$ana->id]]);
        $this->actingAs($admin)->getJson("/trainings/by-date?date=2026-11-10&group_id={$big}&subgroup_id={$nineteen}")
            ->assertJson(['member_ids' => [$bojan->id]]);
        // The whole group's training of that day is a separate one (none yet)
        $this->actingAs($admin)->getJson("/trainings/by-date?date=2026-11-10&group_id={$big}")
            ->assertJson(['member_ids' => []]);

        // Clearing one subgroup leaves the other alone
        $this->actingAs($admin)->post('/trainings', ['date' => '2026-11-10', 'group_id' => $big, 'subgroup_id' => $eighteen, 'member_ids' => []]);
        $this->assertSame(1, Training::count());
        $this->assertSame([$bojan->id], Attendance::pluck('member_id')->all());

        // A subgroup of another group is refused
        $small = $this->group('Small pool');
        $this->actingAs($admin)->post('/trainings', ['date' => '2026-11-10', 'group_id' => $small, 'subgroup_id' => $nineteen, 'member_ids' => []])
            ->assertSessionHasErrors('subgroup_id');
    }

    /**
     * The group limits who can be marked present; the subgroup doesn't (it's only
     * for statistics). A member of "18:00" is on every subgroup's list of their group.
     */
    public function test_a_member_of_one_subgroup_can_be_present_in_every_subgroup_of_their_group()
    {
        $admin = $this->admin();
        $advanced = Group::create(['name' => 'Advanced'])->id;
        $eighteen = $this->subgroup('18:00', $advanced);
        $nineteen = $this->subgroup('19:00', $advanced);
        $ana = $this->member('Ana', $advanced, $eighteen);
        $other = $this->member('Other group', Group::create(['name' => 'Beginners'])->id);

        // The attendance page gets every active member; the page lists a group's
        // members by their group only (resources/js/pages/trainings/index.tsx)
        $this->actingAs($admin)->get('/trainings')
            ->assertInertia(fn (Assert $page) => $page->where('members', fn ($members) => collect($members)->contains('id', $ana->id)));

        $this->actingAs($admin)->post('/trainings', ['date' => '2026-11-12', 'group_id' => $advanced, 'subgroup_id' => $nineteen, 'member_ids' => [$ana->id]])
            ->assertSessionHasNoErrors();
        $this->actingAs($admin)->getJson("/trainings/by-date?date=2026-11-12&group_id={$advanced}&subgroup_id={$nineteen}")
            ->assertJson(['member_ids' => [$ana->id]]);

        // Her subgroup stays 18:00 for the statistics
        $this->assertSame($eighteen, $ana->fresh()->subgroup_id);
        $this->assertNotNull($other);
    }
}
